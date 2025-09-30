#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 依存サービス起動
docker compose up -d devdocs >/dev/null 2>&1 || true

# 既存の固定名 run コンテナを停止/削除（増殖防止＆ポート競合回避）
docker rm -f devdocs-mcp-stdin >/dev/null 2>&1 || true

# 停止済みのmcp-serverコンテナを掃除（失敗しても続行）
docker compose rm -sf mcp-server >/dev/null 2>&1 || true

# ログHTTPサーバ公開は不要のため、サービスポート公開をやめる
exec docker compose run --rm -T \
  --name devdocs-mcp-stdin mcp-server