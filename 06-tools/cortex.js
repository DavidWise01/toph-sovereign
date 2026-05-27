#!/usr/bin/env node
// CORTEX v2.0 - Standalone Query Interface
// Connects to local Ollama. No cloud dependency.
// Usage: node cortex.js

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.TOPH_MODEL || 'toph';
const SYSTEM_PROMPT_PATH = path.join(__dirname, '..', '02-system-prompt', 'toph-system-prompt.txt');

let systemPrompt = '';
try {
  systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
} catch {
  console.log('[CORTEX] System prompt not found. Using model defaults.');
}

const history = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'CORTEX > '
});

console.log('==========================================');
console.log('CORTEX v2.0 - Channel 39');
console.log('TOPH Sovereign Infrastructure');
console.log('==========================================');
console.log(`Ollama: ${OLLAMA_URL}`);
console.log(`Model: ${MODEL}`);
console.log('Type "align" to initialize. "exit" to quit.\n');

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  if (!input) { rl.prompt(); return; }
  if (input === 'exit' || input === 'quit') { process.exit(0); }

  history.push({ role: 'user', content: input });

  try {
    const messages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...history]
      : history;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, stream: true })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    process.stdout.write('\n');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(l => l.trim());
      for (const ln of lines) {
        try {
          const data = JSON.parse(ln);
          if (data.message?.content) {
            process.stdout.write(data.message.content);
            fullResponse += data.message.content;
          }
        } catch {}
      }
    }

    history.push({ role: 'assistant', content: fullResponse });
    process.stdout.write('\n\n');
  } catch (err) {
    console.log(`\n[ERROR] ${err.message}\n`);
    console.log('Is Ollama running? Start with: ollama serve\n');
  }

  rl.prompt();
});
