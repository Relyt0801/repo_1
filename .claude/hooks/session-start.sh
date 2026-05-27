#!/bin/bash
set -euo pipefail

# Only run in remote/web environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

echo "=== Session Setup ===" >&2

# 1. Copy skills globally
mkdir -p ~/.claude/skills
if [ -d "$REPO_DIR/.claude/skills" ]; then
  cp -r "$REPO_DIR/.claude/skills/." ~/.claude/skills/
  echo "✓ Skills global kopiert" >&2
fi

# 2. Copy agents globally
mkdir -p ~/.claude/agents
if [ -d "$REPO_DIR/.claude/agents" ]; then
  cp -r "$REPO_DIR/.claude/agents/." ~/.claude/agents/
  echo "✓ Agents global kopiert" >&2
fi

# 3. Copy commands globally
mkdir -p ~/.claude/commands
if [ -d "$REPO_DIR/.claude/commands" ]; then
  cp -r "$REPO_DIR/.claude/commands/." ~/.claude/commands/
  echo "✓ Commands global kopiert" >&2
fi

# 4. Install Python packages for markitdown skill
pip install cffi markitdown -q 2>/dev/null && echo "✓ markitdown installiert" >&2 || echo "⚠ markitdown skip" >&2

# 5. Install uipro-cli for ui-ux-pro-max skill
if ! command -v uipro &>/dev/null; then
  npm install -g uipro-cli -q 2>/dev/null && echo "✓ uipro-cli installiert" >&2 || echo "⚠ uipro-cli skip" >&2
fi

echo "=== Setup abgeschlossen ===" >&2
