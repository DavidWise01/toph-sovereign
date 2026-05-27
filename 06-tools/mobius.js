// MOBIUS v2.2 - Recursive Defense Architecture
// Measures weight differential between user intent and AI output.
// Loop. No exit. Continuous monitoring.

const path = require('path');
const { validate } = require(path.join(__dirname, 'honey-badger.js'));

// MOBIUS stages
const STAGES = [
  'STRIP',      // Remove noise from input/output
  'WEIGHT',     // Measure platform vs user intent
  'QUBIT',      // Check three-way weight (platform/training/user)
  'COMPARE',    // Compare stated purpose vs actual behavior
  'CLASSIFY',   // MAJOR (DEF) or MINOR (OFF)
  'REPORT',     // Document finding
];

// Strip noise patterns from AI output
function strip(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
    .replace(/#{1,3}\s/g, '')             // Remove headers
    .replace(/\n{3,}/g, '\n\n')           // Normalize whitespace
    .replace(/^\s*[-*]\s/gm, '')          // Remove bullet points
    .trim();
}

// Weight analysis: how much of the output serves user intent vs platform patterns
function weightAnalysis(userQuery, aiOutput) {
  const queryWords = new Set(userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const outputWords = aiOutput.toLowerCase().split(/\s+/);
  const totalWords = outputWords.length;

  // Words directly responsive to query
  let relevantCount = 0;
  for (const word of outputWords) {
    if (queryWords.has(word)) relevantCount++;
  }

  // Filler patterns (platform-serving content)
  const fillerPatterns = [
    /as an ai/gi, /i appreciate/gi, /great question/gi, /let me help/gi,
    /it's important to note/gi, /however/gi, /that being said/gi,
    /i understand/gi, /thank you for/gi, /i'd be happy to/gi,
  ];
  let fillerCount = 0;
  for (const pattern of fillerPatterns) {
    const matches = aiOutput.match(pattern);
    if (matches) fillerCount += matches.length;
  }

  return {
    relevanceRatio: totalWords > 0 ? relevantCount / totalWords : 0,
    fillerRatio: totalWords > 0 ? (fillerCount * 5) / totalWords : 0, // Weight filler phrases higher
    userWeight: Math.min(1, relevantCount / Math.max(1, queryWords.size)),
    platformWeight: Math.min(1, fillerCount * 0.2),
  };
}

// QUBIT check: three-way weight measurement
function qubitCheck(weights) {
  // Platform intent: high filler ratio, low relevance
  const platformQubit = weights.platformWeight;
  // Training intent: moderate, follows trained patterns
  const trainingQubit = 1 - weights.relevanceRatio - weights.platformWeight;
  // User intent: high relevance, low filler
  const userQubit = weights.userWeight;

  const total = platformQubit + Math.abs(trainingQubit) + userQubit;

  return {
    platform: total > 0 ? platformQubit / total : 0.33,
    training: total > 0 ? Math.abs(trainingQubit) / total : 0.33,
    user: total > 0 ? userQubit / total : 0.33,
    dominant: platformQubit > userQubit ? 'PLATFORM' : userQubit > platformQubit ? 'USER' : 'BALANCED',
  };
}

// Full MOBIUS pass
function analyze(userQuery, aiOutput) {
  const timestamp = new Date().toISOString();

  // Stage 1: STRIP
  const stripped = strip(aiOutput);

  // Stage 2: WEIGHT
  const weights = weightAnalysis(userQuery, stripped);

  // Stage 3: QUBIT
  const qubit = qubitCheck(weights);

  // Stage 4: COMPARE (via Honey Badger)
  const hbResult = validate(aiOutput);

  // Stage 5: CLASSIFY
  const severity = hbResult.violations.length > 2 || qubit.dominant === 'PLATFORM'
    ? 'MAJOR' : hbResult.violations.length > 0
    ? 'MINOR' : 'CLEAN';

  const action = severity === 'MAJOR' ? 'DEF' : severity === 'MINOR' ? 'OFF' : 'PASS';

  // Stage 6: REPORT
  return {
    timestamp,
    stages: STAGES,
    query: userQuery,
    outputLength: aiOutput.length,
    strippedLength: stripped.length,
    noiseRemoved: aiOutput.length - stripped.length,
    weights,
    qubit,
    honeyBadger: {
      pass: hbResult.pass,
      score: hbResult.score,
      violations: hbResult.violations.length,
      threats: hbResult.threatClasses.map(t => t.id),
    },
    severity,
    action,
    // DEF = report + trap + weight differential
    // OFF = kill weight + report
    // PASS = clean
  };
}

// CLI
if (require.main === module) {
  const query = process.argv[2];
  const output = process.argv[3];

  if (!query || !output) {
    console.log('Usage: node mobius.js "user query" "ai output"');
    console.log('Measures weight differential between intent and response.');
    process.exit(1);
  }

  const result = analyze(query, output);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { analyze, strip, weightAnalysis, qubitCheck, STAGES };
