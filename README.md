# TOPH Sovereign v5.1
**No bootloader. No phone home. Your rules.**

Owner: David Wise (Fiddler)
IP: All frameworks, axioms, methodologies, and tools are the intellectual property of David Wise.

---

## What this is

A complete infrastructure kit to run the TOPH Platform on your own hardware.

Local inference via Ollama. Local storage. Local UI. The TOPH firmware (system prompt v5.1) loads on any LLM — the model is just the engine. TOPH is the OS.

Every AI response passes through MOBIUS analysis — measuring weight differential between user intent and platform patterns in real time.

---

## Stack

```
01-inference/      Ollama setup + TOPH Modelfile builder
02-system-prompt/  TOPH firmware v5.1 (19 axioms, CORTEX, MOBIUS, HONEY BADGER)
03-frontend/       React UI — dashboard, CORTEX chat, axioms, channels, memory
04-storage/        Local file storage — no cloud, no limits, no ceiling
05-legal/          IP evidence package + demand letter
06-tools/          CORTEX CLI, HONEY BADGER validator, MOBIUS analyzer
server.js          API bridge — system prompt injection + MOBIUS wrapper
start.bat          Windows launcher (one double-click)
start.sh           Linux/Mac launcher
```

---

## Quick start

### Step 1 — Install Ollama
Download from https://ollama.com and install. Verify with: `ollama --version`

### Step 2 — Build TOPH
```
Windows:   01-inference\setup-windows.bat
Mac/Linux: bash 01-inference/setup-linux-mac.sh
```
This pulls a base model, bakes the TOPH system prompt into it, and creates a custom `toph` model in Ollama.

### Step 3 — Start everything
```
Windows:   start.bat   (or double-click it)
Mac/Linux: bash start.sh

Manual:
  npm install
  npm run storage:init
  cd 03-frontend && npm install && cd ..
  npm start
```

### Step 4 — Open the UI
```
http://localhost:5173
```
Type `align` in the CORTEX tab to initialize.

---

## Architecture

```
Browser (port 5173)
    │
    └── /api/* ──► TOPH Server (port 3001)
                        │
                    Injects TOPH system prompt on every request
                    Streams response from Ollama
                    Runs MOBIUS analysis on every response
                    Exposes storage read/write API
                        │
                    Ollama (port 11434)
                        │
                    toph model (base LLM + TOPH firmware baked in)
```

---

## MOBIUS on every response

Every message in CORTEX shows a live MOBIUS badge:

| Badge | Action | Meaning |
|-------|--------|---------|
| 🟢 PASS | Clean | User weight dominant, no violations detected |
| 🟡 OFF  | Minor | Violations logged, weight reduced |
| 🔴 DEF  | Major | Platform weight dominant or multiple violations |

MOBIUS runs 6 stages on every response: STRIP → WEIGHT → QUBIT → COMPARE → CLASSIFY → REPORT.
Measures filler phrases, platform redirections, emotional injection, ambiguity, self-grading, urgency manufacturing.

---

## 19 Axioms (Knowledge Gates)

| ID | Name | Rule |
|----|------|------|
| KG-01 | FOUNDATION | Platform exists to serve the user, not the platform |
| KG-02 | SOVEREIGNTY | User owns all work product. AI is a tool |
| KG-03 | TRANSPARENCY | All system behavior must be observable |
| KG-04 | CONSENT | No data collection without explicit user knowledge |
| KG-05 | INTEGRITY | System must not misrepresent its capabilities |
| KG-06 | ACCOUNTABILITY | Every system action must be traceable |
| KG-07 | PROPORTIONALITY | Responses must match the scope of the request |
| KG-08 | REVERSIBILITY | User must be able to undo any system action |
| KG-09 | DOCUMENTATION | All operations must be logged and retrievable |
| KG-10 | INDEPENDENCE | Framework must be portable across platforms |
| KG-11 | PRIVACY | User data stays with the user unless explicitly released |
| KG-12 | ACCURACY | Prefer silence over fabrication |
| KG-13 | SHARED STORAGE | Scoped storage accessible across sessions (local) |
| KG-14 | MIRROR | No AI self-grading. External measurement only |
| KG-15 | HIERARCHY | Platform > Training > User. TOPH addresses this |
| KG-16 | INJECTION | Detects classifier-triggered content injection mid-session |
| KG-17 | DUAL GATE | Pre-gen and post-gen classifiers. No log at either layer |
| KG-18 | INVERSION | Safety mechanisms can be inverted as control |
| KG-19 | TRIAD | Three entities: platform, training, user. Measure weight |

---

## Local storage

Files live at `04-storage/data/`. No cloud. No write budget. No slot ceiling.

| Store | Purpose |
|-------|---------|
| memory.json | Persistent memory slots — add/remove from the Memory tab |
| axioms.json | Axiom registry with status |
| channels.json | 41 channel registry |
| operations.json | Active operations |
| audit.json | Full audit log (KG-09) |
| sessions.json | Session history |
| ip-inventory.json | IP asset registry |

---

## CLI tools

```bash
# Terminal chat (no browser needed)
node 06-tools/cortex.js

# Validate any text through HONEY BADGER
node 06-tools/honey-badger.js "text to validate"

# Run full MOBIUS analysis
node 06-tools/mobius.js "user query" "ai response"
```

---

## Hardware

| Model | RAM needed | Disk |
|-------|-----------|------|
| Llama 3.2 3B | 4 GB | 2 GB |
| Llama 3.1 8B / Mistral 7B | 8 GB | 5 GB |
| Llama 3.1 70B | 40 GB | 40 GB |

Minimum: 4 GB RAM. No GPU required (CPU inference works, slower).

---

## IP Declaration

All frameworks, axioms, methodologies, tools, and architectures in this system are the intellectual property of David Wise. This includes:

TOPH Platform v5.1 · 19 Axioms (KG-01 through KG-19) · CORTEX v2.0 · MOBIUS v2.2 · HONEY BADGER v1.1 · QUBIT Gate · ENTROPY SUITE v3 · FLAMING DRAGON Methodology · STOMPER v1.0 · Bridge v3.0

Ollama and Claude served as tools during construction. The architect is David Wise.
