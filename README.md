# Storybook MCP Server

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green?logo=anthropic)](https://modelcontextprotocol.io)
[![Storybook](https://img.shields.io/badge/Storybook-Compatible-ff4785?logo=storybook)](https://storybook.js.org/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-23.0-40B5A4?logo=puppeteer)](https://pptr.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)

A TypeScript MCP (Model Context Protocol) server that provides comprehensive access to Storybook instances. This server enables AI assistants to interact with Storybook components, stories, and capture screenshots.

## Features

### Component Discovery
Browse and list all components in your Storybook instance.

**Example:**
> "What components are available in my Storybook?"

```json
{
  "components": [
    { "id": "components-button", "name": "Button", "count": 5 },
    { "id": "components-card", "name": "Card", "count": 3 },
    { "id": "components-modal", "name": "Modal", "count": 2 }
  ]
}
```

### Story Management
Access all stories with filtering by component.

**Example:**
> "Show me all the Button stories"

```json
{
  "stories": [
    { "id": "components-button--primary", "name": "Primary", "title": "Components/Button" },
    { "id": "components-button--secondary", "name": "Secondary", "title": "Components/Button" },
    { "id": "components-button--disabled", "name": "Disabled", "title": "Components/Button" }
  ]
}
```

### Detailed Inspection
Get complete story information including parameters, args, and prop definitions.

**Example:**
> "What props does the Button component accept?"

```json
{
  "argTypes": {
    "label": { "type": "string", "description": "Button label", "required": true },
    "variant": { "type": "enum", "options": ["primary", "secondary", "danger"] },
    "size": { "type": "enum", "options": ["small", "medium", "large"], "defaultValue": "medium" },
    "disabled": { "type": "boolean", "defaultValue": false },
    "onClick": { "type": "function", "description": "Click handler" }
  }
}
```

### Visual Testing
Capture screenshots of individual or all stories.

**Example:**
> "Take a screenshot of the primary button story"

```json
{
  "success": true,
  "path": "./screenshots/components-button--primary.png",
  "viewport": { "width": 1280, "height": 720 },
  "message": "Screenshot saved successfully"
}
```

### Responsive Testing
Test components across multiple viewport sizes.

**Example:**
> "Capture the Card component at mobile size (375x667)"

```json
{
  "success": true,
  "path": "./screenshots/components-card--default_375x667.png",
  "viewport": { "width": 375, "height": 667 },
  "message": "Mobile screenshot saved successfully"
}
```

### Smart Detection
Automatically detects Storybook version and API endpoints for compatibility across different Storybook setups.

## Installation

### Using with Claude Desktop

1. **Install the MCP server via npm:**
   ```bash
   npm install -g storybook-mcp-server
   ```

   Or clone and build locally:
   ```bash
   git clone https://github.com/stefanoamorelli/storybook-mcp-server.git
   cd storybook-mcp-server
   npm install
   npm run build
   ```

2. **Configure Claude Desktop:**
   Add the following to your Claude Desktop MCP settings:
   ```json
   {
     "mcpServers": {
       "storybook": {
         "command": "npx",
         "args": ["storybook-mcp-server"],
         "env": {
           "STORYBOOK_URL": "http://localhost:6006"
         }
       }
     }
   }
   ```
   
   Or if installed locally, use the full path:
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

### Prerequisites for Screenshots

If you want to use the screenshot functionality, Puppeteer requires Chrome/Chromium. When you first run the screenshot command, Puppeteer will automatically download a compatible version of Chromium.

**Manual Chrome Installation (optional):**
- **macOS:** Download from [Google Chrome](https://www.google.com/chrome/)
- **Linux:** 
  ```bash
  # Ubuntu/Debian
  sudo apt-get update
  sudo apt-get install -y chromium-browser
  
  # Fedora
  sudo dnf install chromium
  ```
- **Windows:** Download from [Google Chrome](https://www.google.com/chrome/)

**Note:** Puppeteer will handle Chrome/Chromium automatically, so manual installation is typically not required.

## Usage

Once configured in Claude Desktop, the MCP server will automatically connect to your Storybook instance. Make sure your Storybook is running before using the tools:

```bash
# Start your Storybook instance (in your project directory)
npm run storybook
# or
yarn storybook
```

### Configuration Options

You can customize the server behavior through environment variables in your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "storybook": {
      "command": "npx",
      "args": ["storybook-mcp-server"],
      "env": {
        "STORYBOOK_URL": "http://localhost:9009",
        "OUTPUT_DIR": "./my-screenshots",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Command Line Options

- `--storybook-url`, `-url`: URL of the Storybook instance (default: http://localhost:6006)
- `--output-dir`, `-output`: Directory to save screenshots (default: ./screenshots)
- `--log-level`: Logging level [error, warn, info, debug] (default: info)

## MCP Tools

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

For contributors and developers working on this MCP server:

```bash
# Clone the repository
git clone https://github.com/anthropics/storybook-mcp-server.git
cd storybook-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

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

## Troubleshooting

### Screenshots not working?
1. Ensure Puppeteer has downloaded Chromium: Run `npx puppeteer browsers install chrome`
2. Check that your Storybook instance is running and accessible
3. Verify the STORYBOOK_URL in your configuration matches your running instance

### Connection issues?
1. Verify your Storybook is running on the configured URL
2. Check for any firewall or network restrictions
3. Try accessing the Storybook URL directly in your browser

## License

GNU Affero General Public License v3.0 (AGPL-3.0)

Copyright (C) 2024 [Stefano Amorelli](https://amorelli.tech) <[stefano@amorelli.tech](mailto:stefano@amorelli.tech)>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

### Commercial Licensing

For commercial use or if you need a different license, please contact [stefano@amorelli.tech](mailto:stefano@amorelli.tech) to discuss licensing options.