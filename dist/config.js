"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = parseArgs;
exports.getConfig = getConfig;
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
function parseArgs() {
    const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .options({
        'storybook-url': {
            type: 'string',
            describe: 'URL of the Storybook instance',
            default: process.env.STORYBOOK_URL,
            alias: 'url',
        },
        'storybook-project': {
            type: 'string',
            describe: 'Path to project containing Storybook (will launch if needed)',
            default: process.env.STORYBOOK_PROJECT,
            alias: 'project',
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
        storybookProject: argv['storybook-project'],
        outputDir: argv['output-dir'],
        logLevel: argv['log-level'],
    };
}
function getConfig() {
    return parseArgs();
}
//# sourceMappingURL=config.js.map