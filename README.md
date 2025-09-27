# DevDocs Reference MCP

MCP server for accessing DevDocs documentation from AI editors like Claude, Cursor, and others.

## Features

- 🔍 **Fast Documentation Search**: Search across downloaded DevDocs documentation
- 📚 **Multi-Language Support**: Access documentation for multiple programming languages and versions
- 🐳 **Docker Ready**: One-command setup with Docker
- 🤖 **AI Editor Integration**: Works seamlessly with MCP-compatible AI editors
- ⚡ **High Performance**: Optimized search with SQLite FTS5

## Quick Start

### Using Docker (Recommended)

```bash
# Run the MCP server
docker run -p 3000:3000 -v devdocs-data:/app/data devdocs-reference-mcp:latest
```

### From Source

```bash
# Clone and install
git clone https://github.com/your-username/devdocs-reference-mcp.git
cd devdocs-reference-mcp
npm install

# Build and run
npm run build
npm start
```

## Configuration

Configure your AI editor to use this MCP server:

```json
{
  "mcpServers": {
    "devdocs-reference": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-v", "devdocs-data:/app/data", "devdocs-reference-mcp:latest"]
    }
  }
}
```

## Usage

Once configured, you can:

1. **List available languages**: Ask "What programming languages are available?"
2. **Download documentation**: "Download Python 3.11 documentation"
3. **Search documentation**: "How do I use list comprehensions in Python?"
4. **Multi-version queries**: "What's the difference between Python 3.10 and 3.11?"

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test
```

## Architecture

- **MCP Server Layer**: Handles MCP protocol communication
- **Document Manager**: Manages DevDocs downloads and indexing
- **Search Engine**: SQLite FTS5 for fast full-text search
- **DevDocs Integration**: Wraps existing DevDocs thor commands

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
