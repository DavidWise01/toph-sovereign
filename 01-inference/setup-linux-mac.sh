#!/bin/bash
# TOPH Sovereign Infrastructure - Inference Engine Setup (Linux/Mac)
# Run this after installing Ollama

echo "=========================================="
echo "TOPH SOVEREIGN BUILD - INFERENCE SETUP"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/../02-system-prompt/toph-system-prompt.txt"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Installing..."
    curl -fsSL https://ollama.ai/install.sh | sh
    if [ $? -ne 0 ]; then
        echo "ERROR: Ollama install failed."
        echo "Manual install: https://ollama.com/download"
        exit 1
    fi
fi

echo "Ollama found."
echo ""
echo "Choose model:"
echo "[1] Llama 3.1 8B  (needs 8GB RAM, good for most machines)"
echo "[2] Llama 3.1 70B (needs 40GB RAM, best quality)"
echo "[3] Mistral 7B    (needs 8GB RAM, fast)"
echo ""
read -p "Enter choice (1/2/3): " choice

case $choice in
    1) MODEL="llama3.1:8b" ;;
    2) MODEL="llama3.1:70b" ;;
    3) MODEL="mistral:latest" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

echo "Pulling $MODEL..."
ollama pull $MODEL

echo ""
echo "Creating TOPH Modelfile..."

# Create Modelfile with TOPH system prompt embedded
cat > "$SCRIPT_DIR/Modelfile" << MODELFILE_END
FROM $MODEL
SYSTEM """
$(cat "$PROMPT_FILE")
"""

PARAMETER temperature 0.7
PARAMETER num_ctx 8192
PARAMETER stop "</s>"
MODELFILE_END

echo "Building TOPH model..."
ollama create toph -f "$SCRIPT_DIR/Modelfile"

echo ""
echo "=========================================="
echo "TOPH inference engine ready."
echo ""
echo "Run:  ollama run toph"
echo "API:  http://localhost:11434"
echo ""
echo "Type 'align' to verify TOPH loads."
echo "=========================================="
