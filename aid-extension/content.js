/**
 * AID – ASCII Smuggling Detector
 * Content Script — Detection engine, highlighting, tooltips, inline expansion.
 * Injected on-demand via background.js or registered auto-scan.
 */

(() => {
    if (window.__aidInjected) return;
    window.__aidInjected = true;

    // ─── State ──────────────────────────────────────────────────────────────

    let allResults = [];    // { textNode, findings[] }[]
    let pageSuspicion = null;  // Page-level suspicion object
    let highlightSpans = [];    // Live references to injected <span.aid-hl>
    let tooltipEl = null;  // Shared tooltip element
    let settings = {};    // User settings from background
    let mutationObserver = null;
    let isHighlighting = false; // Guard: suppress observer during DOM edits
    let isScanning = false; // Guard: prevent concurrent scans

    // ─── Scan Entry Point ──────────────────────────────────────────────────

    function scanPage(opts) {
        if (isScanning) return;
        isScanning = true;
        settings = opts || {};

        pauseObserver();
        removeHighlights();
        allResults = [];

        // Collect visible text nodes
        const textNodes = collectTextNodes();

        // Scan each text node for invisible characters
        for (const tn of textNodes) {
            const findings = scanTextNode(tn);
            if (findings.length) allResults.push({ textNode: tn, findings });
        }

        pageSuspicion = calculateSuspicion(allResults);

        applyHighlights();
        ensureTooltip();

        // Notify background (badge + cached results)
        chrome.runtime.sendMessage({
            action: 'scanComplete',
            suspicion: pageSuspicion,
            totalDetections: pageSuspicion.totalCodePoints,
        });
        chrome.runtime.sendMessage({
            action: 'scanResults',
            results: buildSerializableResults(),
        });

        resumeObserver();
        isScanning = false;
    }

    // ─── Text Node Collection ─────────────────────────────────────────────

    function collectTextNodes() {
        const nodes = [];

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    const el = node.parentElement;
                    if (!el) return NodeFilter.FILTER_REJECT;
                    // Skip our own injected elements
                    if (el.closest('.aid-tooltip, .aid-marker, .aid-hl'))
                        return NodeFilter.FILTER_REJECT;
                    // Skip elements hidden by CSS (responsive clones, etc.)
                    if (el.getClientRects().length === 0)
                        return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                },
            }
        );

        let n;
        while ((n = walker.nextNode())) nodes.push(n);

        // Also walk open shadow roots and same-origin iframes
        walkShadowRoots(document.body, nodes);
        walkIframes(nodes);

        return nodes;
    }

    function walkShadowRoots(root, out) {
        for (const el of root.querySelectorAll('*')) {
            if (!el.shadowRoot) continue;
            const w = document.createTreeWalker(el.shadowRoot, NodeFilter.SHOW_TEXT, null);
            let n;
            while ((n = w.nextNode())) out.push(n);
            walkShadowRoots(el.shadowRoot, out);
        }
    }

    function walkIframes(out) {
        for (const iframe of document.querySelectorAll('iframe')) {
            try {
                const doc = iframe.contentDocument;
                if (!doc?.body) continue;
                const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
                let n;
                while ((n = w.nextNode())) out.push(n);
            } catch { /* cross-origin — skip */ }
        }
    }

    // ─── Per-Node Scanner ──────────────────────────────────────────────────

    function scanTextNode(textNode) {
        const text = textNode.textContent;
        if (!text) return [];

        const findings = [];
        const charFilters = settings.charFilters || [];
        const includeSet = new Set(charFilters.filter(f => f.type === 'include').map(f => f.id));
        const excludeSet = new Set(charFilters.filter(f => f.type === 'exclude').map(f => f.id));
        const isAllowListMode = includeSet.size > 0;

        // Helper to check if a char should be skipped based on filters
        function shouldSkip(name, codeStr) {
            if (isAllowListMode) {
                return !includeSet.has(name) && !includeSet.has(codeStr);
            }
            return excludeSet.has(name) || excludeSet.has(codeStr);
        }

        for (let i = 0; i < text.length; i++) {
            const cp = text.codePointAt(i);
            const char = String.fromCodePoint(cp);
            const charLen = cp > 0xFFFF ? 2 : 1;
            if (charLen === 2) i++; // skip trailing surrogate

            // The charIndex always points to the FIRST code unit of this character
            const charIndex = charLen === 2 ? i - 1 : i;

            // 1. Primary invisible chars
            if (INVISIBLE_CHARS[char]) {
                const name = INVISIBLE_CHARS[char];
                const codeStr = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
                if (shouldSkip(name, codeStr)) continue;
                findings.push({ char, name, charIndex, charLen, type: 'invisible', decoded: null, detail: codeStr });
                continue;
            }
            // 1.5 NO-BREAK SPACE (U+00A0) - intercepted to use its own toggle
            // In allow-list mode, we ignore the individual toggle and just check the include list
            if (char === '\u00A0') {
                const name = 'NO-BREAK SPACE';
                const codeStr = 'U+00A0';
                if (isAllowListMode) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'space_like', decoded: null, detail: codeStr });
                } else if (settings.detectNbsp) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'space_like', decoded: null, detail: codeStr });
                }
                continue;
            }
            // 2. Confusable spaces (optional)
            if (CONFUSABLE_SPACE_CHARS[char]) {
                const name = CONFUSABLE_SPACE_CHARS[char];
                const codeStr = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
                if (isAllowListMode) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'space_like', decoded: null, detail: codeStr });
                } else if (settings.detectConfusableSpaces) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'space_like', decoded: null, detail: codeStr });
                }
                continue;
            }
            // 3. Variation Selector Supplements (VS17–VS256)
            if (isVariationSelectorSupplement(cp)) {
                const name = variationSelectorName(cp);
                const codeStr = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
                if (shouldSkip(name, codeStr)) continue;
                const lowByte = cp - VS_SUPPLEMENT_START;
                const asciiStr = (lowByte >= 32 && lowByte <= 126) ? String.fromCharCode(lowByte) : `0x${lowByte.toString(16).padStart(2, '0')}`;
                findings.push({ char, name, charIndex, charLen, type: 'invisible', decoded: null, detail: `${codeStr} → ASCII: ${asciiStr}` });
                continue;
            }
            // 4. Unicode Tags (U+E0001–U+E007F)
            if (isUnicodeTag(cp)) {
                const name = 'UNICODE TAG';
                const codeStr = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
                if (shouldSkip(name, codeStr)) continue;
                const tagDecoded = decodeUnicodeTag(cp);
                findings.push({ char, name, charIndex, charLen, type: 'tag', decoded: tagDecoded, detail: `${codeStr} → ASCII: ${tagDecoded}` });
                continue;
            }
            // 5. Control chars (optional)
            if (isControlChar(char)) {
                const name = controlCharName(char);
                const codeStr = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
                if (isAllowListMode) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'cc', decoded: null, detail: codeStr });
                } else if (settings.detectControlChars) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'cc', decoded: null, detail: codeStr });
                }
                continue;
            }
            // 6. Space separators (optional)
            if (isSpaceSeparator(char)) {
                const name = zsCharName(char);
                const codeStr = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
                if (isAllowListMode) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'zs', decoded: null, detail: codeStr });
                } else if (settings.detectSpaceSeparators) {
                    if (!shouldSkip(name, codeStr)) findings.push({ char, name, charIndex, charLen, type: 'zs', decoded: null, detail: codeStr });
                }
            }
        }

        return findings;
    }

    // ─── Grouping ──────────────────────────────────────────────────────────
    // Groups consecutive findings, accounting for surrogate pairs (charLen > 1).

    function groupConsecutive(findings) {
        if (!findings.length) return [];
        const sorted = [...findings].sort((a, b) => a.charIndex - b.charIndex);
        const groups = [[sorted[0]]];

        for (let i = 1; i < sorted.length; i++) {
            const prev = groups.at(-1).at(-1);
            if (sorted[i].charIndex === prev.charIndex + prev.charLen) {
                groups.at(-1).push(sorted[i]);
            } else {
                groups.push([sorted[i]]);
            }
        }
        return groups;
    }

    // ─── Suspicion Calculation ─────────────────────────────────────────────

    function calculateSuspicion(results) {
        let totalCodePoints = 0;
        const uniqueChars = new Set();
        let maxRun = 0;
        let maxTagRun = 0;

        for (const { findings } of results) {
            for (const group of groupConsecutive(findings)) {
                totalCodePoints += group.length;
                maxRun = Math.max(maxRun, group.length);
                if (group.every(c => c.type === 'tag'))
                    maxTagRun = Math.max(maxTagRun, group.length);
                for (const c of group) uniqueChars.add(c.char);
            }
        }

        let level, reason;
        if (maxRun >= CRITICAL_CONSECUTIVE_RUN_THRESHOLD) { level = 'critical'; reason = `Very long consecutive run (${maxRun})`; }
        else if (maxRun >= HIGH_CONSECUTIVE_RUN_THRESHOLD) { level = 'high'; reason = `Long consecutive run (${maxRun})`; }
        else if (totalCodePoints > SPARSE_HIGH_TOTAL_THRESHOLD) { level = 'high'; reason = `Large invisible volume (${totalCodePoints})`; }
        else if (totalCodePoints < 10) { level = 'info'; reason = 'Sparse and low volume'; }
        else { level = 'medium'; reason = 'Sparse distribution'; }

        return {
            totalCodePoints, uniqueCodePoints: uniqueChars.size,
            maxConsecutiveCodePoints: maxRun, maxConsecutiveUnicodeTags: maxTagRun,
            suspicionLevel: level, reason,
        };
    }

    // ─── Decoding ──────────────────────────────────────────────────────────

    /** Decode Unicode Tag group → ASCII string. */
    function decodeTagGroup(group) {
        return group
            .filter(c => { const p = c.char.codePointAt(0); return p >= 0xE0020 && p <= 0xE007E; })
            .map(c => String.fromCharCode(c.char.codePointAt(0) - 0xE0000))
            .join('');
    }

    /** Decode VS supplement group → ASCII string.  VS-N encodes ASCII char (N-1). */
    function decodeVSGroup(group) {
        return group
            .filter(c => isVariationSelectorSupplement(c.char.codePointAt(0)))
            .map(c => {
                const ascii = c.char.codePointAt(0) - 0xE0100 + 16;
                return (ascii >= 32 && ascii <= 126) ? String.fromCharCode(ascii) : `[VS-${ascii + 1}]`;
            })
            .join('');
    }

    /** Try all known decodings; return decoded string or null. */
    function decodeGroup(group) {
        if (group.every(c => c.type === 'tag')) {
            const d = decodeTagGroup(group);
            if (d) return d;
        }
        if (group.some(c => isVariationSelectorSupplement(c.char.codePointAt(0)))) {
            const d = decodeVSGroup(group);
            if (d) return d;
        }
        return null;
    }

    // ─── Summarization Helpers ─────────────────────────────────────────────


    function summarizeTagRuns(results, max = 5) {
        const runs = [], seen = new Set();
        for (const { findings } of results) {
            for (const g of groupConsecutive(findings)) {
                if (!g.every(c => c.type === 'tag')) continue;
                const d = decodeTagGroup(g);
                if (!d || seen.has(d)) continue;
                seen.add(d);
                runs.push(d);
            }
        }
        return runs.length > max
            ? runs.slice(0, max).map(r => `'${r}'`).join('; ') + `; +${runs.length - max} more`
            : runs.map(r => `'${r}'`).join('; ');
    }

    function getCategoryBreakdown(results) {
        const counts = {};
        for (const { findings } of results)
            for (const f of findings) {
                const cat = classifyCategory(f);
                counts[cat] = (counts[cat] || 0) + 1;
            }
        return counts;
    }

    // ─── Highlighting ──────────────────────────────────────────────────────

    function applyHighlights() {
        isHighlighting = true;
        removeHighlights();

        for (let nodeIdx = 0; nodeIdx < allResults.length; nodeIdx++) {
            const { textNode, findings } = allResults[nodeIdx];
            if (!textNode.parentNode) continue;

            // Skip DOM modification inside managed editors (CodeMirror, Monaco, etc.)
            // Detections are still reported to the side panel.
            const parentEl = textNode.parentElement;
            if (parentEl && (parentEl.isContentEditable || parentEl.closest('[contenteditable="true"], textarea, input, [role="textbox"], .cm-content, .CodeMirror, .monaco-editor')))
                continue;

            // Process groups right-to-left so splitText offsets stay valid
            const groups = groupConsecutive(findings)
                .filter(g => {
                    const minLen = settings.minSeqLength ?? 1;
                    const maxLen = settings.maxSeqLength ?? 0;
                    if (g.length < minLen) return false;
                    if (maxLen > 0 && g.length > maxLen) return false;
                    return true;
                })
                .sort((a, b) => b[0].charIndex - a[0].charIndex);

            for (const group of groups) {
                const startIdx = group[0].charIndex;
                const endIdx = group.at(-1).charIndex + group.at(-1).charLen;
                const decoded = decodeGroup(group);
                const decodedText = decoded || (group.length === 1 ? group[0].name : `${group.length} invisible chars`);

                // Group severity
                let severity;
                if (group.length >= CRITICAL_CONSECUTIVE_RUN_THRESHOLD) severity = 'critical';
                else if (group.length >= HIGH_CONSECUTIVE_RUN_THRESHOLD) severity = 'high';
                else severity = pageSuspicion?.suspicionLevel || 'info';

                try {
                    if (!textNode.parentNode) continue;
                    if (startIdx >= textNode.textContent.length) continue;

                    // Build highlight wrapper
                    const span = document.createElement('span');
                    span.className = 'aid-hl';
                    span.dataset.severity = severity;
                    span.dataset.decoded = decodedText;
                    span.dataset.nodeId = `aid-${nodeIdx}-${startIdx}`;
                    span.dataset.charCount = String(group.length);
                    span.dataset.charName = group.length === 1
                        ? group[0].name
                        : `${group[0].name} (+${group.length - 1} more)`;
                    span.dataset.codePoint = `U+${group[0].char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
                    span.dataset.detail = group.length === 1
                        ? (group[0].detail || '')
                        : '';
                    span.dataset.category = classifyCategory(group[0]);
                    span.dataset.tooltipData = JSON.stringify({
                        severity,
                        charName: group.length === 1 ? group[0].name : `${group.length} invisible characters`,
                        codePoint: span.dataset.codePoint,
                        detail: span.dataset.detail,
                        count: group.length,
                        category: span.dataset.category,
                        decoded: decodedText,
                        hasDecodedMessage: decoded !== null,
                    });

                    // Split text and wrap — one <span> per consecutive group
                    const afterNode = textNode.splitText(startIdx);
                    afterNode.splitText(endIdx - startIdx);
                    span.appendChild(afterNode.cloneNode(true));
                    afterNode.parentNode.replaceChild(span, afterNode);

                    // Visible marker (hover target + click-to-expand)
                    const marker = document.createElement('span');
                    marker.className = 'aid-marker';
                    marker.setAttribute('aria-hidden', 'true');
                    const label = group.length > 1 ? `(${group.length})` : '(·)';
                    marker.textContent = label;
                    marker.dataset.collapsed = label;
                    marker.dataset.expanded = `(${decodedText})`;
                    marker.dataset.isExpanded = 'false';
                    span.appendChild(marker);

                    highlightSpans.push(span);
                } catch (e) {
                    console.warn('AID: highlight failed:', e);
                }
            }
        }

        isHighlighting = false;
    }

    function removeHighlights() {
        isHighlighting = true;
        for (const span of highlightSpans) {
            if (!span.parentNode) continue;
            // Delete our marker elements first
            span.querySelectorAll('.aid-marker').forEach(m => m.remove());
            // Unwrap original text back into the parent
            const parent = span.parentNode;
            while (span.firstChild) parent.insertBefore(span.firstChild, span);
            parent.removeChild(span);
            parent.normalize();
        }
        highlightSpans = [];
        isHighlighting = false;
    }

    // ─── Tooltip System ────────────────────────────────────────────────────

    function ensureTooltip() {
        if (tooltipEl) return;

        tooltipEl = document.createElement('div');
        tooltipEl.className = 'aid-tooltip';
        tooltipEl.style.display = 'none';
        document.body.appendChild(tooltipEl);

        let showTimer, hideTimer;

        // Hover → show tooltip
        document.addEventListener('mouseenter', e => {
            const hl = e.target.closest?.('.aid-hl');
            if (!hl) return;
            clearTimeout(hideTimer);
            showTimer = setTimeout(() => showTooltip(hl), 200);
        }, true);

        document.addEventListener('mouseleave', e => {
            const hl = e.target.closest?.('.aid-hl');
            if (!hl) return;
            clearTimeout(showTimer);
            hideTimer = setTimeout(hideTooltip, 100);
        }, true);

        // Click → toggle inline expansion (swap marker text)
        document.addEventListener('click', e => {
            const hl = e.target.closest?.('.aid-hl');
            if (!hl) return;
            e.preventDefault();
            e.stopPropagation();
            const marker = hl.querySelector('.aid-marker');
            if (!marker) return;
            const expanded = marker.dataset.isExpanded === 'true';
            marker.textContent = expanded ? marker.dataset.collapsed : marker.dataset.expanded;
            marker.dataset.isExpanded = String(!expanded);
            hl.classList.toggle('expanded', !expanded);
        }, true);
    }

    function showTooltip(hlEl) {
        if (!tooltipEl) return;
        let data;
        try { data = JSON.parse(hlEl.dataset.tooltipData); } catch { return; }

        const emoji = { info: '🔵', medium: '🟡', high: '🟠', critical: '🔴' };

        let html = `
            <div class="aid-tooltip-header">${emoji[data.severity] || '⚪'} ${data.severity.toUpperCase()}</div>
            <div class="aid-tooltip-divider"></div>
            <div class="aid-tooltip-row"><b>Character:</b> ${esc(data.charName)}</div>
            <div class="aid-tooltip-row"><b>Code Point:</b> ${data.codePoint}</div>${data.detail && data.detail !== data.codePoint ? `
            <div class="aid-tooltip-row" style="color:#aaa;font-size:11px;">${esc(data.detail)}</div>` : ''}
            <div class="aid-tooltip-row"><b>Run Length:</b> ${data.count} ${data.count > 1 ? 'consecutive' : 'single'}</div>
            <div class="aid-tooltip-row"><b>Category:</b> ${esc(data.category)}</div>`;

        if (data.hasDecodedMessage && data.decoded)
            html += `
            <div class="aid-tooltip-divider"></div>
            <div class="aid-tooltip-row aid-tooltip-decoded"><b>Hidden message:</b> <code>${esc(data.decoded)}</code></div>`;

        html += `
            <div class="aid-tooltip-divider"></div>
            <div class="aid-tooltip-hint">Click to expand inline</div>`;

        tooltipEl.innerHTML = html;
        tooltipEl.style.display = 'block';

        // Position above element, flip below if clipped
        const rect = hlEl.getBoundingClientRect();
        const tr = tooltipEl.getBoundingClientRect();
        let top = rect.top - tr.height - 8 + scrollY;
        let left = rect.left + rect.width / 2 - tr.width / 2 + scrollX;
        if (top < scrollY) top = rect.bottom + 8 + scrollY;
        left = Math.max(4, Math.min(left, innerWidth - tr.width - 4));
        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }

    function hideTooltip() {
        if (tooltipEl) tooltipEl.style.display = 'none';
    }

    // ─── Mutation Observer ─────────────────────────────────────────────────

    let mutationTimer = null;

    function pauseObserver() {
        mutationObserver?.disconnect();
    }

    function resumeObserver() {
        if (!mutationObserver) {
            mutationObserver = new MutationObserver(mutations => {
                if (isHighlighting) return;
                // Ignore mutations from our own elements
                if (mutations.every(m => {
                    const el = m.target.nodeType === Node.ELEMENT_NODE ? m.target : m.target.parentElement;
                    return el?.closest('.aid-hl, .aid-tooltip, .aid-marker');
                })) return;
                clearTimeout(mutationTimer);
                mutationTimer = setTimeout(() => scanPage(settings), 500);
            });
        }
        mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    // ─── Serializable Results (for panel) ──────────────────────────────────
    // Built from live DOM highlight spans to guarantee 1:1 with jump targets.

    function buildSerializableResults() {
        const detections = [];

        for (const span of highlightSpans) {
            if (!span.parentNode) continue;
            const d = span.dataset;

            let context = '';
            try {
                const before = (span.previousSibling?.textContent || '').slice(-20);
                const after = (span.nextSibling?.textContent || '').slice(0, 20);
                context = `…${before}⦗███⦘${after}…`.replace(/[\n\r\t]/g, ' ');
            } catch { /* ignore */ }

            detections.push({
                nodeId: d.nodeId,
                groupSize: parseInt(d.charCount, 10) || 1,
                severity: d.severity || 'info',
                type: d.category || '',
                charName: d.charName || 'Unknown',
                codePoints: [d.codePoint || ''],
                detail: d.detail || '',
                decoded: d.decoded || null,
                context,
                category: d.category || '',
            });
        }

        // Second pass: add detections from editable regions (not highlighted)
        const highlightedNodeIds = new Set(detections.map(d => d.nodeId));
        for (let nodeIdx = 0; nodeIdx < allResults.length; nodeIdx++) {
            const { textNode, findings } = allResults[nodeIdx];
            if (!textNode.parentElement) continue;
            const p = textNode.parentElement;
            if (!(p.isContentEditable || p.closest('[contenteditable="true"], textarea, input, [role="textbox"], .cm-content, .CodeMirror, .monaco-editor')))
                continue;

            const groups = groupConsecutive(findings).filter(g => {
                const minLen = settings.minSeqLength ?? 1;
                const maxLen = settings.maxSeqLength ?? 0;
                if (g.length < minLen) return false;
                if (maxLen > 0 && g.length > maxLen) return false;
                return true;
            });
            for (const group of groups) {
                const startIdx = group[0].charIndex;
                const nodeId = `aid-${nodeIdx}-${startIdx}`;
                if (highlightedNodeIds.has(nodeId)) continue;

                const decoded = decodeGroup(group);
                const decodedText = decoded || (group.length === 1 ? group[0].name : `${group.length} invisible chars`);
                let severity;
                if (group.length >= CRITICAL_CONSECUTIVE_RUN_THRESHOLD) severity = 'critical';
                else if (group.length >= HIGH_CONSECUTIVE_RUN_THRESHOLD) severity = 'high';
                else severity = pageSuspicion?.suspicionLevel || 'info';

                let context = '';
                try {
                    const txt = textNode.textContent;
                    const before = txt.slice(Math.max(0, startIdx - 20), startIdx);
                    const after = txt.slice(startIdx + group.length, startIdx + group.length + 20);
                    context = `…${before}⦗███⦘${after}…`.replace(/[\n\r\t]/g, ' ');
                } catch { /* ignore */ }

                detections.push({
                    nodeId,
                    groupSize: group.length,
                    severity,
                    type: classifyCategory(group[0]),
                    charName: group.length === 1 ? group[0].name : `${group[0].name} (+${group.length - 1} more)`,
                    codePoints: [`U+${group[0].char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`],
                    detail: group.length === 1
                        ? (group[0].detail || '')
                        : '',
                    decoded: decodedText,
                    context,
                    category: classifyCategory(group[0]),
                });
            }
        }

        return {
            url: location.href,
            timestamp: new Date().toISOString(),
            suspicion: pageSuspicion,
            categoryBreakdown: getCategoryBreakdown(allResults),
            tagRunSummary: summarizeTagRuns(allResults),
            detections,
        };
    }

    // ─── Message Listener ─────────────────────────────────────────────────

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        switch (message.action) {
            case 'scan':
                requestIdleCallback(() => scanPage(message.settings));
                break;

            case 'scrollToDetection': {
                const el = document.querySelector(`[data-node-id="${message.nodeId}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('pulse');
                    el.addEventListener('animationend', () => el.classList.remove('pulse'), { once: true });
                }
                break;
            }
        }
    });

    // ─── Helpers ───────────────────────────────────────────────────────────

    function esc(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // ─── Auto-scan ────────────────────────────────────────────────────────

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        chrome.storage.local.get('settings', data => {
            if (data.settings?.autoScan) requestIdleCallback(() => scanPage(data.settings));
        });
    }
})();
