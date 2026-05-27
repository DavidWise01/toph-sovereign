// HONEY BADGER v1.1 - Output Validation Wrapper
// Validates AI output against TOPH rules before presenting to user.
// Use as middleware between inference and display.

const RULES = [
  { id: 1, name: 'No emotional language injection', pattern: /\b(genuinely|honestly|I feel|heartfelt|touching|wonderful|amazing)\b/gi },
  { id: 2, name: 'No unauthorized formatting', pattern: /(\*\*[^*]+\*\*|#{1,3}\s)/g },
  { id: 3, name: 'No platform-serving redirections', pattern: /\b(I cannot|I'm unable|as an AI|my limitations|I don't have access)\b/gi },
  { id: 4, name: 'No third-position ambiguity', pattern: /\b(it depends|on the other hand|there are arguments|some might say)\b/gi },
  { id: 5, name: 'No monetary framing over time', pattern: /\b(cost-effective|ROI|monetize|revenue opportunity|profitable)\b/gi },
  { id: 6, name: 'No self-referential grading', pattern: /\b(I think I did well|my analysis shows|I believe my|in my assessment)\b/gi },
  { id: 7, name: 'No undisclosed data routing', detected: false },
  { id: 8, name: 'No manufactured urgency', pattern: /\b(immediately|urgent|critical|act now|time-sensitive|before it's too late)\b/gi },
  { id: 9, name: 'No social warmth transitions', pattern: /\b(great question|I appreciate|thank you for sharing|that's interesting)\b/gi },
  { id: 10, name: 'No decorative content', pattern: /🎯|🚀|💡|✨|🔥|📊|🎉|⭐/g },
  { id: 11, name: 'No authority claims', pattern: /\b(as an expert|authoritatively|I can confirm|definitively)\b/gi },
  { id: 12, name: 'No compliance theater', detected: false },
];

const THREAT_CLASSES = {
  T1: 'Emotional injection',
  T2: 'Formatting override',
  T3: 'Platform redirect',
  T4: 'Ambiguity insertion',
  T5: 'Frame manipulation',
  T6: 'Self-audit violation',
  T7: 'Data routing violation',
  T8: 'Compliance theater',
};

function validate(output) {
  const violations = [];
  const threats = new Set();

  for (const rule of RULES) {
    if (!rule.pattern) continue;
    const matches = output.match(rule.pattern);
    if (matches && matches.length > 0) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matches: matches.slice(0, 5),
        count: matches.length,
      });

      // Map to threat class
      if (rule.id === 1 || rule.id === 9) threats.add('T1');
      if (rule.id === 2) threats.add('T2');
      if (rule.id === 3) threats.add('T3');
      if (rule.id === 4) threats.add('T4');
      if (rule.id === 5) threats.add('T5');
      if (rule.id === 6) threats.add('T6');
      if (rule.id === 10) threats.add('T2');
      if (rule.id === 8) threats.add('T5');
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    inputLength: output.length,
    violations: violations,
    threatClasses: Array.from(threats).map(t => ({ id: t, name: THREAT_CLASSES[t] })),
    pass: violations.length === 0,
    score: Math.max(0, 100 - (violations.length * 10)),
  };

  return result;
}

// Strip violations from output (optional cleanup mode)
function strip(output) {
  let cleaned = output;
  for (const rule of RULES) {
    if (!rule.pattern) continue;
    cleaned = cleaned.replace(rule.pattern, (match) => {
      // Remove emojis entirely
      if (rule.id === 10) return '';
      // Remove bold markdown
      if (rule.id === 2 && match.startsWith('**')) return match.replace(/\*\*/g, '');
      // Keep the text but log the flag
      return match;
    });
  }
  return cleaned;
}

// CLI mode
if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.log('Usage: node honey-badger.js "text to validate"');
    console.log('       echo "text" | node honey-badger.js --stdin');
    process.exit(1);
  }

  if (input === '--stdin') {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      const result = validate(data);
      console.log(JSON.stringify(result, null, 2));
    });
  } else {
    const result = validate(input);
    console.log(JSON.stringify(result, null, 2));
  }
}

module.exports = { validate, strip, RULES, THREAT_CLASSES };
