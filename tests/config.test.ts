import { parseArgs, getConfig } from '../src/config';

describe('Config', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    process.argv = ['node', 'test'];
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
  });

  describe('parseArgs', () => {
    it('should parse command line arguments correctly', () => {
      process.argv = [
        'node',
        'test',
        '--storybook-url',
        'http://localhost:6006',
        '--output-dir',
        './test-screenshots',
        '--log-level',
        'debug',
      ];

      const config = parseArgs();

      expect(config.storybookUrl).toBe('http://localhost:6006');
      expect(config.outputDir).toBe('./test-screenshots');
      expect(config.logLevel).toBe('debug');
    });

    it('should use environment variables as defaults', () => {
      process.env.STORYBOOK_URL = 'http://localhost:9009';
      process.env.SCREENSHOT_OUTPUT_DIR = './env-screenshots';
      process.env.LOG_LEVEL = 'warn';

      const config = parseArgs();

      expect(config.storybookUrl).toBe('http://localhost:9009');
      expect(config.outputDir).toBe('./env-screenshots');
      expect(config.logLevel).toBe('warn');
    });

    it('should use default values when no arguments or env vars provided', () => {
      delete process.env.STORYBOOK_URL;
      delete process.env.STORYBOOK_PROJECT;
      delete process.env.SCREENSHOT_OUTPUT_DIR;
      delete process.env.LOG_LEVEL;

      const config = parseArgs();

      expect(config.storybookUrl).toBeUndefined();
      expect(config.storybookProject).toBeUndefined();
      expect(config.outputDir).toBe('./screenshots');
      expect(config.logLevel).toBe('info');
    });

    it('should support alias arguments', () => {
      process.argv = [
        'node',
        'test',
        '--url',
        'http://localhost:7007',
        '--project',
        '/path/to/project',
        '--output',
        './output',
      ];

      const config = parseArgs();

      expect(config.storybookUrl).toBe('http://localhost:7007');
      expect(config.storybookProject).toBe('/path/to/project');
      expect(config.outputDir).toBe('./output');
    });

    it('should override env variables with command line arguments', () => {
      process.env.STORYBOOK_URL = 'http://localhost:9009';
      process.argv = ['node', 'test', '--storybook-url', 'http://localhost:6006'];

      const config = parseArgs();

      expect(config.storybookUrl).toBe('http://localhost:6006');
    });
  });

  describe('getConfig', () => {
    it('should return parsed configuration', () => {
      process.argv = ['node', 'test', '--log-level', 'error'];

      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.logLevel).toBe('error');
    });
  });
});