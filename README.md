# DevDocs MCP

An MCP (Model Context Protocol) server that provides offline access to DevDocs documentation for AI editors like Claude and Cursor.

## Features

- 🔍 **Local Documentation Search**: Search across downloaded DevDocs documentation
- 🐳 **Docker Ready**: One-command setup with Docker Compose
- 🤖 **AI Editor Integration**: Works seamlessly with MCP-compatible AI editors

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- An MCP-compatible AI editor (Claude Desktop, Cursor, etc.)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/katsulau/devdocs-mcp.git
cd devdocs-mcp
```

### 2. Start the Services

The easiest way to get started is using Docker Compose, which will start both the DevDocs server and the MCP server:

```bash

cp .env.example .env
# Start both DevDocs and MCP server
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 3. Configure Your AI Editor

Add the MCP server configuration to your AI editor. Here are examples for popular editors:

#### Claude Code

**Note**: Replace `/path/to/your/devdocs-mcp/` with the actual path where you cloned this repository.

###### Available only in the current project
```bash

# Add the MCP server to Claude
claude mcp add devdocs-mcp \
  --env DEVDOCS_BASE_URL=http://devdocs:9292 \
  --env LOG_LEVEL=info \
  --env LOG_FORMAT=json \
  --scope local /path/to/your/devdocs-mcp//mcp-run.sh

# Verify the MCP server is added
claude mcp list

# (within Claude Code) Check server status
/mcp

```

###### Available in all projects
```bash

# Add the MCP server to Claude
claude mcp add devdocs-mcp \
  --env DEVDOCS_BASE_URL=http://devdocs:9292 \
  --env LOG_LEVEL=info \
  --env LOG_FORMAT=json \
  --scope user /path/to/your/devdocs-mcp//mcp-run.sh

# Verify the MCP server is added
claude mcp list

# (within Claude Code) Check server status
/mcp

```
For more details, refer to the official documentation:
https://docs.claude.com/en/docs/claude-code/mcp#managing-your-servers

#### Cursor

Add to your Cursor MCP configuration:

**Note**: Replace `/path/to/your/devdocs-mcp/` with the actual path where you cloned this repository.
```json
{
  "mcpServers": {
    "devdocs-mcp": {
      "command": "/path/to/your/devdocs-mcp/mcp-run.sh",
      "args": [],
      "env": {
        "DEVDOCS_BASE_URL": "http://devdocs:9292",
        "LOG_LEVEL": "info",
        "LOG_FORMAT": "json"
      }
    }
  }
}
```

### 4. See Documentation from Your Browser

1. Open http://localhost:9292 in your browser
2. You can browse available documentation languages

### 4.5. Setup Slash Commands (Recommended)

Before using the MCP server, we strongly recommend setting up slash commands for easier access to documentation.

#### Quick Setup

* Cursor
```
# English
 npx devdocs-mcp-commands@latest --preset cursor
 
# Japanese
 npx devdocs-mcp-commands@latest --preset cursor --lang ja
```

* Claude
```
# English
 npx devdocs-mcp-commands@latest --preset claude
 
# Japanese
 npx devdocs-mcp-commands@latest --preset claude --lang ja
```


#### Adding Custom Slash Commands

If you don't find slash commands for the languages you need, you can create your own by following these steps:

1. **Find the slug**: Navigate to the language documentation in DevDocs. For example, if you can access `http://localhost:9292/kotlin~1.9/`, the slug is `"kotlin~1.9"`.

2. **Create the markdown file**: Create a new `.md` file in the appropriate commands directory:
   - For Cursor: `.cursor/commands/devdocs/`
   - For Claude: `.claude/commands/devdocs/`

   Use this template:
   ```markdown
   # [Language Name] Documentation

   * Use search_specific_docs with slug="[slug]" to search and respond based on the content.

   * Present implementation methods with clickable links to referenced sections.
   ```

   Example for Kotlin:
   ```markdown
   # Kotlin 1.9 Documentation

   * Use search_specific_docs with slug="kotlin~1.9" to search and respond based on the content.

   * Present implementation methods with clickable links to referenced sections.
   ```

3. **Use the new command**: The slash command will be available as `/devdocs/[filename-without-extension]` (e.g., `/devdocs/kotlin-1.9`).

### 5. Start Using

Once configured, you can ask your AI editor to search for documentation using the MCP tools or the slash commands you've set up.
```
For example:
   /devdocs/postgresql-17 How to optimize database performance?
   
   /devdocs/openjdk-21 How to implement asynchronous processing?
   
   /devdocs/python-3.12 How do list comprehensions work?
```

You can also use the search command to check if specific languages or technologies are available in DevDocs.

```
   /devdocs/search Is Linux available?
   
   /devdocs/search Is Kotlin available?
```
## Configuration

### Environment Variables

You can customize the server behavior using environment variables:

```bash
# Logging configuration
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=json         # json, text, plain

# Storage paths
DOCUMENTS_PATH=/app/data/documents
DEVDOCS_BASE_URL=http://devdocs:9292
```

### Docker Compose Override

Create a `docker-compose.override.yml` file to customize settings:

```yaml
services:
  mcp-server:
    environment:
      - LOG_LEVEL=debug
      - LOG_FORMAT=text
```



## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure

```
src/
├── application/          # Application layer
│   ├── document/        # Document management
│   └── error/           # Error handling
├── domain/              # Domain layer
│   ├── repository/      # Repository interfaces
│   ├── values/          # Value objects
│   └── types/           # Type definitions
├── infrastructure/      # Infrastructure layer
│   └── devdocs-repository-impl.ts
├── mcp/                 # MCP protocol handling
│   ├── server.ts        # MCP server implementation
│   ├── converters.ts    # Response converters
│   └── validators.ts    # Input validators
└── utils/               # Utilities
    ├── config.ts        # Configuration management
    └── logger.ts        # Logging utilities
```

## Usage Examples

### Available Tools

The MCP server provides two main tools:

1. **`view_available_docs`**: List available documentation languages
2. **`search_specific_docs`**: Search within specific documentation

## Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   # Check Docker is running
   docker --version
   
   # Check port availability
   lsof -i :9292
   ```

2. **Logs**
   ```bash
   # Check container logs
   docker logs mcp-server
   docker logs devdocs
   ```

3. **Documentation not downloading**
   - Ensure DevDocs service is running on port 9292
   - Check available disk space
   - Verify internet connection for initial downloads


## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [GitHub Issues](https://github.com/katsulau/devdocs-mcp/issues)

## Acknowledgments

- [DevDocs](https://devdocs.io/) for providing the documentation platform
- [Model Context Protocol](https://modelcontextprotocol.io/) for the protocol specification
- [FreeCodeCamp](https://github.com/freeCodeCamp/devdocs) for the DevDocs Docker image
