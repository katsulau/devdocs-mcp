# DevDocs MCP Commands

A tool to initialize DevDocs MCP slash commands for Cursor and Claude editors.

## Installation

```bash
npm install -g devdocs-mcp-commands
```

Or use with npx:

```bash
npx devdocs-mcp-commands --preset cursor
npx devdocs-mcp-commands --preset claude
```

## Usage

### Initialize Cursor Commands

```bash
npx devdocs-mcp-commands cursor
# or
npx devdocs-mcp-commands --preset cursor
```

This will create the following commands in `.cursor/commands/devdocs/`:
- `/devdocs/search` - Search for documentation
- `/devdocs/typescript` - TypeScript documentation
- `/devdocs/javascript` - JavaScript documentation
- `/devdocs/python` - Python documentation
- `/devdocs/react` - React documentation

### Initialize Claude Commands

```bash
npx devdocs-mcp-commands claude
# or
npx devdocs-mcp-commands --preset claude
```

This will create the same commands in `.claude/commands/devdocs/`.

## Prerequisites

- Node.js 18+
- DevDocs MCP server running
- Cursor or Claude Desktop configured with MCP

## Commands Created

### `/devdocs/search`
Search for available documentation languages and provide clickable links.

### `/devdocs/typescript`
Search TypeScript documentation specifically.

### `/devdocs/javascript`
Search JavaScript documentation specifically.

### `/devdocs/python`
Search Python 3.12 documentation specifically.

### `/devdocs/react`
Search React documentation specifically.

## Next Steps

After running the init command:

1. Restart your editor (Cursor or Claude Desktop)
2. Use the new slash commands
3. Enable documentation languages at http://localhost:9292
4. Start searching for documentation!

## License

MIT License - see [LICENSE](../LICENSE) for details.
