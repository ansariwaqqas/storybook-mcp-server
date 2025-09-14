import { ScreenshotService } from '../src/screenshot-service';
import puppeteer, { Browser, Page, Viewport } from 'puppeteer';
import { promises as fs } from 'fs';

jest.mock('puppeteer');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
  },
  default: {
    statSync: jest.fn().mockReturnValue({ isDirectory: () => true }),
  },
  statSync: jest.fn().mockReturnValue({ isDirectory: () => true }),
}));

const mockedPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ScreenshotService', () => {
  let service: ScreenshotService;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(() => {
    mockPage = {
      setViewport: jest.fn(),
      goto: jest.fn(),
      evaluate: jest.fn(),
      screenshot: jest.fn(),
      close: jest.fn(),
    } as any;

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    } as any;

    mockedPuppeteer.launch.mockResolvedValue(mockBrowser);
    mockedFs.mkdir.mockResolvedValue(undefined);

    service = new ScreenshotService('./test-screenshots');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default output directory', () => {
      const defaultService = new ScreenshotService();
      expect(defaultService).toBeDefined();
    });

    it('should initialize with custom output directory', () => {
      const customService = new ScreenshotService('./custom-screenshots');
      expect(customService).toBeDefined();
    });
  });

  describe('captureStoryScreenshot', () => {
    it('should capture screenshot and save to file', async () => {
      const storyId = 'button--primary';
      const storybookUrl = 'http://localhost:6006';
      
      mockPage.screenshot.mockResolvedValueOnce(Buffer.from('screenshot'));

      const filepath = await service.captureStoryScreenshot(
        storybookUrl,
        storyId
      );

      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        './test-screenshots',
        { recursive: true }
      );
      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1280,
        height: 720,
      });
      expect(mockPage.goto).toHaveBeenCalledWith(
        `${storybookUrl}/iframe.html?id=${storyId}&viewMode=story`,
        {
          waitUntil: 'networkidle2',
          timeout: 30000,
        }
      );
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: expect.stringContaining('button--primary'),
        fullPage: false,
      });
      expect(mockPage.close).toHaveBeenCalled();
      expect(filepath).toContain('button--primary');
    });

    it('should use custom viewport if provided', async () => {
      const customViewport: Viewport = { width: 1920, height: 1080 };
      
      await service.captureStoryScreenshot(
        'http://localhost:6006',
        'test-story',
        customViewport
      );

      expect(mockPage.setViewport).toHaveBeenCalledWith(customViewport);
    });

    it('should handle errors and close page', async () => {
      mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'));

      await expect(
        service.captureStoryScreenshot(
          'http://localhost:6006',
          'test-story'
        )
      ).rejects.toThrow('Navigation failed');

      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should reuse browser instance', async () => {
      await service.captureStoryScreenshot(
        'http://localhost:6006',
        'story1'
      );
      await service.captureStoryScreenshot(
        'http://localhost:6006',
        'story2'
      );

      expect(mockedPuppeteer.launch).toHaveBeenCalledTimes(1);
    });
  });

  describe('captureStoryScreenshotAsBase64', () => {
    it('should capture screenshot as base64 string', async () => {
      const base64String = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      mockPage.screenshot.mockResolvedValueOnce(base64String as any);

      const result = await service.captureStoryScreenshotAsBase64(
        'http://localhost:6006',
        'test-story'
      );

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        fullPage: false,
        encoding: 'base64',
      });
      expect(result).toBe(base64String);
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should handle errors in base64 capture', async () => {
      mockPage.screenshot.mockRejectedValueOnce(new Error('Screenshot failed'));

      await expect(
        service.captureStoryScreenshotAsBase64(
          'http://localhost:6006',
          'test-story'
        )
      ).rejects.toThrow('Screenshot failed');

      expect(mockPage.close).toHaveBeenCalled();
    });
  });

  describe('captureAllScreenshots', () => {
    it('should capture screenshots for multiple stories', async () => {
      const storyIds = ['story1', 'story2', 'story3'];
      mockPage.screenshot.mockResolvedValue(Buffer.from('screenshot'));

      const results = await service.captureAllScreenshots(
        'http://localhost:6006',
        storyIds
      );

      expect(results).toHaveLength(3);
      expect(mockPage.goto).toHaveBeenCalledTimes(3);
      expect(mockPage.close).toHaveBeenCalledTimes(3);
    });

    it('should continue capturing even if one fails', async () => {
      const storyIds = ['story1', 'story2', 'story3'];
      
      mockPage.goto
        .mockResolvedValueOnce(undefined as any)
        .mockRejectedValueOnce(new Error('Navigation failed'))
        .mockResolvedValueOnce(undefined as any);
      
      mockPage.screenshot.mockResolvedValue(Buffer.from('screenshot'));

      const results = await service.captureAllScreenshots(
        'http://localhost:6006',
        storyIds
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('captureAllScreenshotsAsBase64', () => {
    it('should capture all screenshots as base64', async () => {
      const storyIds = ['story1', 'story2'];
      const base64String = 'base64data';
      mockPage.screenshot.mockResolvedValue(base64String as any);

      const results = await service.captureAllScreenshotsAsBase64(
        'http://localhost:6006',
        storyIds
      );

      expect(results.size).toBe(2);
      expect(results.get('story1')).toBe(base64String);
      expect(results.get('story2')).toBe(base64String);
    });

    it('should handle failures gracefully', async () => {
      const storyIds = ['story1', 'story2'];
      
      mockPage.screenshot
        .mockResolvedValueOnce('base64data' as any)
        .mockRejectedValueOnce(new Error('Screenshot failed'));

      const results = await service.captureAllScreenshotsAsBase64(
        'http://localhost:6006',
        storyIds
      );

      expect(results.size).toBe(1);
      expect(results.has('story1')).toBe(true);
      expect(results.has('story2')).toBe(false);
    });
  });

  describe('captureComponentScreenshots', () => {
    it('should capture screenshots for component stories', async () => {
      const storyIds = ['component--story1', 'component--story2'];
      mockPage.screenshot.mockResolvedValue(Buffer.from('screenshot'));

      const results = await service.captureComponentScreenshots(
        'http://localhost:6006',
        'component',
        storyIds
      );

      expect(results.size).toBe(2);
      expect(results.has('component--story1')).toBe(true);
      expect(results.has('component--story2')).toBe(true);
    });
  });

  describe('captureWithMultipleViewports', () => {
    it('should capture screenshots with different viewports', async () => {
      const viewports: Viewport[] = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 },
      ];
      
      mockPage.screenshot.mockResolvedValue(Buffer.from('screenshot'));

      const results = await service.captureWithMultipleViewports(
        'http://localhost:6006',
        'test-story',
        viewports
      );

      expect(results.size).toBe(3);
      expect(results.has('320x568')).toBe(true);
      expect(results.has('768x1024')).toBe(true);
      expect(results.has('1920x1080')).toBe(true);
      expect(mockPage.setViewport).toHaveBeenCalledTimes(3);
    });

    it('should handle viewport failures gracefully', async () => {
      const viewports: Viewport[] = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
      ];
      
      mockPage.screenshot
        .mockResolvedValueOnce(Buffer.from('screenshot'))
        .mockRejectedValueOnce(new Error('Screenshot failed'));

      const results = await service.captureWithMultipleViewports(
        'http://localhost:6006',
        'test-story',
        viewports
      );

      expect(results.size).toBe(1);
      expect(results.has('320x568')).toBe(true);
      expect(results.has('768x1024')).toBe(false);
    });
  });

  describe('close', () => {
    it('should close browser if open', async () => {
      await service.captureStoryScreenshot(
        'http://localhost:6006',
        'test-story'
      );
      
      await service.close();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle multiple close calls', async () => {
      await service.close();
      await service.close();

      expect(mockBrowser.close).not.toHaveBeenCalled();
    });

    it('should allow capturing after close by launching new browser', async () => {
      await service.captureStoryScreenshot(
        'http://localhost:6006',
        'story1'
      );
      
      await service.close();
      
      await service.captureStoryScreenshot(
        'http://localhost:6006',
        'story2'
      );

      expect(mockedPuppeteer.launch).toHaveBeenCalledTimes(2);
    });
  });

  describe('ensureOutputDir', () => {
    it('should create output directory if it does not exist', async () => {
      await service.captureStoryScreenshot(
        'http://localhost:6006',
        'test-story'
      );

      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        './test-screenshots',
        { recursive: true }
      );
    });

    it('should handle directory creation errors', async () => {
      mockedFs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(
        service.captureStoryScreenshot(
          'http://localhost:6006',
          'test-story'
        )
      ).rejects.toThrow('Permission denied');
    });
  });
});