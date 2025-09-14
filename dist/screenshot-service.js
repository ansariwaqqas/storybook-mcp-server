"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_js_1 = require("./logger.js");
class ScreenshotService {
    browser;
    defaultViewport = {
        width: 1280,
        height: 720,
    };
    outputDir;
    constructor(outputDir = './screenshots') {
        this.outputDir = outputDir;
    }
    async ensureOutputDir() {
        try {
            await fs_1.promises.mkdir(this.outputDir, { recursive: true });
        }
        catch (error) {
            logger_js_1.logger.error('Failed to create output directory:', error);
            throw error;
        }
    }
    async getBrowser() {
        if (!this.browser) {
            logger_js_1.logger.info('Launching Puppeteer browser...');
            this.browser = await puppeteer_1.default.launch({
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
            logger_js_1.logger.info('Browser launched successfully');
        }
        return this.browser;
    }
    async captureStoryScreenshot(storybookUrl, storyId, viewport) {
        await this.ensureOutputDir();
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        try {
            const viewportToUse = viewport || this.defaultViewport;
            await page.setViewport(viewportToUse);
            const storyUrl = `${storybookUrl}/iframe.html?id=${storyId}&viewMode=story`;
            logger_js_1.logger.info(`Navigating to story: ${storyUrl}`);
            await page.goto(storyUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.evaluate(() => {
                const root = window.document.querySelector('#storybook-root') || window.document.querySelector('#root');
                if (root) {
                    const rootElement = root;
                    rootElement.style.padding = '20px';
                    rootElement.style.background = 'white';
                }
            });
            const sanitizedStoryId = storyId.replace(/[^a-z0-9]/gi, '-');
            const timestamp = Date.now();
            const filename = `${sanitizedStoryId}-${timestamp}.png`;
            const filepath = path_1.default.join(this.outputDir, filename);
            await page.screenshot({
                path: filepath,
                fullPage: false,
            });
            logger_js_1.logger.info(`Screenshot saved: ${filepath}`);
            return filepath;
        }
        catch (error) {
            logger_js_1.logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
            throw error;
        }
        finally {
            await page.close();
        }
    }
    async captureStoryScreenshotAsBase64(storybookUrl, storyId, viewport) {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        try {
            const viewportToUse = viewport || this.defaultViewport;
            await page.setViewport(viewportToUse);
            const storyUrl = `${storybookUrl}/iframe.html?id=${storyId}&viewMode=story`;
            logger_js_1.logger.info(`Navigating to story: ${storyUrl}`);
            await page.goto(storyUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.evaluate(() => {
                const root = window.document.querySelector('#storybook-root') || window.document.querySelector('#root');
                if (root) {
                    const rootElement = root;
                    rootElement.style.padding = '20px';
                    rootElement.style.background = 'white';
                }
            });
            const screenshotBuffer = await page.screenshot({
                fullPage: false,
                encoding: 'base64',
            });
            logger_js_1.logger.info(`Screenshot captured for story ${storyId}`);
            return screenshotBuffer;
        }
        catch (error) {
            logger_js_1.logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
            throw error;
        }
        finally {
            await page.close();
        }
    }
    async captureAllScreenshots(storybookUrl, storyIds, viewport) {
        const screenshots = [];
        for (const storyId of storyIds) {
            try {
                const screenshotPath = await this.captureStoryScreenshot(storybookUrl, storyId, viewport);
                screenshots.push(screenshotPath);
            }
            catch (error) {
                logger_js_1.logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
            }
        }
        return screenshots;
    }
    async captureAllScreenshotsAsBase64(storybookUrl, storyIds, viewport) {
        const screenshots = new Map();
        for (const storyId of storyIds) {
            try {
                const screenshotBase64 = await this.captureStoryScreenshotAsBase64(storybookUrl, storyId, viewport);
                screenshots.set(storyId, screenshotBase64);
            }
            catch (error) {
                logger_js_1.logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
            }
        }
        return screenshots;
    }
    async captureComponentScreenshots(storybookUrl, _componentId, storyIds, viewport) {
        const screenshotMap = new Map();
        for (const storyId of storyIds) {
            try {
                const screenshotPath = await this.captureStoryScreenshot(storybookUrl, storyId, viewport);
                screenshotMap.set(storyId, screenshotPath);
            }
            catch (error) {
                logger_js_1.logger.error(`Failed to capture screenshot for story ${storyId}:`, error);
            }
        }
        return screenshotMap;
    }
    async captureWithMultipleViewports(storybookUrl, storyId, viewports) {
        const screenshotMap = new Map();
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
                    const filepath = path_1.default.join(this.outputDir, filename);
                    await page.screenshot({
                        path: filepath,
                        fullPage: false,
                    });
                    screenshotMap.set(viewportName, filepath);
                    logger_js_1.logger.info(`Screenshot saved for ${viewportName}: ${filepath}`);
                }
                finally {
                    await page.close();
                }
            }
            catch (error) {
                logger_js_1.logger.error(`Failed to capture screenshot for viewport ${viewportName}:`, error);
            }
        }
        return screenshotMap;
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = undefined;
            logger_js_1.logger.info('Browser closed');
        }
    }
}
exports.ScreenshotService = ScreenshotService;
//# sourceMappingURL=screenshot-service.js.map