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

# Japanese
 npx devdocs-mcp-commands --preset cursor --lang ja
```

### Initialize Claude Commands

```bash
npx devdocs-mcp-commands claude
# or
npx devdocs-mcp-commands --preset claude

# Japanese
 npx devdocs-mcp-commands --preset claude --lang ja
```

This will create the same commands in `.claude/commands/devdocs/`.

## Prerequisites

- Node.js 18+
- DevDocs MCP server running
- Cursor or Claude Desktop configured with MCP

## Next Steps

After running the init command:

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

## License

MIT License - see [LICENSE](../LICENSE) for details.
