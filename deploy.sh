#!/usr/bin/env bash
# 把本包同步安装到 web profile 的 node_modules。
# 用真实目录而非符号链接：符号链接会让 Node 按真实路径解析依赖，
# 导致 @deepseek-ai/* 找不到（Node 不按符号链接位置向上查找）。
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="${DSH_HOME:-$HOME/.dsh}/profiles/web/node_modules/dsh-claude-theme"
rm -rf "$DEST"
cp -r "$SRC" "$DEST"
rm -rf "$DEST/.git" "$DEST/deploy.sh"
echo "synced: $SRC -> $DEST"
