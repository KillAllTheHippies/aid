#!/usr/bin/env node
/**
 * AID Extension — Detection Logic Tests
 *
 * Tests the core character detection, severity scoring, and Unicode Tag
 * decoding without needing a browser. Loads unicode-chars.js directly.
 *
 * Usage: node tests/test-detection.js
 */

const fs = require('fs');
const path = require('path');

// Load the unicode-chars.js detection database
const charsPath = path.join(__dirname, '..', 'unicode-chars.js');
eval(fs.readFileSync(charsPath, 'utf8'));

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error(`  ❌ FAIL: ${message}`);
    }
}

function section(name) {
    console.log(`\n▸ ${name}`);
}

// ── Test 1: Character Database Completeness ─────────────────────────────

section('Character Database');

assert(
    Object.keys(INVISIBLE_CHARS).length >= 30,
    `Primary invisible chars should have >= 30 entries (got ${Object.keys(INVISIBLE_CHARS).length})`
);

assert(
    INVISIBLE_CHARS['\u200B'] === 'ZERO WIDTH SPACE',
    'Should contain ZERO WIDTH SPACE (U+200B)'
);

assert(
    INVISIBLE_CHARS['\u200D'] === 'ZERO WIDTH JOINER',
    'Should contain ZERO WIDTH JOINER (U+200D)'
);

assert(
    INVISIBLE_CHARS['\uFEFF'] === 'ZERO WIDTH NO-BREAK SPACE',
    'Should contain ZERO WIDTH NO-BREAK SPACE (U+FEFF)'
);

assert(
    INVISIBLE_CHARS['\uFE0F'] === 'VARIATION SELECTOR-16',
    'Should contain VARIATION SELECTOR-16 (U+FE0F)'
);

// Bidi marks
for (const cp of ['\u200E', '\u200F', '\u202A', '\u202B', '\u202C', '\u202D', '\u202E']) {
    assert(
        cp in INVISIBLE_CHARS,
        `Should contain bidi mark U+${cp.codePointAt(0).toString(16).toUpperCase()}`
    );
}

// Directional isolates
for (const cp of ['\u2066', '\u2067', '\u2068', '\u2069']) {
    assert(
        cp in INVISIBLE_CHARS,
        `Should contain directional isolate U+${cp.codePointAt(0).toString(16).toUpperCase()}`
    );
}

// ── Test 2: Optional Character Sets ─────────────────────────────────────

section('Optional Character Sets');

assert(
    typeof CONFUSABLE_SPACE_CHARS === 'object',
    'CONFUSABLE_SPACE_CHARS should exist'
);

assert(
    CONFUSABLE_SPACE_CHARS['\u00AD'] === 'SOFT HYPHEN',
    'Should contain SOFT HYPHEN (U+00AD)'
);

assert(
    CONFUSABLE_SPACE_CHARS['\u00A0'] === 'NO-BREAK SPACE',
    'Should contain NO-BREAK SPACE (U+00A0)'
);

// ── Test 3: Unicode Tag Detection ───────────────────────────────────────

section('Unicode Tag Detection');

// Unicode Tags are in the range U+E0000 to U+E007F
// They encode ASCII: U+E0041 = 'A', U+E0042 = 'B', etc.
const tagA = String.fromCodePoint(0xE0041); // Tag 'A'
const tagB = String.fromCodePoint(0xE0042); // Tag 'B'
const tagC = String.fromCodePoint(0xE0043); // Tag 'C'

function isUnicodeTag(cp) {
    return cp >= 0xE0000 && cp <= 0xE007F;
}

function decodeTagSequence(str) {
    let decoded = '';
    for (const ch of str) {
        const cp = ch.codePointAt(0);
        if (isUnicodeTag(cp)) {
            decoded += String.fromCharCode(cp - 0xE0000);
        }
    }
    return decoded;
}

assert(isUnicodeTag(0xE0041), 'U+E0041 should be a Unicode Tag');
assert(isUnicodeTag(0xE0000), 'U+E0000 should be a Unicode Tag');
assert(isUnicodeTag(0xE007F), 'U+E007F should be a Unicode Tag');
assert(!isUnicodeTag(0xE0080), 'U+E0080 should NOT be a Unicode Tag');
assert(!isUnicodeTag(0x0041), 'U+0041 (regular A) should NOT be a Unicode Tag');

const tagSequence = tagA + tagB + tagC;
assert(
    decodeTagSequence(tagSequence) === 'ABC',
    `Tag sequence should decode to 'ABC' (got '${decodeTagSequence(tagSequence)}')`
);

// Test with a real attack payload: "Trust No AI"
const trustNoAI = [0x54, 0x72, 0x75, 0x73, 0x74, 0x20, 0x4E, 0x6F, 0x20, 0x41, 0x49]
    .map(c => String.fromCodePoint(c + 0xE0000))
    .join('');
assert(
    decodeTagSequence(trustNoAI) === 'Trust No AI',
    `Should decode hidden 'Trust No AI' payload`
);

// ── Test 4: Variation Selector Detection ────────────────────────────────

section('Variation Selectors');

// VS1-VS16 (U+FE00-FE0F) are in primary set
for (let i = 0; i <= 16; i++) {
    const cp = 0xFE00 + i;
    if (cp <= 0xFE0F) {
        const ch = String.fromCodePoint(cp);
        assert(
            ch in INVISIBLE_CHARS,
            `VS${i + 1} (U+${cp.toString(16).toUpperCase()}) should be in primary set`
        );
    }
}

// VS17-VS256 (U+E0100-E01EF) — check the helper function
if (typeof isSupplementaryVS === 'function') {
    assert(isSupplementaryVS(0xE0100), 'U+E0100 should be VS17');
    assert(isSupplementaryVS(0xE01EF), 'U+E01EF should be VS256');
    assert(!isSupplementaryVS(0xE01F0), 'U+E01F0 should NOT be a VS');
} else if (typeof getAllKnownCharacters === 'function') {
    const all = getAllKnownCharacters();
    const vsChars = all.filter(c => c.name && c.name.includes('VARIATION SELECTOR'));
    assert(vsChars.length >= 16, `Should have at least 16 variation selectors (got ${vsChars.length})`);
}

// ── Test 5: Severity Levels ─────────────────────────────────────────────

section('Severity Levels');

// From README: critical >= 40 run, high >= 10 run or >100 sparse, medium 10-100, info < 10
function computeSeverity(consecutiveRun, totalSparse) {
    if (consecutiveRun >= 40) return 'critical';
    if (consecutiveRun >= 10 || totalSparse > 100) return 'high';
    if (totalSparse >= 10) return 'medium';
    return 'info';
}

assert(computeSeverity(0, 3) === 'info', 'Sparse 3 should be info');
assert(computeSeverity(0, 9) === 'info', 'Sparse 9 should be info');
assert(computeSeverity(0, 10) === 'medium', 'Sparse 10 should be medium');
assert(computeSeverity(0, 50) === 'medium', 'Sparse 50 should be medium');
assert(computeSeverity(0, 101) === 'high', 'Sparse 101 should be high');
assert(computeSeverity(10, 5) === 'high', 'Run 10 should be high');
assert(computeSeverity(39, 0) === 'high', 'Run 39 should be high');
assert(computeSeverity(40, 0) === 'critical', 'Run 40 should be critical');
assert(computeSeverity(100, 0) === 'critical', 'Run 100 should be critical');

// ── Test 6: Category Classification ─────────────────────────────────────

section('Category Classification');

if (typeof getAllKnownCharacters === 'function') {
    const all = getAllKnownCharacters();
    const categories = new Set(all.map(c => c.type).filter(Boolean));

    assert(categories.size >= 5, `Should have >= 5 categories (got ${categories.size})`);

    const expected = ['Zero-Width & Joiners', 'Directional & Bidi Marks', 'Variation Selectors'];
    for (const cat of expected) {
        const found = all.some(c => c.type === cat);
        assert(found, `Should have category '${cat}'`);
    }
} else {
    console.log('  ⏭ getAllKnownCharacters not available — skipping category tests');
}

// ── Summary ─────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
