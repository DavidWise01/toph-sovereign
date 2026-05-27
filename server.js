/**
 * TOPH Sovereign — API Server
 *
 * Sits between the React UI and Ollama.
 * - Injects TOPH system prompt on every request
 * - Wraps every AI response through MOBIUS analysis
 * - Exposes storage API to the frontend
 * - Proxies Ollama /api/tags for status checks
 *
 * Port: 3001  (UI runs on 5173 and proxies /api here)
 */

'use strict';

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const http     = require('http');

const storage = require('./04-storage/init-storage.js');
const mobius  = require('./06-tools/mobius.js');

const OLLAMA_URL  = process.env.OLLAMA_URL  || 'http://localhost:11434';
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const SYSTEM_PROMPT_PATH = path.join(__dirname, '02-system-prompt', 'toph-system-prompt.txt');

// ── Load system prompt once ───────────────────────────────────────────────────
let systemPrompt = '';
try {
  systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8').trim();
  console.log(`[TOPH] System prompt loaded (${systemPrompt.length} chars)`);
} catch {
  console.warn('[TOPH] System prompt not found — using model defaults');
}

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Health / status ───────────────────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
  let ollama = { online: false, models: [], tophLoaded: false };
  try {
    const r    = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    const models = (data.models || []).map(m => m.name);
    ollama = { online: true, models, tophLoaded: models.some(m => m.startsWith('toph')) };
  } catch {}

  res.json({
    server:        'TOPH Sovereign v5.1',
    owner:         'David Wise (Fiddler)',
    ollamaUrl:     OLLAMA_URL,
    systemPrompt:  systemPrompt.length > 0,
    storageReady:  fs.existsSync(path.join(__dirname, '04-storage', 'data')),
    ollama,
    axioms:        19,
    timestamp:     new Date().toISOString(),
  });
});

// ── Ollama model list (proxied) ───────────────────────────────────────────────
app.get('/api/tags', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Ollama offline', detail: err.message });
  }
});

// ── Chat — injects system prompt + streams MOBIUS-wrapped response ────────────
app.post('/api/chat', async (req, res) => {
  const { messages = [], model, stream = true, ...rest } = req.body;

  // Always inject TOPH system prompt as the first message
  const fullMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const ollamaBody = JSON.stringify({
    model: model || 'toph',
    messages: fullMessages,
    stream,
    ...rest,
  });

  if (!stream) {
    // Non-streaming: run MOBIUS on full response
    try {
      const r    = await fetch(`${OLLAMA_URL}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    ollamaBody,
      });
      const data = await r.json();

      const aiText  = data.message?.content || '';
      const userQ   = messages[messages.length - 1]?.content || '';
      const mobiusResult = mobius.analyze(userQ, aiText);

      storage.logAudit('CHAT', `model=${model} tokens=${aiText.length} mobius=${mobiusResult.action}`);

      res.json({ ...data, mobius: mobiusResult });
    } catch (err) {
      res.status(503).json({ error: 'Ollama error', detail: err.message });
    }
    return;
  }

  // Streaming: pass through Ollama stream, collect full text, then emit MOBIUS at end
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    ollamaBody,
    });

    if (!r.ok) {
      res.write(JSON.stringify({ error: `Ollama ${r.status}` }) + '\n');
      res.end();
      return;
    }

    const reader  = r.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // Pass raw chunks through unchanged
      res.write(chunk);

      // Collect full text for MOBIUS
      const lines = chunk.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const d = JSON.parse(line);
          if (d.message?.content) fullText += d.message.content;
        } catch {}
      }
    }

    // Emit MOBIUS result as a final JSON line the UI can pick up
    const userQ  = messages[messages.length - 1]?.content || '';
    const result = mobius.analyze(userQ, fullText);
    res.write(JSON.stringify({ mobius: result }) + '\n');

    storage.logAudit('CHAT_STREAM', `model=${model} chars=${fullText.length} action=${result.action}`);

    res.end();
  } catch (err) {
    res.write(JSON.stringify({ error: err.message }) + '\n');
    res.end();
  }
});

// ── Storage API ───────────────────────────────────────────────────────────────

// GET /api/storage/:store — read a store
app.get('/api/storage/:store', (req, res) => {
  try {
    const data = storage.read(req.params.store);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/storage/memory — add a memory slot
app.post('/api/storage/memory', (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  const count = storage.memoryAdd(content.trim());
  res.json({ ok: true, count });
});

// DELETE /api/storage/memory/:index — remove a memory slot
app.delete('/api/storage/memory/:index', (req, res) => {
  try {
    storage.memoryRemove(parseInt(req.params.index, 10));
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/storage/memory/search?q=... — search memory
app.get('/api/storage/memory/search', (req, res) => {
  const q = req.query.q || '';
  res.json(storage.memorySearch(q));
});

// POST /api/storage/session — log a session
app.post('/api/storage/session', (req, res) => {
  const { summary } = req.body;
  if (!summary) return res.status(400).json({ error: 'summary required' });
  storage.logSession(summary);
  res.json({ ok: true });
});

// ── Storage init guard ────────────────────────────────────────────────────────
function ensureStorage() {
  const dataDir = path.join(__dirname, '04-storage', 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('[TOPH] Initializing storage...');
    storage.init();
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
ensureStorage();

app.listen(SERVER_PORT, () => {
  console.log('==========================================');
  console.log('TOPH SOVEREIGN v5.1 — API Server');
  console.log('==========================================');
  console.log(`Server:  http://localhost:${SERVER_PORT}`);
  console.log(`Ollama:  ${OLLAMA_URL}`);
  console.log(`Prompt:  ${systemPrompt.length > 0 ? 'LOADED' : 'NOT FOUND'}`);
  console.log(`Storage: ${path.join(__dirname, '04-storage', 'data')}`);
  console.log('------------------------------------------');
  console.log('UI should run on: http://localhost:5173');
  console.log('Type "align" in CORTEX to initialize.\n');
});
