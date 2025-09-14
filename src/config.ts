import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface Config {
  storybookUrl: string;
  outputDir: string;
  logLevel: string;
}

export function parseArgs(): Config {
  const argv = yargs(hideBin(process.argv))
    .options({
      'storybook-url': {
        type: 'string',
        describe: 'URL of the Storybook instance',
        default: process.env.STORYBOOK_URL || 'http://localhost:6006',
        alias: 'url',
      },
      'output-dir': {
        type: 'string',
        describe: 'Directory to save screenshots',
        default: process.env.SCREENSHOT_OUTPUT_DIR || './screenshots',
        alias: 'output',
      },
      'log-level': {
        type: 'string',
        describe: 'Logging level',
        choices: ['error', 'warn', 'info', 'debug'],
        default: process.env.LOG_LEVEL || 'info',
      },
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  return {
    storybookUrl: argv['storybook-url'],
    outputDir: argv['output-dir'],
    logLevel: argv['log-level'],
  };
}

export function getConfig(): Config {
  return parseArgs();
}