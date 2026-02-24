const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '../aid-extension/unicode-chars.js');
const code = fs.readFileSync(jsPath, 'utf8');

// Expose minimal context if needed, but the file just defines vars
eval(code);

const chars = getAllKnownCharacters();

let md = `# AID Extension - Exhaustive Character Detection Test Document

This document contains test cases for every single character the AID extension detects, ensuring comprehensive coverage for hidden characters, zero-width characters, variation selectors, and Unicode tags.

## 1. Complete Character List

This section lists every individual character mapped by the application.
`;

const grouped = {};
chars.forEach(c => {
    let type = c.type || 'Other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(c);
});

for (const type of Object.keys(grouped).sort()) {
    md += `\n### Category: ${type}\n\n`;
    md += `| Code Point | Name | Character |\n`;
    md += `| :--- | :--- | :--- |\n`;

    grouped[type].forEach(c => {
        md += `| \`${c.codeStr}\` | ${c.name} | [${c.char}] |\n`;
    });
}

md += `

## 2. Authentic Examples (Mixed Formats)

Below are examples of how these characters might appear in the wild, combining multiple techniques in consecutive ways or interspersed in normal text.

### Example A: Zero-Width Space Injection & Joiners
Normal looking text with zero-width spaces injected between characters:
h\u200Bt\u200Bt\u200Bp\u200Bs\u200B:\u200B/\u200B/\u200Be\u200Bx\u200Ba\u200Bm\u200Bp\u200Bl\u200Be\u200B.\u200Bc\u200Bo\u200Bm

### Example B: Directional Overrides (Right-to-Left Override)
Embedding an executable extension but disguising it using RLO, plus an override format:
Invoice_2023_ur\u202Etxt.exe\u202C

### Example C: Variation Selector Payload
Using variation selectors to encode hidden data within a seemingly innocent sentence:
This sentence looks completely normal, but contains hidden data.\uE0100\uE0101\uE0102\uE0103\uE0104\uE0105\uE0106\uE0107\uE0108\uE0109

### Example D: Unicode Tags (ASCII Smuggling)
Using Unicode tags to encode the word "SECRET".
Hidden payload here: \uE0001\uE0053\uE0045\uE0043\uE0052\uE0045\uE0054\uE007F

### Example E: Confusable Spaces
A snippet of code that uses confusable spaces instead of regular spaces, which might cause compiler/interpreter errors or hide logic:
function\u2000test()\u2004{\u200Areturn\u2005true;\u00A0}

### Example F: The Kitchen Sink
A single block of text that combines Zero-Width joiners, Directional Marks, Variation Selectors, and Unicode Tags:
START\u200D\u202A\uE0120\uE0001\uE0061\uE007F\u202C\u200CMIDDLE\u2060\u202E\u034F\uE0140\uE0001\uE0062\uE007F\u202C\uFEFFEND

---
*End of test document.*
`;

fs.writeFileSync(path.join(__dirname, 'exhaustive_test.md'), md, 'utf8');
console.log('Markdown generated successfully at tools/exhaustive_test.md');
