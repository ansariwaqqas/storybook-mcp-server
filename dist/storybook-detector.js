"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorybookDetector = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("./logger.js");
class StorybookDetector {
    commonPorts = [6006, 6007, 9009, 9010];
    managedProcess;
    async detectStorybook(providedUrl, projectPath) {
        // 1. If URL is provided, validate it
        if (providedUrl) {
            const isValid = await this.validateStorybookUrl(providedUrl);
            if (isValid) {
                logger_js_1.logger.info(`Using provided Storybook URL: ${providedUrl}`);
                return { url: providedUrl, isManaged: false };
            }
            logger_js_1.logger.warn(`Provided URL ${providedUrl} is not responding`);
        }
        // 2. Check for running Storybook instances
        const runningUrl = await this.findRunningStorybook();
        if (runningUrl) {
            logger_js_1.logger.info(`Found running Storybook at: ${runningUrl}`);
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
    async validateStorybookUrl(url) {
        try {
            const response = await axios_1.default.get(`${url}/index.json`, {
                timeout: 5000,
                validateStatus: (status) => status === 200
            });
            return response.data && typeof response.data === 'object';
        }
        catch {
            return false;
        }
    }
    async findRunningStorybook() {
        for (const port of this.commonPorts) {
            const url = `http://localhost:${port}`;
            if (await this.validateStorybookUrl(url)) {
                return url;
            }
        }
        return null;
    }
    async launchStorybook(projectPath) {
        try {
            // Check if directory exists
            const stats = await fs_1.promises.stat(projectPath);
            if (!stats.isDirectory()) {
                return null;
            }
            // Check for package.json
            const packageJsonPath = path_1.default.join(projectPath, 'package.json');
            const packageJson = JSON.parse(await fs_1.promises.readFile(packageJsonPath, 'utf-8'));
            // Look for Storybook scripts
            const scripts = packageJson.scripts || {};
            const storybookScript = this.findStorybookScript(scripts);
            if (!storybookScript) {
                logger_js_1.logger.debug(`No Storybook script found in ${projectPath}`);
                return null;
            }
            // Detect package manager
            const packageManager = await this.detectPackageManager(projectPath);
            // Extract port from script if possible
            const port = this.extractPortFromScript(scripts[storybookScript]) || 6006;
            const url = `http://localhost:${port}`;
            // Check if already running
            if (await this.validateStorybookUrl(url)) {
                logger_js_1.logger.info(`Storybook already running at ${url}`);
                return { url, projectPath, isManaged: false };
            }
            // Launch Storybook
            logger_js_1.logger.info(`Launching Storybook from ${projectPath} using ${packageManager} run ${storybookScript}`);
            const process = (0, child_process_1.spawn)(packageManager, ['run', storybookScript], {
                cwd: projectPath,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false,
                shell: true
            });
            this.managedProcess = process;
            // Handle process output
            process.stdout?.on('data', (data) => {
                const output = data.toString();
                logger_js_1.logger.debug(`Storybook output: ${output}`);
            });
            process.stderr?.on('data', (data) => {
                const output = data.toString();
                logger_js_1.logger.debug(`Storybook error: ${output}`);
            });
            process.on('error', (error) => {
                logger_js_1.logger.error('Failed to start Storybook:', error);
            });
            process.on('exit', (code) => {
                logger_js_1.logger.info(`Storybook process exited with code ${code}`);
                this.managedProcess = undefined;
            });
            // Wait for Storybook to start
            const started = await this.waitForStorybook(url, 30000);
            if (started) {
                logger_js_1.logger.info(`Storybook started successfully at ${url}`);
                return { url, projectPath, isManaged: true, process };
            }
            else {
                logger_js_1.logger.error('Storybook failed to start within timeout');
                process.kill();
                return null;
            }
        }
        catch (error) {
            logger_js_1.logger.error(`Failed to launch Storybook from ${projectPath}:`, error);
            return null;
        }
    }
    findStorybookScript(scripts) {
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
    extractPortFromScript(script) {
        // Look for -p or --port flag
        const portMatch = script.match(/(?:-p|--port)\s+(\d+)/);
        if (portMatch) {
            return parseInt(portMatch[1], 10);
        }
        return null;
    }
    async detectPackageManager(projectPath) {
        // Check for lock files
        try {
            await fs_1.promises.access(path_1.default.join(projectPath, 'yarn.lock'));
            return 'yarn';
        }
        catch { }
        try {
            await fs_1.promises.access(path_1.default.join(projectPath, 'pnpm-lock.yaml'));
            return 'pnpm';
        }
        catch { }
        try {
            await fs_1.promises.access(path_1.default.join(projectPath, 'bun.lockb'));
            return 'bun';
        }
        catch { }
        return 'npm';
    }
    async waitForStorybook(url, timeout) {
        const startTime = Date.now();
        const checkInterval = 2000;
        while (Date.now() - startTime < timeout) {
            if (await this.validateStorybookUrl(url)) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        return false;
    }
    async cleanup() {
        if (this.managedProcess) {
            logger_js_1.logger.info('Stopping managed Storybook process');
            this.managedProcess.kill();
            this.managedProcess = undefined;
        }
    }
}
exports.StorybookDetector = StorybookDetector;
//# sourceMappingURL=storybook-detector.js.map