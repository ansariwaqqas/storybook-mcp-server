#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { StorybookClient } from './storybook-client.js';
import { ScreenshotService } from './screenshot-service.js';
import { logger } from './logger.js';
import { parseArgs } from './config.js';

const args = parseArgs();

class StorybookMCPServer {
  private server: Server;
  private storybookClient: StorybookClient;
  private screenshotService: ScreenshotService;

  constructor(storybookUrl: string) {
    this.server = new Server(
      {
        name: 'storybook-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.storybookClient = new StorybookClient(storybookUrl);
    this.screenshotService = new ScreenshotService();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolDefinitions(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'storybook_list_components':
            return await this.handleListComponents();

          case 'storybook_list_stories':
            return await this.handleListStories(args as { componentId?: string });

          case 'storybook_get_story_details':
            return await this.handleGetStoryDetails(args as { storyId: string });

          case 'storybook_get_component_props':
            return await this.handleGetComponentProps(args as { componentId: string });

          case 'storybook_capture_screenshot':
            return await this.handleCaptureScreenshot(
              args as { storyId: string; viewport?: { width: number; height: number } },
            );

          case 'storybook_capture_all_screenshots':
            return await this.handleCaptureAllScreenshots(
              args as { viewport?: { width: number; height: number } },
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
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

  private getToolDefinitions(): Tool[] {
    return [
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
          },
        },
      },
    ];
  }

  private async handleListComponents() {
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

  private async handleListStories(args: { componentId?: string }) {
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

  private async handleGetStoryDetails(args: { storyId: string }) {
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

  private async handleGetComponentProps(args: { componentId: string }) {
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

  private async handleCaptureScreenshot(args: {
    storyId: string;
    viewport?: { width: number; height: number };
  }) {
    const screenshotPath = await this.screenshotService.captureStoryScreenshot(
      this.storybookClient.getStorybookUrl(),
      args.storyId,
      args.viewport,
    );

    return {
      content: [
        {
          type: 'text',
          text: `Screenshot captured: ${screenshotPath}`,
        },
      ],
    };
  }

  private async handleCaptureAllScreenshots(args: {
    viewport?: { width: number; height: number };
  }) {
    const stories = await this.storybookClient.listStories();
    const screenshots = await this.screenshotService.captureAllScreenshots(
      this.storybookClient.getStorybookUrl(),
      stories.map((s) => s.id),
      args.viewport,
    );

    return {
      content: [
        {
          type: 'text',
          text: `Captured ${screenshots.length} screenshots:\n${screenshots.join('\n')}`,
        },
      ],
    };
  }

  async start(): Promise<void> {
    logger.info('Starting Storybook MCP Server...');
    
    await this.storybookClient.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info('Storybook MCP Server started successfully');
  }

  async stop(): Promise<void> {
    await this.screenshotService.close();
    logger.info('Storybook MCP Server stopped');
  }
}

async function main() {
  const server = new StorybookMCPServer(args.storybookUrl);

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
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});