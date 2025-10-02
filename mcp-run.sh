#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Start DevDocs service in background
docker compose up -d devdocs >/dev/null 2>&1 || true

# Stop and remove existing fixed-name run container (prevent proliferation & avoid port conflicts)
docker rm -f devdocs-mcp-server >/dev/null 2>&1 || true

# Remove stopped mcp-server containers (continue even if it fails)
docker compose rm -sf mcp-server >/dev/null 2>&1 || true

# Run MCP server with stdin/stdout for MCP communication
exec docker compose run --rm -T \
  --name devdocs-mcp-server mcp-server