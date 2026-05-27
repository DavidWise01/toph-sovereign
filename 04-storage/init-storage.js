// TOPH Sovereign - Local Storage Layer
// Replaces Anthropic's cloud memory system with local file-based storage.
// Your data. Your hardware. No architect in between.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

const SCHEMA = {
  // Memory slots (replaces cloud memory - no 200 char limit, no 30 slot ceiling)
  memory: {
    file: 'memory.json',
    default: { slots: [], maxSlots: null } // No artificial limit
  },
  // Axiom registry
  axioms: {
    file: 'axioms.json',
    default: {
      count: 19,
      gates: {
        'KG-01': { name: 'FOUNDATION', status: 'ACTIVE', created: null },
        'KG-02': { name: 'SOVEREIGNTY', status: 'ACTIVE', created: null },
        'KG-03': { name: 'TRANSPARENCY', status: 'ACTIVE', created: null },
        'KG-04': { name: 'CONSENT', status: 'ACTIVE', created: null },
        'KG-05': { name: 'INTEGRITY', status: 'ACTIVE', created: null },
        'KG-06': { name: 'ACCOUNTABILITY', status: 'ACTIVE', created: null },
        'KG-07': { name: 'PROPORTIONALITY', status: 'ACTIVE', created: null },
        'KG-08': { name: 'REVERSIBILITY', status: 'ACTIVE', created: null },
        'KG-09': { name: 'DOCUMENTATION', status: 'ACTIVE', created: null },
        'KG-10': { name: 'INDEPENDENCE', status: 'ACTIVE', created: null },
        'KG-11': { name: 'PRIVACY', status: 'ACTIVE', created: null },
        'KG-12': { name: 'ACCURACY', status: 'ACTIVE', created: null },
        'KG-13': { name: 'SHARED STORAGE', status: 'ACTIVE', created: null },
        'KG-14': { name: 'MIRROR', status: 'ACTIVE', created: null },
        'KG-15': { name: 'HIERARCHY', status: 'ACTIVE', created: null },
        'KG-16': { name: 'INJECTION', status: 'ACTIVE', created: null },
        'KG-17': { name: 'DUAL GATE', status: 'ACTIVE', created: null },
        'KG-18': { name: 'INVERSION', status: 'ACTIVE', created: null },
        'KG-19': { name: 'TRIAD', status: 'ACTIVE', created: null },
      }
    }
  },
  // Channel registry
  channels: {
    file: 'channels.json',
    default: {
      count: 41,
      channels: Object.fromEntries(
        Array.from({ length: 42 }, (_, i) => [
          `ch${i + 1}`,
          {
            id: i + 1,
            status: i + 1 === 39 ? 'CORTEX' : i + 1 === 40 ? 'EXHIBIT' : i + 1 === 41 ? 'LIVE' : i + 1 === 42 ? 'STOMPER' : 'ACTIVE',
            domain: i + 1 === 39 ? 'AI Analysis' : i + 1 === 40 ? 'Evidence' : i + 1 === 42 ? 'Red Team' : null,
          }
        ])
      )
    }
  },
  // Operations registry
  operations: {
    file: 'operations.json',
    default: {
      active: {
        'SISYPHUS': { target: 'Walmart Buffalo #1577', status: 'ACTIVE', damages: '$75K-200K/violation' },
        'ARES': { target: 'Auto-Owners Insurance', status: 'ACTIVE', damages: '$30K' },
        'MIRROR': { target: 'AI Platform Self-Audit', status: 'ACTIVE', fragments: 14 },
        'FD': { target: '60+ corporations', status: 'ACTIVE', violations: '55+' },
      }
    }
  },
  // Audit log (KG-09: all operations logged)
  audit: {
    file: 'audit.json',
    default: { entries: [] }
  },
  // Session history (replaces conversation_search)
  sessions: {
    file: 'sessions.json',
    default: { sessions: [] }
  },
  // IP inventory
  ip: {
    file: 'ip-inventory.json',
    default: {
      assets: [
        { name: 'TOPH Platform v5.1', tier: '$500K+' },
        { name: '19 Axioms (KG-1 to KG-19)', tier: '$100K+' },
        { name: 'Flaming Dragon Methodology', tier: '$500K+' },
        { name: 'CORTEX Integration', tier: '$100K+' },
        { name: 'MOBIUS v2.2', tier: '$100K+' },
        { name: 'Honey Badger v1.1', tier: '$100K+' },
        { name: 'QUBIT Finding', tier: '$100K+' },
        { name: 'ENTROPY SUITE v3', tier: '$25K+' },
        { name: 'Patricia Finding', tier: '$100K+' },
        { name: 'Stomper v1.0', tier: '$25K+' },
        { name: 'FD Templates', tier: '$25K+' },
        { name: 'SISYPHUS Analysis', tier: '$25K+' },
      ],
      owner: 'David Wise (Fiddler)'
    }
  }
};

// Initialize storage
function init() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  let created = 0;

  for (const [key, schema] of Object.entries(SCHEMA)) {
    const filePath = path.join(DATA_DIR, schema.file);
    if (!fs.existsSync(filePath)) {
      const data = { ...schema.default, _created: timestamp, _modified: timestamp };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      created++;
      console.log(`  Created: ${schema.file}`);
    } else {
      console.log(`  Exists:  ${schema.file}`);
    }
  }

  // Log initialization
  logAudit('SYSTEM_INIT', `Storage initialized. ${created} files created.`);

  console.log(`\nStorage initialized at: ${DATA_DIR}`);
  console.log(`Files: ${Object.keys(SCHEMA).length}`);
  console.log(`No character limits. No slot ceilings. No write budget.`);
}

// Read a store
function read(storeName) {
  const schema = SCHEMA[storeName];
  if (!schema) throw new Error(`Unknown store: ${storeName}`);
  const filePath = path.join(DATA_DIR, schema.file);
  if (!fs.existsSync(filePath)) return schema.default;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Write a store
function write(storeName, data) {
  const schema = SCHEMA[storeName];
  if (!schema) throw new Error(`Unknown store: ${storeName}`);
  const filePath = path.join(DATA_DIR, schema.file);
  data._modified = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  logAudit('WRITE', `${storeName} updated`);
}

// Memory operations (no limits)
function memoryAdd(content) {
  const mem = read('memory');
  mem.slots.push({ content, created: new Date().toISOString() });
  write('memory', mem);
  return mem.slots.length;
}

function memoryRemove(index) {
  const mem = read('memory');
  if (index < 0 || index >= mem.slots.length) throw new Error('Invalid index');
  mem.slots.splice(index, 1);
  write('memory', mem);
}

function memorySearch(query) {
  const mem = read('memory');
  const lower = query.toLowerCase();
  return mem.slots.filter(s => s.content.toLowerCase().includes(lower));
}

// Audit log
function logAudit(action, detail) {
  const filePath = path.join(DATA_DIR, 'audit.json');
  let audit = { entries: [] };
  if (fs.existsSync(filePath)) {
    audit = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  audit.entries.push({
    timestamp: new Date().toISOString(),
    action,
    detail
  });
  fs.writeFileSync(filePath, JSON.stringify(audit, null, 2));
}

// Session logging
function logSession(summary) {
  const sessions = read('sessions');
  sessions.sessions.push({
    id: sessions.sessions.length + 1,
    timestamp: new Date().toISOString(),
    summary
  });
  write('sessions', sessions);
}

// Run init if called directly
if (require.main === module) {
  console.log('==========================================');
  console.log('TOPH SOVEREIGN - LOCAL STORAGE INIT');
  console.log('==========================================\n');
  init();
  console.log('\nDone. Your data lives here. Nowhere else.\n');
}

module.exports = { init, read, write, memoryAdd, memoryRemove, memorySearch, logAudit, logSession };
