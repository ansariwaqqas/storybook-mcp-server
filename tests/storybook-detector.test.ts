import { StorybookDetector } from '../src/storybook-detector';
import axios from 'axios';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

jest.mock('axios');
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn(),
  },
}));
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('StorybookDetector', () => {
  let detector: StorybookDetector;

  beforeEach(() => {
    detector = new StorybookDetector();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('detectStorybook', () => {
    it('should use provided URL if valid', async () => {
      const providedUrl = 'http://localhost:6006';
      mockedAxios.get.mockResolvedValueOnce({
        data: { v: 4, stories: {} },
        status: 200,
      } as any);

      const result = await detector.detectStorybook(providedUrl);

      expect(result).toEqual({
        url: providedUrl,
        isManaged: false,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${providedUrl}/index.json`,
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('should find running Storybook on common ports', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({
          data: { v: 4, stories: {} },
          status: 200,
        } as any);

      const result = await detector.detectStorybook();

      expect(result).toEqual({
        url: 'http://localhost:6007',
        isManaged: false,
      });
    });

    it('should launch Storybook from project path', async () => {
      const projectPath = '/test/project';
      const packageJson = {
        scripts: {
          storybook: 'storybook dev -p 6006',
        },
      };

      mockedAxios.get.mockRejectedValue(new Error('Not found'));
      mockedFs.stat.mockResolvedValueOnce({ isDirectory: () => true } as any);
      mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(packageJson));
      mockedFs.access.mockRejectedValue(new Error('No lock file'));

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };
      mockedSpawn.mockReturnValueOnce(mockProcess as any);

      setTimeout(() => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { v: 4, stories: {} },
          status: 200,
        } as any);
      }, 100);

      await detector.detectStorybook(undefined, projectPath);

      expect(mockedSpawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'storybook'],
        expect.objectContaining({
          cwd: projectPath,
        })
      );
    });

    it('should return null if no Storybook found', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Not found'));
      mockedFs.stat.mockRejectedValue(new Error('Not found'));

      const result = await detector.detectStorybook();

      expect(result).toBeNull();
    });
  });

  describe('validateStorybookUrl', () => {
    it('should return true for valid Storybook URL', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { v: 4, stories: {} },
        status: 200,
      } as any);

      const result = await (detector as any).validateStorybookUrl(
        'http://localhost:6006'
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid URL', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await (detector as any).validateStorybookUrl(
        'http://localhost:9999'
      );

      expect(result).toBe(false);
    });
  });

  describe('findStorybookScript', () => {
    it('should find common Storybook script names', () => {
      const scripts = {
        build: 'webpack',
        storybook: 'storybook dev',
        test: 'jest',
      };

      const result = (detector as any).findStorybookScript(scripts);

      expect(result).toBe('storybook');
    });

    it('should find script with storybook command', () => {
      const scripts = {
        build: 'webpack',
        'dev:ui': 'start-storybook -p 9009',
        test: 'jest',
      };

      const result = (detector as any).findStorybookScript(scripts);

      expect(result).toBe('dev:ui');
    });

    it('should return null if no Storybook script found', () => {
      const scripts = {
        build: 'webpack',
        start: 'node server.js',
        test: 'jest',
      };

      const result = (detector as any).findStorybookScript(scripts);

      expect(result).toBeNull();
    });
  });

  describe('extractPortFromScript', () => {
    it('should extract port with -p flag', () => {
      const script = 'storybook dev -p 9009';
      const port = (detector as any).extractPortFromScript(script);

      expect(port).toBe(9009);
    });

    it('should extract port with --port flag', () => {
      const script = 'storybook dev --port 7007';
      const port = (detector as any).extractPortFromScript(script);

      expect(port).toBe(7007);
    });

    it('should return null if no port specified', () => {
      const script = 'storybook dev';
      const port = (detector as any).extractPortFromScript(script);

      expect(port).toBeNull();
    });
  });

  describe('detectPackageManager', () => {
    it('should detect yarn from yarn.lock', async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);

      const pm = await (detector as any).detectPackageManager('/test/project');

      expect(pm).toBe('yarn');
      expect(mockedFs.access).toHaveBeenCalledWith(
        '/test/project/yarn.lock'
      );
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      mockedFs.access
        .mockRejectedValueOnce(new Error('No yarn.lock'))
        .mockResolvedValueOnce(undefined);

      const pm = await (detector as any).detectPackageManager('/test/project');

      expect(pm).toBe('pnpm');
    });

    it('should default to npm', async () => {
      mockedFs.access.mockRejectedValue(new Error('No lock file'));

      const pm = await (detector as any).detectPackageManager('/test/project');

      expect(pm).toBe('npm');
    });
  });

  describe('cleanup', () => {
    it('should kill managed process', async () => {
      const mockProcess = {
        kill: jest.fn(),
      };
      (detector as any).managedProcess = mockProcess;

      await detector.cleanup();

      expect(mockProcess.kill).toHaveBeenCalled();
      expect((detector as any).managedProcess).toBeUndefined();
    });

    it('should handle cleanup when no managed process', async () => {
      await expect(detector.cleanup()).resolves.not.toThrow();
    });
  });
});