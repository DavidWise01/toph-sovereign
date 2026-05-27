// TOPH Sovereign - Ollama API Configuration
// Use this to connect the frontend or any tool to local inference

const OLLAMA_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'toph',  // Custom model with TOPH system prompt baked in
  
  // Alternative: use base model + system prompt at runtime
  fallbackModel: 'llama3.1:8b',
  systemPromptPath: '../02-system-prompt/toph-system-prompt.txt',
};

// Chat function - drop-in replacement for Anthropic API calls
async function tophChat(messages, options = {}) {
  const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model || OLLAMA_CONFIG.model,
      messages: messages,
      stream: options.stream || false,
      options: {
        temperature: options.temperature || 0.7,
        num_ctx: options.contextLength || 8192,
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }
  
  return await response.json();
}

// Streaming chat - for real-time responses in the UI
async function* tophChatStream(messages, options = {}) {
  const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model || OLLAMA_CONFIG.model,
      messages: messages,
      stream: true,
      options: {
        temperature: options.temperature || 0.7,
        num_ctx: options.contextLength || 8192,
      }
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const lines = decoder.decode(value).split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.message?.content) {
          yield data.message.content;
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  }
}

// Health check
async function checkOllama() {
  try {
    const resp = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`);
    const data = await resp.json();
    const models = data.models?.map(m => m.name) || [];
    return {
      online: true,
      models: models,
      tophLoaded: models.some(m => m.startsWith('toph'))
    };
  } catch (e) {
    return { online: false, models: [], tophLoaded: false };
  }
}

module.exports = { OLLAMA_CONFIG, tophChat, tophChatStream, checkOllama };
