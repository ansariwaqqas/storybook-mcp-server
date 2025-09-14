import puppeteer, { Browser, Viewport } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger.js';

export interface ScreenshotOptions {
  viewport?: Viewport;
  fullPage?: boolean;
  outputDir?: string;
}

export class ScreenshotService {
  private browser?: Browser;
  private defaultViewport: Viewport = {
    width: 1280,
    height: 720,
  };
  private outputDir: string;

  constructor(outputDir: string = './screenshots') {
    this.outputDir = outputDir;
  }

  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create output directory:', error);
      throw error;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      logger.info('Launching Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      logger.info('Browser launched successfully');
    }
    return this.browser;
  }

  async captureStoryScreenshot(
    storybookUrl: string,
    storyId: string,
    viewport?: Viewport,
  ): Promise<string> {
    await this.ensureOutputDir();
    
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      const viewportToUse = viewport || this.defaultViewport;
      await page.setViewport(viewportToUse);

      const storyUrl = `${storybookUrl}/iframe.html?id=${storyId}&viewMode=story`;
      logger.info(`Navigating to story: ${storyUrl}`);

      await page.goto(storyUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.evaluate(() => {
        const root = (window as any).document.querySelector('#storybook-root') || (window as any).document.querySelector('#root');
        if (root) {
          const rootElement = root as any;
          rootElement.style.padding = '20px';
          rootElement.style.background = 'white';
        }
      });

      const sanitizedStoryId = storyId.replace(/[^a-z0-9]/gi, '-');
      const timestamp = Date.now();
      const filename = `${sanitizedStoryId}-${timestamp}.png`;
      const filepath = path.join(this.outputDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: false,
      });

      logger.info(`Screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async captureAllScreenshots(
    storybookUrl: string,
    storyIds: string[],
    viewport?: Viewport,
  ): Promise<string[]> {
    const screenshots: string[] = [];

    for (const storyId of storyIds) {
      try {
        const screenshotPath = await this.captureStoryScreenshot(storybookUrl, storyId, viewport);
        screenshots.push(screenshotPath);
      } catch (error) {
        logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
      }
    }

    return screenshots;
  }

  async captureComponentScreenshots(
    storybookUrl: string,
    _componentId: string,
    storyIds: string[],
    viewport?: Viewport,
  ): Promise<Map<string, string>> {
    const screenshotMap = new Map<string, string>();

    for (const storyId of storyIds) {
      try {
        const screenshotPath = await this.captureStoryScreenshot(storybookUrl, storyId, viewport);
        screenshotMap.set(storyId, screenshotPath);
      } catch (error) {
        logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
      }
    }

    return screenshotMap;
  }

  async captureWithMultipleViewports(
    storybookUrl: string,
    storyId: string,
    viewports: Viewport[],
  ): Promise<Map<string, string>> {
    const screenshotMap = new Map<string, string>();

    for (const viewport of viewports) {
      const viewportName = `${viewport.width}x${viewport.height}`;
      try {
        await this.ensureOutputDir();
        
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        try {
          await page.setViewport(viewport);

          const storyUrl = `${storybookUrl}/iframe.html?id=${storyId}&viewMode=story`;
          await page.goto(storyUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });

          await new Promise(resolve => setTimeout(resolve, 1000));

          const sanitizedStoryId = storyId.replace(/[^a-z0-9]/gi, '-');
          const filename = `${sanitizedStoryId}-${viewportName}.png`;
          const filepath = path.join(this.outputDir, filename);

          await page.screenshot({
            path: filepath,
            fullPage: false,
          });

          screenshotMap.set(viewportName, filepath);
          logger.info(`Screenshot saved for ${viewportName}: ${filepath}`);
        } finally {
          await page.close();
        }
      } catch (error) {
        logger.error(`Failed to capture screenshot for viewport ${viewportName}:`, error);
      }
    }

    return screenshotMap;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      logger.info('Browser closed');
    }
  }
}