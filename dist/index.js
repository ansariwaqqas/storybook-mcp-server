#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const storybook_client_js_1 = require("./storybook-client.js");
const screenshot_service_js_1 = require("./screenshot-service.js");
const storybook_detector_js_1 = require("./storybook-detector.js");
const logger_js_1 = require("./logger.js");
const config_js_1 = require("./config.js");
const args = (0, config_js_1.parseArgs)();
class StorybookMCPServer {
    server;
    storybookClient;
    screenshotService;
    storybookDetector;
    storybookConfig;
    isInitialized = false;
    constructor() {
        this.server = new index_js_1.Server({
            name: 'storybook-mcp-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        this.screenshotService = new screenshot_service_js_1.ScreenshotService();
        this.storybookDetector = new storybook_detector_js_1.StorybookDetector();
        this.setupHandlers();
    }
    async ensureInitialized() {
        if (this.isInitialized && this.storybookClient) {
            return true;
        }
        // Try to detect/launch Storybook
        const config = await this.storybookDetector.detectStorybook(args.storybookUrl, args.storybookProject);
        if (!config) {
            return false;
        }
        this.storybookConfig = config;
        this.storybookClient = new storybook_client_js_1.StorybookClient(config.url);
        try {
            await this.storybookClient.initialize();
            this.isInitialized = true;
            return true;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to initialize Storybook client:', error);
            return false;
        }
    }
    setupHandlers() {
        // Resources handler
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => ({
            resources: this.getResourceDefinitions(),
        }));
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            if (uri === 'storybook://config') {
                return {
                    contents: [
                        {
                            uri: 'storybook://config',
                            mimeType: 'application/json',
                            text: JSON.stringify({
                                initialized: this.isInitialized,
                                config: this.storybookConfig,
                                status: this.isInitialized ? 'connected' : 'disconnected',
                            }, null, 2),
                        },
                    ],
                };
            }
            throw new Error(`Unknown resource: ${uri}`);
        });
        // Tools handler
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: this.getToolDefinitions(),
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            // Special tool for configuration
            if (name === 'storybook_configure') {
                return await this.handleConfigure(args);
            }
            // Ensure Storybook is initialized for other tools
            if (!await this.ensureInitialized()) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Storybook is not initialized. Please use the storybook_configure tool first, or ensure Storybook is running.',
                        },
                    ],
                };
            }
            try {
                switch (name) {
                    case 'storybook_list_components':
                        return await this.handleListComponents();
                    case 'storybook_list_stories':
                        return await this.handleListStories(args);
                    case 'storybook_get_story_details':
                        return await this.handleGetStoryDetails(args);
                    case 'storybook_get_component_props':
                        return await this.handleGetComponentProps(args);
                    case 'storybook_capture_screenshot':
                        return await this.handleCaptureScreenshot(args);
                    case 'storybook_capture_all_screenshots':
                        return await this.handleCaptureAllScreenshots(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                logger_js_1.logger.error(`Error executing tool ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        },
                    ],
                };
            }
        });
    }
    getResourceDefinitions() {
        return [
            {
                uri: 'storybook://config',
                name: 'Storybook Configuration',
                description: 'Current Storybook server configuration and status',
                mimeType: 'application/json',
            },
        ];
    }
    getToolDefinitions() {
        return [
            {
                name: 'storybook_configure',
                description: 'Configure or reconfigure the Storybook connection',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'Storybook URL (e.g., http://localhost:6006)',
                        },
                        projectPath: {
                            type: 'string',
                            description: 'Path to project containing Storybook (will launch if needed)',
                        },
                    },
                },
            },
            {
                name: 'storybook_list_components',
                description: 'List all components available in the Storybook instance',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'storybook_list_stories',
                description: 'List all stories, optionally filtered by component',
                inputSchema: {
                    type: 'object',
                    properties: {
                        componentId: {
                            type: 'string',
                            description: 'Optional component ID to filter stories',
                        },
                    },
                },
            },
            {
                name: 'storybook_get_story_details',
                description: 'Get detailed information about a specific story',
                inputSchema: {
                    type: 'object',
                    properties: {
                        storyId: {
                            type: 'string',
                            description: 'The ID of the story',
                        },
                    },
                    required: ['storyId'],
                },
            },
            {
                name: 'storybook_get_component_props',
                description: 'Get the props/properties definition for a component',
                inputSchema: {
                    type: 'object',
                    properties: {
                        componentId: {
                            type: 'string',
                            description: 'The ID of the component',
                        },
                    },
                    required: ['componentId'],
                },
            },
            {
                name: 'storybook_capture_screenshot',
                description: 'Capture a screenshot of a specific story',
                inputSchema: {
                    type: 'object',
                    properties: {
                        storyId: {
                            type: 'string',
                            description: 'The ID of the story to capture',
                        },
                        viewport: {
                            type: 'object',
                            properties: {
                                width: {
                                    type: 'number',
                                    description: 'Viewport width in pixels',
                                },
                                height: {
                                    type: 'number',
                                    description: 'Viewport height in pixels',
                                },
                            },
                            description: 'Optional viewport dimensions',
                        },
                        returnAsImage: {
                            type: 'boolean',
                            description: 'Return the screenshot as a base64-encoded image in the response instead of saving to disk',
                            default: false,
                        },
                    },
                    required: ['storyId'],
                },
            },
            {
                name: 'storybook_capture_all_screenshots',
                description: 'Capture screenshots of all stories',
                inputSchema: {
                    type: 'object',
                    properties: {
                        viewport: {
                            type: 'object',
                            properties: {
                                width: {
                                    type: 'number',
                                    description: 'Viewport width in pixels',
                                },
                                height: {
                                    type: 'number',
                                    description: 'Viewport height in pixels',
                                },
                            },
                            description: 'Optional viewport dimensions',
                        },
                        returnAsImages: {
                            type: 'boolean',
                            description: 'Return screenshots as base64-encoded images in the response instead of saving to disk',
                            default: false,
                        },
                    },
                },
            },
        ];
    }
    async handleConfigure(args) {
        const config = await this.storybookDetector.detectStorybook(args.url, args.projectPath);
        if (!config) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to connect to Storybook. Please ensure:
1. Storybook is running at the specified URL, or
2. The project path contains a valid Storybook setup

You can:
- Start Storybook manually and provide the URL
- Provide a project path with package.json containing Storybook scripts
- Ensure Storybook is running on a common port (6006, 9009, etc.)`,
                    },
                ],
            };
        }
        this.storybookConfig = config;
        this.storybookClient = new storybook_client_js_1.StorybookClient(config.url);
        try {
            await this.storybookClient.initialize();
            this.isInitialized = true;
            return {
                content: [
                    {
                        type: 'text',
                        text: `Successfully connected to Storybook!
URL: ${config.url}
Project: ${config.projectPath || 'N/A'}
Managed: ${config.isManaged ? 'Yes (launched by MCP server)' : 'No (externally running)'}

You can now use all Storybook tools.`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Found Storybook at ${config.url} but failed to initialize: ${error}`,
                    },
                ],
            };
        }
    }
    async handleListComponents() {
        if (!this.storybookClient) {
            throw new Error('Storybook client not initialized');
        }
        const components = await this.storybookClient.listComponents();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(components, null, 2),
                },
            ],
        };
    }
    async handleListStories(args) {
        if (!this.storybookClient) {
            throw new Error('Storybook client not initialized');
        }
        const stories = await this.storybookClient.listStories(args.componentId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(stories, null, 2),
                },
            ],
        };
    }
    async handleGetStoryDetails(args) {
        if (!this.storybookClient) {
            throw new Error('Storybook client not initialized');
        }
        const details = await this.storybookClient.getStoryDetails(args.storyId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(details, null, 2),
                },
            ],
        };
    }
    async handleGetComponentProps(args) {
        if (!this.storybookClient) {
            throw new Error('Storybook client not initialized');
        }
        const props = await this.storybookClient.getComponentProps(args.componentId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(props, null, 2),
                },
            ],
        };
    }
    async handleCaptureScreenshot(args) {
        if (!this.storybookClient) {
            throw new Error('Storybook client not initialized');
        }
        if (args.returnAsImage) {
            const screenshotBase64 = await this.screenshotService.captureStoryScreenshotAsBase64(this.storybookClient.getStorybookUrl(), args.storyId, args.viewport);
            return {
                content: [
                    {
                        type: 'image',
                        data: screenshotBase64,
                        mimeType: 'image/png',
                    },
                ],
            };
        }
        else {
            const screenshotPath = await this.screenshotService.captureStoryScreenshot(this.storybookClient.getStorybookUrl(), args.storyId, args.viewport);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Screenshot captured: ${screenshotPath}`,
                    },
                ],
            };
        }
    }
    async handleCaptureAllScreenshots(args) {
        if (!this.storybookClient) {
            throw new Error('Storybook client not initialized');
        }
        const stories = await this.storybookClient.listStories();
        if (args.returnAsImages) {
            const screenshotsMap = await this.screenshotService.captureAllScreenshotsAsBase64(this.storybookClient.getStorybookUrl(), stories.map((s) => s.id), args.viewport);
            const content = [];
            for (const [storyId, base64Data] of screenshotsMap.entries()) {
                content.push({
                    type: 'text',
                    text: `Story: ${storyId}`,
                });
                content.push({
                    type: 'image',
                    data: base64Data,
                    mimeType: 'image/png',
                });
            }
            if (content.length === 0) {
                content.push({
                    type: 'text',
                    text: 'No screenshots were captured',
                });
            }
            return { content };
        }
        else {
            const screenshots = await this.screenshotService.captureAllScreenshots(this.storybookClient.getStorybookUrl(), stories.map((s) => s.id), args.viewport);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Captured ${screenshots.length} screenshots:\n${screenshots.join('\n')}`,
                    },
                ],
            };
        }
    }
    async start() {
        logger_js_1.logger.info('Starting Storybook MCP Server...');
        // Try auto-detection on startup
        const config = await this.storybookDetector.detectStorybook(args.storybookUrl, args.storybookProject);
        if (config) {
            this.storybookConfig = config;
            this.storybookClient = new storybook_client_js_1.StorybookClient(config.url);
            try {
                await this.storybookClient.initialize();
                this.isInitialized = true;
                logger_js_1.logger.info(`Auto-connected to Storybook at ${config.url}`);
            }
            catch (error) {
                logger_js_1.logger.warn('Auto-detection found Storybook but initialization failed:', error);
            }
        }
        else {
            logger_js_1.logger.info('No Storybook instance detected. Use storybook_configure tool to connect.');
        }
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        logger_js_1.logger.info('Storybook MCP Server started successfully');
    }
    async stop() {
        await this.screenshotService.close();
        await this.storybookDetector.cleanup();
        logger_js_1.logger.info('Storybook MCP Server stopped');
    }
}
async function main() {
    const server = new StorybookMCPServer();
    process.on('SIGINT', async () => {
        await server.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await server.stop();
        process.exit(0);
    });
    try {
        await server.start();
    }
    catch (error) {
        logger_js_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
main().catch((error) => {
    logger_js_1.logger.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map