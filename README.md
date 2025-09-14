# Storybook MCP Server

A TypeScript MCP (Model Context Protocol) server that provides comprehensive access to Storybook instances. This server enables AI assistants to interact with Storybook components, stories, and capture screenshots.

## Features

- **List Components**: Get all available components in your Storybook instance
- **List Stories**: Retrieve all stories, with optional filtering by component
- **Get Story Details**: Access detailed information about specific stories including parameters and args
- **Extract Component Props**: Get complete prop definitions and arg types for components
- **Capture Screenshots**: Take screenshots of individual stories or all stories with customizable viewports
- **Multi-viewport Support**: Capture screenshots across different screen sizes

## Installation

```bash
npm install
npm run build
```

## Usage

### Start the Server

```bash
# Using default settings (Storybook at http://localhost:6006)
npm start

# With custom Storybook URL
npm start -- --storybook-url http://localhost:9009

# With custom screenshot output directory
npm start -- --output-dir ./my-screenshots

# With environment variables
STORYBOOK_URL=http://localhost:9009 npm start
```

### Command Line Options

- `--storybook-url`, `-url`: URL of the Storybook instance (default: http://localhost:6006)
- `--output-dir`, `-output`: Directory to save screenshots (default: ./screenshots)
- `--log-level`: Logging level [error, warn, info, debug] (default: info)

## MCP Tools Available

### `storybook_list_components`
Lists all components available in the Storybook instance.

### `storybook_list_stories`
Lists all stories, optionally filtered by component.

**Parameters:**
- `componentId` (optional): Filter stories by component ID

### `storybook_get_story_details`
Gets detailed information about a specific story.

**Parameters:**
- `storyId` (required): The ID of the story

### `storybook_get_component_props`
Gets the props/properties definition for a component.

**Parameters:**
- `componentId` (required): The ID of the component

### `storybook_capture_screenshot`
Captures a screenshot of a specific story.

**Parameters:**
- `storyId` (required): The ID of the story to capture
- `viewport` (optional): Viewport dimensions
  - `width`: Viewport width in pixels
  - `height`: Viewport height in pixels

### `storybook_capture_all_screenshots`
Captures screenshots of all stories.

**Parameters:**
- `viewport` (optional): Viewport dimensions
  - `width`: Viewport width in pixels
  - `height`: Viewport height in pixels

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Architecture

The server is built with:
- **TypeScript**: For type safety and better developer experience
- **MCP SDK**: Official Model Context Protocol SDK for server implementation
- **Puppeteer**: For capturing screenshots of Storybook stories
- **Axios**: For HTTP communication with Storybook instance
- **Winston**: For structured logging

## Requirements

- Node.js 18 or higher
- A running Storybook instance
- Chrome/Chromium (automatically downloaded by Puppeteer)

## Integration with Claude

To use this MCP server with Claude Desktop, add it to your Claude configuration:

```json
{
  "mcpServers": {
    "storybook": {
      "command": "node",
      "args": ["/path/to/storybook-mcp-server/dist/index.js"],
      "env": {
        "STORYBOOK_URL": "http://localhost:6006"
      }
    }
  }
}
```

## License

MIT