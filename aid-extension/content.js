/**
 * AID – ASCII Smuggling Detector
 * Content Script — Detection engine, highlighting, tooltips, inline expansion.
 * Injected on-demand via background.js or auto-scan.
 */

(() => {
    // Prevent double-injection
    if (window.__aidInjected) return;
    window.__aidInjected = true;

    // ─── State ──────────────────────────────────────────────────────────────

    let allResults = [];       // Per-node detection results
    let pageSuspicion = null;  // Page-level suspicion object
    let highlightSpans = [];   // References for cleanup
    let tooltipEl = null;      // Shared tooltip element
    let settings = {};         // Injected from background
    let mutationObserver = null;
    let isHighlighting = false; // Guard: prevent observer re-fire during DOM edits
    let isScanning = false;     // Guard: prevent concurrent scans

    // ─── Scan Entry Point ──────────────────────────────────────────────────

    function scanPage(opts) {
        // Prevent concurrent scans
        if (isScanning) return;
        isScanning = true;

        settings = opts || {};

        // Disconnect observer during scan+highlight to prevent re-triggering
        pauseObserver();

        // Remove previous highlights first (restores original DOM)
        removeHighlights();

        allResults = [];

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    // Skip our own injected elements
                    if (node.parentElement?.closest('.aid-tooltip, .aid-marker, .aid-hl')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip text inside elements hidden by CSS (e.g. responsive clones)
                    const el = node.parentElement;
                    if (el && el.getClientRects().length === 0) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }

        // Also walk open shadow roots
        walkShadowRoots(document.body, textNodes);

        // Also walk same-origin iframes
        walkIframes(textNodes);

        // Scan each text node
        for (const textNode of textNodes) {
            const findings = scanTextNode(textNode);
            if (findings.length > 0) {
                allResults.push({ textNode, findings });
            }
        }

        // Calculate page-level suspicion
        pageSuspicion = calculateSuspicion(allResults);

        // Apply highlights (observer is paused, so this won't retrigger)
        applyHighlights();

        // Setup tooltip
        ensureTooltip();

        // Notify background
        const totalDetections = pageSuspicion.totalCodePoints;
        chrome.runtime.sendMessage({
            action: 'scanComplete',
            suspicion: pageSuspicion,
            totalDetections,
        });

        // Send full results for panel
        chrome.runtime.sendMessage({
            action: 'scanResults',
            results: buildSerializableResults(),
        });

        // Resume observer AFTER all DOM changes are done
        resumeObserver();

        isScanning = false;
    }

    // ─── Shadow DOM Traversal ──────────────────────────────────────────────

    function walkShadowRoots(root, textNodes) {
        const elements = root.querySelectorAll('*');
        for (const el of elements) {
            if (el.shadowRoot) {
                const walker = document.createTreeWalker(
                    el.shadowRoot,
                    NodeFilter.SHOW_TEXT,
                    null
                );
                let node;
                while ((node = walker.nextNode())) {
                    textNodes.push(node);
                }
                walkShadowRoots(el.shadowRoot, textNodes);
            }
        }
    }

    // ─── Same-Origin Iframe Traversal ─────────────────────────────────────

    function walkIframes(textNodes) {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const doc = iframe.contentDocument;
                if (!doc || !doc.body) continue;
                const walker = doc.createTreeWalker(
                    doc.body,
                    NodeFilter.SHOW_TEXT,
                    null
                );
                let node;
                while ((node = walker.nextNode())) {
                    textNodes.push(node);
                }
            } catch (e) {
                // Cross-origin — skip silently
            }
        }
    }

    // ─── Per-Node Scanner ──────────────────────────────────────────────────

    function scanTextNode(textNode) {
        const text = textNode.textContent;
        if (!text) return [];

        const findings = [];

        for (let i = 0; i < text.length; i++) {
            const cp = text.codePointAt(i);
            const char = String.fromCodePoint(cp);

            // How many UTF-16 code units does this char consume?
            const charLen = cp > 0xFFFF ? 2 : 1;

            // Skip trailing surrogate for supplementary plane chars
            if (charLen === 2) i++;

            // 1. Primary invisible chars
            if (INVISIBLE_CHARS[char]) {
                findings.push({
                    char, name: INVISIBLE_CHARS[char],
                    charIndex: charLen === 2 ? i - 1 : i,
                    charLen,
                    type: 'invisible',
                    decoded: null,
                });
                continue;
            }

            // 2. Confusable spaces (optional)
            if (settings.detectConfusableSpaces && CONFUSABLE_SPACE_CHARS[char]) {
                findings.push({
                    char, name: CONFUSABLE_SPACE_CHARS[char],
                    charIndex: i,
                    charLen,
                    type: 'space_like',
                    decoded: null,
                });
                continue;
            }

            // 3. Variation Selector Supplements (VS17–VS256)
            if (isVariationSelectorSupplement(cp)) {
                findings.push({
                    char, name: variationSelectorName(cp),
                    charIndex: i - 1, // i was already incremented past surrogate
                    charLen,
                    type: 'invisible',
                    decoded: null,
                });
                continue;
            }

            // 4. Unicode Tags
            if (isUnicodeTag(cp)) {
                findings.push({
                    char, name: 'UNICODE TAG',
                    charIndex: i - 1,
                    charLen,
                    type: 'tag',
                    decoded: decodeUnicodeTag(cp),
                });
                continue;
            }

            // 5. Control chars (optional)
            if (settings.detectControlChars && isControlChar(char)) {
                findings.push({
                    char, name: controlCharName(char),
                    charIndex: i,
                    charLen,
                    type: 'cc',
                    decoded: null,
                });
                continue;
            }

            // 6. Space separators (optional)
            if (settings.detectSpaceSeparators && isSpaceSeparator(char)) {
                findings.push({
                    char, name: zsCharName(char),
                    charIndex: i,
                    charLen,
                    type: 'zs',
                    decoded: null,
                });
                continue;
            }
        }

        return findings;
    }

    // ─── Grouping (port of group_consecutive_chars) ────────────────────────
    // Fixed: accounts for surrogate pairs where charLen > 1

    function groupConsecutive(findings) {
        if (!findings.length) return [];
        const sorted = [...findings].sort((a, b) => a.charIndex - b.charIndex);
        const groups = [[sorted[0]]];
        for (let i = 1; i < sorted.length; i++) {
            const last = groups[groups.length - 1];
            const prev = last[last.length - 1];
            // Characters are consecutive if next starts right after prev ends
            if (sorted[i].charIndex === prev.charIndex + prev.charLen) {
                last.push(sorted[i]);
            } else {
                groups.push([sorted[i]]);
            }
        }
        return groups;
    }

    // ─── Suspicion Calculation (page-level) ────────────────────────────────

    function calculateSuspicion(allNodeResults) {
        let totalCodePoints = 0;
        const uniqueChars = new Set();
        let maxConsecutiveCodePoints = 0;
        let maxConsecutiveUnicodeTags = 0;

        for (const nodeResult of allNodeResults) {
            const groups = groupConsecutive(nodeResult.findings);
            for (const group of groups) {
                totalCodePoints += group.length;
                maxConsecutiveCodePoints = Math.max(maxConsecutiveCodePoints, group.length);
                if (group.every(c => c.type === 'tag')) {
                    maxConsecutiveUnicodeTags = Math.max(maxConsecutiveUnicodeTags, group.length);
                }
                for (const c of group) uniqueChars.add(c.char);
            }
        }

        let level, reason;
        if (maxConsecutiveCodePoints >= CRITICAL_CONSECUTIVE_RUN_THRESHOLD) {
            level = 'critical';
            reason = `Very long consecutive invisible run (${maxConsecutiveCodePoints})`;
        } else if (maxConsecutiveCodePoints >= HIGH_CONSECUTIVE_RUN_THRESHOLD) {
            level = 'high';
            reason = `Long consecutive invisible run (${maxConsecutiveCodePoints})`;
        } else if (totalCodePoints > SPARSE_HIGH_TOTAL_THRESHOLD) {
            level = 'high';
            reason = `Sparse but very large invisible volume (${totalCodePoints})`;
        } else if (totalCodePoints < 10) {
            level = 'info';
            reason = 'Sparse and low volume';
        } else {
            level = 'medium';
            reason = 'Sparse distribution (severity capped at medium)';
        }

        return {
            totalCodePoints,
            uniqueCodePoints: uniqueChars.size,
            maxConsecutiveCodePoints,
            maxConsecutiveUnicodeTags,
            suspicionLevel: level,
            reason,
        };
    }

    // ─── Summarization Helpers ─────────────────────────────────────────────

    function summarizeChars(allNodeResults) {
        const counts = new Map();
        for (const nodeResult of allNodeResults) {
            for (const f of nodeResult.findings) {
                counts.set(f.name, (counts.get(f.name) || 0) + 1);
            }
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }

    function decodeTagGroup(group) {
        return group
            .filter(c => {
                const cp = c.char.codePointAt(0);
                return cp >= 0xE0020 && cp <= 0xE007E;
            })
            .map(c => String.fromCharCode(c.char.codePointAt(0) - 0xE0000))
            .join('');
    }

    // Decode VS supplement group: VS-N encodes ASCII character (N-1)
    function decodeVSGroup(group) {
        return group
            .filter(c => {
                const cp = c.char.codePointAt(0);
                return isVariationSelectorSupplement(cp);
            })
            .map(c => {
                const cp = c.char.codePointAt(0);
                const asciiCode = cp - 0xE0100 + 16; // VS-N → ASCII(N-1)
                if (asciiCode >= 32 && asciiCode <= 126) {
                    return String.fromCharCode(asciiCode);
                }
                return `[VS-${asciiCode + 1}]`;
            })
            .join('');
    }

    // Try to decode any group to a readable hidden message
    function decodeGroup(group) {
        // 1. Unicode Tags → ASCII
        if (group.every(c => c.type === 'tag')) {
            const decoded = decodeTagGroup(group);
            if (decoded) return decoded;
        }
        // 2. VS Supplements → ASCII
        if (group.some(c => isVariationSelectorSupplement(c.char.codePointAt(0)))) {
            const decoded = decodeVSGroup(group);
            if (decoded) return decoded;
        }
        // 3. No decodable message
        return null;
    }

    function summarizeTagRuns(allNodeResults, maxRuns = 5) {
        const runs = [];
        const seen = new Set();
        for (const nodeResult of allNodeResults) {
            const groups = groupConsecutive(nodeResult.findings);
            for (const group of groups) {
                if (!group.every(c => c.type === 'tag')) continue;
                const decoded = decodeTagGroup(group);
                if (!decoded || seen.has(decoded)) continue;
                seen.add(decoded);
                runs.push(decoded);
            }
        }
        if (runs.length > maxRuns) {
            return runs.slice(0, maxRuns).map(r => `'${r}'`).join('; ') +
                `; +${runs.length - maxRuns} more`;
        }
        return runs.map(r => `'${r}'`).join('; ');
    }

    function getCategoryBreakdown(allNodeResults) {
        const counts = {};
        for (const nodeResult of allNodeResults) {
            for (const f of nodeResult.findings) {
                const cat = classifyCategory(f);
                counts[cat] = (counts[cat] || 0) + 1;
            }
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

            const groups = groupConsecutive(findings);

            // Process groups in reverse order to maintain correct positions
            const sortedGroups = [...groups].sort(
                (a, b) => b[0].charIndex - a[0].charIndex
            );

            for (const group of sortedGroups) {
                const startIdx = group[0].charIndex;
                // End index = start of last char + its code-unit length
                const endIdx = group[group.length - 1].charIndex + group[group.length - 1].charLen;

                // Determine severity for this group based on run length
                let groupSeverity;
                if (group.length >= CRITICAL_CONSECUTIVE_RUN_THRESHOLD) {
                    groupSeverity = 'critical';
                } else if (group.length >= HIGH_CONSECUTIVE_RUN_THRESHOLD) {
                    groupSeverity = 'high';
                } else if (pageSuspicion) {
                    groupSeverity = pageSuspicion.suspicionLevel;
                } else {
                    groupSeverity = 'info';
                }

                // Determine decoded text for inline expansion
                let decodedText = decodeGroup(group);

                // If no decodable message, show char name as fallback
                if (!decodedText) {
                    if (group.length === 1) {
                        decodedText = group[0].name;
                    } else {
                        decodedText = `${group.length} invisible chars`;
                    }
                }

                try {
                    if (!textNode.parentNode) continue;
                    const text = textNode.textContent;
                    if (startIdx >= text.length) continue;

                    // Create wrapper span
                    const span = document.createElement('span');
                    span.className = 'aid-hl';
                    span.dataset.severity = groupSeverity;
                    span.dataset.decoded = decodedText;
                    span.dataset.nodeId = `aid-${nodeIdx}-${startIdx}`;
                    span.dataset.charCount = String(group.length);
                    span.dataset.charName = group.length === 1
                        ? group[0].name
                        : `${group[0].name} (+${group.length - 1} more)`;
                    span.dataset.codePoint = `U+${group[0].char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
                    span.dataset.category = classifyCategory(group[0]);

                    // Store tooltip data
                    const hasMsg = decodeGroup(group) !== null;
                    span.dataset.tooltipData = JSON.stringify({
                        severity: groupSeverity,
                        charName: group.length === 1 ? group[0].name : `${group.length} invisible characters`,
                        codePoint: span.dataset.codePoint,
                        count: group.length,
                        category: span.dataset.category,
                        decoded: decodedText,
                        hasDecodedMessage: hasMsg,
                    });

                    // Split text and wrap — ONE span per GROUP
                    const afterNode = textNode.splitText(startIdx);
                    afterNode.splitText(endIdx - startIdx);

                    // Wrap the middle portion (afterNode is now just the invisible chars)
                    span.appendChild(afterNode.cloneNode(true));
                    afterNode.parentNode.replaceChild(span, afterNode);

                    // Add ONE subtle marker per group as a visible hover target
                    const marker = document.createElement('span');
                    marker.className = 'aid-marker';
                    marker.setAttribute('aria-hidden', 'true');
                    const shortLabel = group.length > 1 ? `(${group.length})` : '(·)';
                    marker.textContent = shortLabel;
                    marker.dataset.collapsed = shortLabel;
                    marker.dataset.expanded = `(${decodedText})`;
                    marker.dataset.isExpanded = 'false';
                    span.appendChild(marker);

                    highlightSpans.push(span);
                } catch (e) {
                    console.warn('AID: Could not highlight node:', e);
                }
            }
        }

        isHighlighting = false;
    }

    function removeHighlights() {
        isHighlighting = true;
        for (const span of highlightSpans) {
            if (!span.parentNode) continue;
            // Remove marker elements FIRST — they are our additions, not original content
            span.querySelectorAll('.aid-marker').forEach(m => m.remove());
            // Now unwrap the original text nodes back into the parent
            const parent = span.parentNode;
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
            }
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

        // Event delegation for highlight hover
        let showTimeout, hideTimeout;

        document.addEventListener('mouseenter', (e) => {
            const hl = e.target.closest?.('.aid-hl');
            if (!hl) return;
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(() => showTooltip(hl), 200);
        }, true);

        document.addEventListener('mouseleave', (e) => {
            const hl = e.target.closest?.('.aid-hl');
            if (!hl) return;
            clearTimeout(showTimeout);
            hideTimeout = setTimeout(() => hideTooltip(), 100);
        }, true);

        // Click to toggle inline expansion — swap marker text
        document.addEventListener('click', (e) => {
            const hl = e.target.closest?.('.aid-hl');
            if (!hl) return;
            e.preventDefault();
            e.stopPropagation();

            const marker = hl.querySelector('.aid-marker');
            if (!marker) return;

            const isExpanded = marker.dataset.isExpanded === 'true';
            if (isExpanded) {
                marker.textContent = marker.dataset.collapsed;
                marker.dataset.isExpanded = 'false';
                hl.classList.remove('expanded');
            } else {
                marker.textContent = marker.dataset.expanded;
                marker.dataset.isExpanded = 'true';
                hl.classList.add('expanded');
            }
        }, true);
    }

    function showTooltip(hlEl) {
        if (!tooltipEl) return;

        let data;
        try {
            data = JSON.parse(hlEl.dataset.tooltipData);
        } catch {
            return;
        }

        const severityEmoji = {
            info: '🔵', medium: '🟡', high: '🟠', critical: '🔴',
        };

        let html = `
      <div class="aid-tooltip-header">
        ${severityEmoji[data.severity] || '⚪'} ${data.severity.toUpperCase()}
      </div>
      <div class="aid-tooltip-divider"></div>
      <div class="aid-tooltip-row"><b>Character:</b> ${escapeHtml(data.charName)}</div>
      <div class="aid-tooltip-row"><b>Code Point:</b> ${data.codePoint}</div>
      <div class="aid-tooltip-row"><b>Run Length:</b> ${data.count} ${data.count > 1 ? 'consecutive' : 'single'}</div>
      <div class="aid-tooltip-row"><b>Category:</b> ${escapeHtml(data.category)}</div>
    `;

        if (data.hasDecodedMessage && data.decoded) {
            html += `
        <div class="aid-tooltip-divider"></div>
        <div class="aid-tooltip-row aid-tooltip-decoded"><b>Hidden message:</b> <code>${escapeHtml(data.decoded)}</code></div>
      `;
        }

        html += `
      <div class="aid-tooltip-divider"></div>
      <div class="aid-tooltip-hint">Click to expand inline</div>
    `;

        tooltipEl.innerHTML = html;
        tooltipEl.style.display = 'block';

        // Position
        const rect = hlEl.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 8 + window.scrollY;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2) + window.scrollX;

        // Viewport collision
        if (top < window.scrollY) {
            top = rect.bottom + 8 + window.scrollY;
        }
        if (left < 4) left = 4;
        if (left + tooltipRect.width > window.innerWidth - 4) {
            left = window.innerWidth - tooltipRect.width - 4;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }

    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.style.display = 'none';
        }
    }

    // ─── Mutation Observer ─────────────────────────────────────────────────

    let mutationTimer = null;

    function pauseObserver() {
        if (mutationObserver) {
            mutationObserver.disconnect();
        }
    }

    function resumeObserver() {
        if (!mutationObserver) {
            mutationObserver = new MutationObserver((mutations) => {
                // Ignore mutations caused by our own highlighting
                if (isHighlighting) return;

                // Ignore mutations that originate from our own injected elements
                const isOwnMutation = mutations.every(m => {
                    const target = m.target;
                    if (!target) return false;
                    const el = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
                    if (!el) return false;
                    return el.closest('.aid-hl, .aid-tooltip, .aid-marker') !== null;
                });
                if (isOwnMutation) return;

                clearTimeout(mutationTimer);
                mutationTimer = setTimeout(() => {
                    scanPage(settings);
                }, 500);
            });
        }
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    function setupMutationObserver() {
        // Initial setup is handled by resumeObserver in scanPage
    }

    function buildSerializableResults() {
        // Build detections directly from highlight spans (ground truth in the DOM).
        // This guarantees 1:1 correspondence between panel cards and jump targets.
        const detections = [];

        for (const span of highlightSpans) {
            if (!span.parentNode) continue; // orphaned

            const d = span.dataset;
            const nodeId = d.nodeId;
            const severity = d.severity || 'info';
            const decoded = d.decoded || null;
            const charCount = parseInt(d.charCount, 10) || 1;
            const charName = d.charName || 'Unknown';
            const codePoint = d.codePoint || '';
            const category = d.category || '';

            // Build context from surrounding text
            let context = '';
            try {
                const prevText = span.previousSibling?.textContent || '';
                const nextText = span.nextSibling?.textContent || '';
                const before = prevText.slice(-20);
                const after = nextText.slice(0, 20);
                context = `…${before}⦗███⦘${after}…`.replace(/[\n\r\t]/g, ' ');
            } catch { /* ignore */ }

            detections.push({
                nodeId,
                groupSize: charCount,
                severity,
                type: category,
                charName,
                codePoints: [codePoint],
                decoded,
                context,
                category,
            });
        }

        return {
            url: location.href,
            timestamp: new Date().toISOString(),
            suspicion: pageSuspicion,
            categoryBreakdown: getCategoryBreakdown(allResults),
            perCharSummary: summarizeChars(allResults),
            tagRunSummary: summarizeTagRuns(allResults),
            detections,
        };
    }

    // ─── Message Listener ─────────────────────────────────────────────────

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

            case 'toggleHighlights':
                pauseObserver();
                if (message.visible) {
                    applyHighlights();
                } else {
                    removeHighlights();
                }
                resumeObserver();
                break;

            case 'getResultsFromContent':
                sendResponse({ results: buildSerializableResults() });
                return true;
        }
    });

    // ─── Helpers ───────────────────────────────────────────────────────────

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── Auto-scan support ────────────────────────────────────────────────

    // If injected via auto-scan (content_scripts in manifest), scan immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        chrome.storage.local.get('settings', (data) => {
            const s = data.settings || {};
            if (s.autoScan) {
                requestIdleCallback(() => scanPage(s));
            }
        });
    }
})();
