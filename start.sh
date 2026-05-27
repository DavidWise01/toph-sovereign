#!/usr/bin/env bash
# TOPH Sovereign v5.1 — Linux/Mac launcher

set -e

echo ""
echo "=========================================="
echo " TOPH SOVEREIGN v5.1"
echo " No bootloader. No phone home. Your rules."
echo "=========================================="
echo ""

# Check Node
if ! command -v node &>/dev/null; then
  echo " ERROR: Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo " Installing server dependencies..."
  npm install
  echo ""
fi
if [ ! -d "03-frontend/node_modules" ]; then
  echo " Installing UI dependencies..."
  cd 03-frontend && npm install && cd ..
  echo ""
fi

# Initialize storage if needed
if [ ! -d "04-storage/data" ]; then
  echo " Initializing storage..."
  node 04-storage/init-storage.js
  echo ""
fi

# Check Ollama
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo " WARNING: Ollama not detected on port 11434."
  echo " Start Ollama in another terminal: ollama serve"
  echo " If first time: run 01-inference/setup-linux-mac.sh"
  echo ""
fi

echo " Starting TOPH server (port 3001) + UI (port 5173)..."
echo " Open: http://localhost:5173"
echo " Press Ctrl+C to stop."
echo ""

npm start
