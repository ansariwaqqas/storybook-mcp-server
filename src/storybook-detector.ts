import { promises as fs } from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { logger } from './logger';

export interface StorybookConfig {
  url: string;
  projectPath?: string;
  isManaged: boolean;
  process?: ChildProcess;
}

export class StorybookDetector {
  private commonPorts = [6006, 6007, 9009, 9010];
  private managedProcess?: ChildProcess;

  async detectStorybook(
    providedUrl?: string,
    projectPath?: string,
  ): Promise<StorybookConfig | null> {
    // 1. If URL is provided, validate it
    if (providedUrl) {
      const isValid = await this.validateStorybookUrl(providedUrl);
      if (isValid) {
        logger.info(`Using provided Storybook URL: ${providedUrl}`);
        return { url: providedUrl, isManaged: false };
      }
      logger.warn(`Provided URL ${providedUrl} is not responding`);
    }

    // 2. Check for running Storybook instances
    const runningUrl = await this.findRunningStorybook();
    if (runningUrl) {
      logger.info(`Found running Storybook at: ${runningUrl}`);
      return { url: runningUrl, isManaged: false };
    }

    // 3. Check if we can launch Storybook from project
    if (projectPath) {
      const launched = await this.launchStorybook(projectPath);
      if (launched) {
        return launched;
      }
    }

    // 4. Check current directory for Storybook
    const currentDirLaunched = await this.launchStorybook(process.cwd());
    if (currentDirLaunched) {
      return currentDirLaunched;
    }

    return null;
  }

  private async validateStorybookUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.get(`${url}/index.json`, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });
      return response.data && typeof response.data === 'object';
    } catch {
      return false;
    }
  }

  private async findRunningStorybook(): Promise<string | null> {
    for (const port of this.commonPorts) {
      const url = `http://localhost:${port}`;
      if (await this.validateStorybookUrl(url)) {
        return url;
      }
    }
    return null;
  }

  private async launchStorybook(projectPath: string): Promise<StorybookConfig | null> {
    try {
      // Check if directory exists
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        return null;
      }

      // Check for package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      // Look for Storybook scripts
      const scripts = packageJson.scripts || {};
      const storybookScript = this.findStorybookScript(scripts);

      if (!storybookScript) {
        logger.debug(`No Storybook script found in ${projectPath}`);
        return null;
      }

      // Detect package manager
      const packageManager = await this.detectPackageManager(projectPath);

      // Extract port from script if possible
      const port = this.extractPortFromScript(scripts[storybookScript]) || 6006;
      const url = `http://localhost:${port}`;

      // Check if already running
      if (await this.validateStorybookUrl(url)) {
        logger.info(`Storybook already running at ${url}`);
        return { url, projectPath, isManaged: false };
      }

      // Launch Storybook
      logger.info(
        `Launching Storybook from ${projectPath} using ${packageManager} run ${storybookScript}`,
      );

      const process = spawn(packageManager, ['run', storybookScript], {
        cwd: projectPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        shell: true,
      });

      this.managedProcess = process;

      // Handle process output
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        logger.debug(`Storybook output: ${output}`);
      });

      process.stderr?.on('data', (data) => {
        const output = data.toString();
        logger.debug(`Storybook error: ${output}`);
      });

      process.on('error', (error) => {
        logger.error('Failed to start Storybook:', error);
      });

      process.on('exit', (code) => {
        logger.info(`Storybook process exited with code ${code}`);
        this.managedProcess = undefined;
      });

      // Wait for Storybook to start
      const started = await this.waitForStorybook(url, 30000);

      if (started) {
        logger.info(`Storybook started successfully at ${url}`);
        return { url, projectPath, isManaged: true, process };
      } else {
        logger.error('Storybook failed to start within timeout');
        process.kill();
        return null;
      }
    } catch (error) {
      logger.error(`Failed to launch Storybook from ${projectPath}:`, error);
      return null;
    }
  }

  private findStorybookScript(scripts: Record<string, string>): string | null {
    // Common Storybook script names
    const scriptNames = ['storybook', 'dev:storybook', 'start:storybook', 'sb', 'story'];

    for (const name of scriptNames) {
      if (scripts[name] && scripts[name].includes('storybook')) {
        return name;
      }
    }

    // Check all scripts for storybook command
    for (const [name, script] of Object.entries(scripts)) {
      if (script.includes('storybook dev') || script.includes('start-storybook')) {
        return name;
      }
    }

    return null;
  }

  private extractPortFromScript(script: string): number | null {
    // Look for -p or --port flag
    const portMatch = script.match(/(?:-p|--port)\s+(\d+)/);
    if (portMatch) {
      return parseInt(portMatch[1], 10);
    }
    return null;
  }

  private async detectPackageManager(projectPath: string): Promise<string> {
    // Check for lock files
    try {
      await fs.access(path.join(projectPath, 'yarn.lock'));
      return 'yarn';
    } catch {}

    try {
      await fs.access(path.join(projectPath, 'pnpm-lock.yaml'));
      return 'pnpm';
    } catch {}

    try {
      await fs.access(path.join(projectPath, 'bun.lockb'));
      return 'bun';
    } catch {}

    return 'npm';
  }

  private async waitForStorybook(url: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 2000;

    while (Date.now() - startTime < timeout) {
      if (await this.validateStorybookUrl(url)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    return false;
  }

  async cleanup(): Promise<void> {
    if (this.managedProcess) {
      logger.info('Stopping managed Storybook process');
      this.managedProcess.kill();
      this.managedProcess = undefined;
    }
  }
}
