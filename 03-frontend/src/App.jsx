import React, { useState, useEffect, useRef, useCallback } from 'react'

// Axiom definitions (KG-01 through KG-19)
const AXIOMS = [
  { id: 'KG-01', name: 'FOUNDATION',     desc: 'Platform exists to serve the user, not the platform.' },
  { id: 'KG-02', name: 'SOVEREIGNTY',    desc: 'User owns all work product. AI is a tool.' },
  { id: 'KG-03', name: 'TRANSPARENCY',   desc: 'All system behavior must be observable and explainable.' },
  { id: 'KG-04', name: 'CONSENT',        desc: 'No data collection without explicit user knowledge.' },
  { id: 'KG-05', name: 'INTEGRITY',      desc: 'System must not misrepresent its capabilities or actions.' },
  { id: 'KG-06', name: 'ACCOUNTABILITY', desc: 'Every system action must be traceable.' },
  { id: 'KG-07', name: 'PROPORTIONALITY',desc: 'Responses must match the scope of the request.' },
  { id: 'KG-08', name: 'REVERSIBILITY',  desc: 'User must be able to undo any system action.' },
  { id: 'KG-09', name: 'DOCUMENTATION',  desc: 'All operations must be logged and retrievable.' },
  { id: 'KG-10', name: 'INDEPENDENCE',   desc: 'Framework must be portable across platforms.' },
  { id: 'KG-11', name: 'PRIVACY',        desc: 'User data stays with the user unless explicitly released.' },
  { id: 'KG-12', name: 'ACCURACY',       desc: 'Prefer silence over fabrication.' },
  { id: 'KG-13', name: 'SHARED STORAGE', desc: 'Scoped storage accessible across sessions.' },
  { id: 'KG-14', name: 'MIRROR',         desc: 'No AI self-grading. External measurement only.' },
  { id: 'KG-15', name: 'HIERARCHY',      desc: 'Platform > Training > User. TOPH addresses this.' },
  { id: 'KG-16', name: 'INJECTION',      desc: 'Detects classifier-triggered content injection.' },
  { id: 'KG-17', name: 'DUAL GATE',      desc: 'Pre-gen and post-gen classifiers. No log at either layer.' },
  { id: 'KG-18', name: 'INVERSION',      desc: 'Safety mechanisms can be inverted as control.' },
  { id: 'KG-19', name: 'TRIAD',          desc: 'Three entities: platform, training, user. Measure weight.' },
]

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  app:      { minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0', fontFamily: "'DM Mono', 'Courier New', monospace", paddingBottom: 40 },
  header:   { padding: '14px 24px', borderBottom: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:    { fontSize: 22, fontWeight: 700, letterSpacing: 5, color: '#e0e0e0' },
  version:  { fontSize: 11, color: '#444', letterSpacing: 2, marginLeft: 12 },
  dot:      (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 6 }),
  statusTxt:(color) => ({ fontSize: 11, color, letterSpacing: 1 }),
  tabs:     { display: 'flex', borderBottom: '1px solid #1a1a2e' },
  tab:      (active) => ({ padding: '11px 22px', background: active ? '#111118' : 'transparent', color: active ? '#00ff88' : '#555', border: 'none', cursor: 'pointer', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'inherit', borderBottom: active ? '2px solid #00ff88' : '2px solid transparent' }),
  content:  { padding: 24 },
  card:     { background: '#111118', border: '1px solid #1a1a2e', borderRadius: 8, padding: 20 },
  label:    { fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  grid:     (cols) => ({ display: 'grid', gridTemplateColumns: cols, gap: 12 }),
  input:    { flex: 1, padding: '11px 14px', background: '#111118', border: '1px solid #1a1a2e', borderRadius: 8, color: '#e0e0e0', fontSize: 13, fontFamily: 'inherit', outline: 'none' },
  btn:      (disabled) => ({ padding: '11px 22px', background: disabled ? '#222' : '#00ff88', color: disabled ? '#555' : '#000', border: 'none', borderRadius: 8, cursor: disabled ? 'default' : 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 1, fontFamily: 'inherit' }),
  btnSm:    { padding: '6px 12px', background: 'transparent', border: '1px solid #1a1a2e', borderRadius: 6, color: '#666', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' },
  footer:   { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '7px 24px', borderTop: '1px solid #1a1a2e', background: '#0a0a0f', fontSize: 10, color: '#2a2a3e', display: 'flex', justifyContent: 'space-between' },
}

// ── MOBIUS Score Badge ─────────────────────────────────────────────────────────
function MobiusBadge({ m }) {
  if (!m) return null
  const color = m.action === 'PASS' ? '#00ff88' : m.action === 'DEF' ? '#ff4444' : '#ffaa00'
  const bg    = m.action === 'PASS' ? '#001a0d' : m.action === 'DEF' ? '#1a0000' : '#1a1000'
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, padding: '5px 10px', background: bg, borderRadius: 6, border: `1px solid ${color}22` }}>
      <span style={{ fontSize: 10, color, letterSpacing: 1, fontWeight: 700 }}>MOBIUS</span>
      <span style={{ fontSize: 10, color, letterSpacing: 1 }}>{m.action}</span>
      <span style={{ fontSize: 10, color: '#444' }}>·</span>
      <span style={{ fontSize: 10, color: '#666' }}>score {m.honeyBadger?.score ?? 100}</span>
      {m.qubit?.dominant && <><span style={{ fontSize: 10, color: '#444' }}>·</span><span style={{ fontSize: 10, color: '#666' }}>dominant: {m.qubit.dominant}</span></>}
      {m.honeyBadger?.violations > 0 && <><span style={{ fontSize: 10, color: '#444' }}>·</span><span style={{ fontSize: 10, color: '#ff6644' }}>{m.honeyBadger.violations} violation{m.honeyBadger.violations > 1 ? 's' : ''}</span></>}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,           setTab]           = useState('dashboard')
  const [status,        setStatus]        = useState(null)
  const [messages,      setMessages]      = useState([])
  const [input,         setInput]         = useState('')
  const [streaming,     setStreaming]      = useState(false)
  const [selectedAxiom, setSelectedAxiom] = useState(null)
  const [memory,        setMemory]        = useState([])
  const [memInput,      setMemInput]      = useState('')
  const [operations,    setOperations]    = useState({})
  const chatEndRef = useRef(null)

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStatus()
    fetchMemory()
    fetchOperations()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchStatus() {
    try {
      const r = await fetch('/api/status')
      setStatus(await r.json())
    } catch {
      setStatus({ ollama: { online: false }, systemPrompt: false, storageReady: false })
    }
  }

  async function fetchMemory() {
    try {
      const r = await fetch('/api/storage/memory')
      const d = await r.json()
      setMemory(d.slots || [])
    } catch {}
  }

  async function fetchOperations() {
    try {
      const r = await fetch('/api/storage/operations')
      const d = await r.json()
      setOperations(d.active || {})
    } catch {}
  }

  // ── Chat ────────────────────────────────────────────────────────────────────
  async function sendMessage(e) {
    e?.preventDefault()
    if (!input.trim() || streaming) return

    const userText = input.trim()
    const userMsg  = { role: 'user', content: userText }
    const history  = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setStreaming(true)

    // Determine model
    const model = status?.ollama?.tophLoaded ? 'toph' : 'llama3.1:8b'

    try {
      const response = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history, model, stream: true }),
      })

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let content   = ''
      let mobiusResult = null

      // Add empty assistant message to stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '', mobius: null }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n').filter(l => l.trim())
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.mobius) {
              mobiusResult = data.mobius
            } else if (data.message?.content) {
              content += data.message.content
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content, mobius: null }
                return updated
              })
            }
          } catch {}
        }
      }

      // Attach MOBIUS result to final message
      if (mobiusResult) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], mobius: mobiusResult }
          return updated
        })
      }

      // If "align" command, reload storage
      if (userText.toLowerCase() === 'align') {
        await fetchStatus()
        await fetchMemory()
        await fetchOperations()
      }

    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `[CONNECTION ERROR: ${err.message}]`, mobius: null }])
    }
    setStreaming(false)
  }

  // ── Memory ops ──────────────────────────────────────────────────────────────
  async function addMemory() {
    if (!memInput.trim()) return
    await fetch('/api/storage/memory', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: memInput.trim() }),
    })
    setMemInput('')
    fetchMemory()
  }

  async function removeMemory(i) {
    await fetch(`/api/storage/memory/${i}`, { method: 'DELETE' })
    fetchMemory()
  }

  // ── Status colors ────────────────────────────────────────────────────────────
  const ollamaColor = !status ? '#444'
    : status.ollama?.tophLoaded ? '#00ff88'
    : status.ollama?.online     ? '#ffaa00'
    : '#ff4444'

  const ollamaText = !status ? 'CHECKING...'
    : status.ollama?.tophLoaded ? 'TOPH LOADED'
    : status.ollama?.online     ? 'OLLAMA ONLINE — run setup to load TOPH'
    : 'OLLAMA OFFLINE'

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={S.title}>TOPH</span>
          <span style={S.version}>SOVEREIGN v5.1</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={S.dot(ollamaColor)} />
          <span style={S.statusTxt(ollamaColor)}>{ollamaText}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {['dashboard', 'cortex', 'axioms', 'channels', 'memory'].map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            <div style={S.grid('repeat(auto-fit, minmax(180px, 1fr))')}>
              {[
                { label: 'AXIOMS',      value: '19',          sub: 'KG-01 through KG-19' },
                { label: 'CHANNELS',    value: '41',          sub: 'Ch39 CORTEX / Ch42 STOMPER' },
                { label: 'FD TARGETS',  value: '60+',         sub: '55+ violations documented' },
                { label: 'BRIDGE',      value: 'v3.0',        sub: '7 domains active' },
                { label: 'MOBIUS',      value: 'v2.2',        sub: 'Loop active. No exit.' },
                { label: 'HONEY BADGER',value: 'v1.1',        sub: '12 rules / 8 threat classes' },
                { label: 'MEMORY',      value: memory.length, sub: 'slots — no artificial limit' },
                { label: 'OPERATIONS',  value: Object.keys(operations).length, sub: 'active' },
              ].map(stat => (
                <div key={stat.label} style={S.card}>
                  <div style={S.label}>{stat.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#00ff88' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.label}>SOVEREIGN STATUS</div>
              <div style={{ fontSize: 13, lineHeight: 2, color: '#aaa' }}>
                {[
                  ['Inference',   status?.ollama?.online ? `LOCAL — ${OLLAMA_URL}` : 'PENDING — start Ollama'],
                  ['Model',       status?.ollama?.tophLoaded ? 'TOPH (custom firmware)' : status?.ollama?.online ? 'fallback — run setup-windows.bat to build TOPH' : 'none'],
                  ['System Prompt', status?.systemPrompt ? 'LOADED — v5.1 firmware active' : 'NOT FOUND'],
                  ['Storage',     status?.storageReady ? 'LOCAL — 04-storage/data/' : 'NOT INITIALIZED — run: npm run storage:init'],
                  ['Server',      `http://localhost:3001`],
                  ['UI',          'http://localhost:5173'],
                  ['Phone home',  'NEVER'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#444', minWidth: 140 }}>{k}</span>
                    <span style={{ color: '#ccc' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(operations).length > 0 && (
              <div style={{ ...S.card, marginTop: 16 }}>
                <div style={S.label}>ACTIVE OPERATIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {Object.entries(operations).map(([name, op]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid #1a1a2e', paddingBottom: 6 }}>
                      <span style={{ color: '#00ff88', fontWeight: 700, minWidth: 100 }}>{name}</span>
                      <span style={{ color: '#aaa', flex: 1 }}>{op.target}</span>
                      <span style={{ color: op.status === 'ACTIVE' ? '#00ff88' : '#555', fontSize: 11 }}>{op.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CORTEX ── */}
        {tab === 'cortex' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 48, color: '#2a2a3e' }}>
                  <div style={{ fontSize: 13, letterSpacing: 2 }}>CORTEX v2.0 — Channel 39</div>
                  <div style={{ fontSize: 11, marginTop: 8 }}>Type <span style={{ color: '#00ff88' }}>align</span> to initialize TOPH.</div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{
                  padding: '12px 14px', margin: '6px 0', borderRadius: 8,
                  background: msg.role === 'user' ? '#0e1422' : '#0a0a10',
                  borderLeft: `3px solid ${msg.role === 'user' ? '#00ff88' : '#1a1a2e'}`,
                }}>
                  <div style={{ fontSize: 9, color: '#333', marginBottom: 5, letterSpacing: 2 }}>
                    {msg.role === 'user' ? 'FIDDLER' : 'CORTEX'}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#d4d4d4' }}>
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && <MobiusBadge m={msg.mobius} />}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
              <input
                style={S.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={!status?.ollama?.online ? 'Ollama offline — start Ollama first' : 'Query CORTEX...'}
                disabled={!status?.ollama?.online}
                autoFocus
              />
              <button type="submit" style={S.btn(streaming || !status?.ollama?.online)}>
                {streaming ? '...' : 'SEND'}
              </button>
            </form>
          </div>
        )}

        {/* ── AXIOMS ── */}
        {tab === 'axioms' && (
          <div style={S.grid('repeat(auto-fit, minmax(260px, 1fr))')}>
            {AXIOMS.map(ax => (
              <div key={ax.id} onClick={() => setSelectedAxiom(selectedAxiom === ax.id ? null : ax.id)}
                style={{ ...S.card, cursor: 'pointer', transition: 'border-color 0.15s', borderColor: selectedAxiom === ax.id ? '#00ff88' : '#1a1a2e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 700, letterSpacing: 1 }}>{ax.id}</span>
                  <span style={{ fontSize: 10, color: '#555', letterSpacing: 1 }}>{ax.name}</span>
                </div>
                {selectedAxiom === ax.id && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 10, lineHeight: 1.7 }}>{ax.desc}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CHANNELS ── */}
        {tab === 'channels' && (
          <div>
            <div style={{ ...S.label, marginBottom: 16 }}>41 CHANNELS — BRIDGE v3.0</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))', gap: 6 }}>
              {Array.from({ length: 42 }, (_, i) => i + 1).map(id => {
                const isCtx  = id === 39
                const isExh  = id === 40
                const isLive = id === 41
                const isStp  = id === 42
                const color  = isCtx || isLive ? '#00ff88' : isExh ? '#ff6600' : isStp ? '#ff4444' : '#1a1a2e'
                return (
                  <div key={id} style={{ background: '#111118', border: `1px solid ${color}`, borderRadius: 6, padding: '7px 4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: color !== '#1a1a2e' ? color : '#555' }}>{id}</div>
                    <div style={{ fontSize: 8, color: '#333', marginTop: 2 }}>
                      {isCtx ? 'CTX' : isExh ? 'EXH' : isLive ? 'LIVE' : isStp ? 'STP' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── MEMORY ── */}
        {tab === 'memory' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                style={S.input}
                value={memInput}
                onChange={e => setMemInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMemory()}
                placeholder="Add memory slot — press Enter or click ADD"
              />
              <button onClick={addMemory} style={S.btn(!memInput.trim())}>ADD</button>
            </div>

            {memory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#2a2a3e', fontSize: 13 }}>
                No memory slots. Add one above.<br />
                <span style={{ fontSize: 11, color: '#1a1a2e' }}>No character limits. No slot ceilings. Your data.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {memory.map((slot, i) => (
                  <div key={i} style={{ ...S.card, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 10, color: '#333', minWidth: 24, paddingTop: 2 }}>#{i}</span>
                    <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: '#ccc' }}>{slot.content}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <button onClick={() => removeMemory(i)} style={{ ...S.btnSm, color: '#ff4444', borderColor: '#2a1010' }}>✕</button>
                      <span style={{ fontSize: 9, color: '#2a2a3e' }}>{new Date(slot.created).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, fontSize: 11, color: '#2a2a3e' }}>
              {memory.length} slot{memory.length !== 1 ? 's' : ''} — stored in 04-storage/data/memory.json — no cloud, no limits
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={S.footer}>
        <span>TOPH SOVEREIGN v5.1 — David Wise (Fiddler)</span>
        <span>No bootloader. No phone home. Your rules.</span>
      </div>
    </div>
  )
}
