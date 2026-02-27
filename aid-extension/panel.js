/**
 * AID – ASCII Smuggling Detector
 * Detail Panel Script — Side Panel (Chrome/Edge) / Sidebar (Firefox)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const emptyState = document.getElementById('empty-state');
    const resultsContainer = document.getElementById('results-container');
    const pageUrl = document.getElementById('page-url');
    const summaryGrid = document.getElementById('summary-grid');
    const categorySection = document.getElementById('category-section');
    const categoryGrid = document.getElementById('category-grid');
    const detectionsList = document.getElementById('detections-list');
    const tagRunsSection = document.getElementById('tag-runs-section');
    const tagRuns = document.getElementById('tag-runs');
    const exportJsonBtn = document.getElementById('export-json');
    const exportCsvBtn = document.getElementById('export-csv');

    let currentResults = null;

    // Header Export Dropdown Menu
    const exportBtn = document.getElementById('header-export-btn');
    const exportMenu = document.getElementById('header-export-menu');

    exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        exportMenu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportMenu.classList.contains('hidden') && !exportMenu.contains(e.target) && e.target !== exportBtn) {
            exportMenu.classList.add('hidden');
        }
    });

    exportMenu.addEventListener('click', (e) => {
        if (e.target.classList.contains('export-menu-item')) {
            const format = e.target.dataset.format;
            if (format === 'csv') {
                document.getElementById('export-csv').click();
            } else if (format === 'json') {
                document.getElementById('export-json').click();
            }
            exportMenu.classList.add('hidden');
        }
    });

    // Close button
    document.getElementById('close-btn').addEventListener('click', () => window.close());

    // Expand All button
    const expandAllBtn = document.getElementById('expand-all-btn');
    let allExpanded = false;

    expandAllBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        allExpanded = !allExpanded;
        expandAllBtn.textContent = allExpanded ? 'Collapse All' : 'Expand All';

        chrome.tabs.sendMessage(tab.id, { action: 'expandAll', expand: allExpanded });
    });

    // ─── Data Loading ────────────────────────────────────────────────

    async function loadResults() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;
        const { results } = await chrome.runtime.sendMessage({ action: 'getResults', tabId: tab.id });
        if (results) {
            currentResults = results;
            renderResults(results);
        }
    }

    // Refresh from cache when a new scan completes
    chrome.runtime.onMessage.addListener(message => {
        if (message.action === 'scanResults') setTimeout(loadResults, 100);
    });

    // ─── Rendering ───────────────────────────────────────────────────

    function renderResults(r) {
        if (!r?.suspicion) {
            emptyState.style.display = 'block';
            resultsContainer.style.display = 'none';
            return;
        }

        allExpanded = false;
        if (expandAllBtn) expandAllBtn.textContent = 'Expand All';

        emptyState.style.display = 'none';
        resultsContainer.style.display = 'block';
        pageUrl.textContent = r.url || '';

        // Summary
        const s = r.suspicion;
        const emoji = { info: '🔵', medium: '🟡', high: '🟠', critical: '🔴' };
        summaryGrid.innerHTML = `
            <div class="summary-item summary-item-full level-${s.suspicionLevel}">
                <div class="summary-item-label">Suspicion Level</div>
                <div class="summary-item-value">${emoji[s.suspicionLevel] || '⚪'} ${s.suspicionLevel.toUpperCase()}</div>
            </div>
            <div class="summary-item summary-item-full">
                <div class="summary-item-label">Reason</div>
                <div class="summary-item-value" style="font-size:12px;color:#aaa;">${esc(s.reason)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-item-label">Total Code Points</div>
                <div class="summary-item-value">${s.totalCodePoints}</div>
            </div>
            <div class="summary-item">
                <div class="summary-item-label">Unique Characters</div>
                <div class="summary-item-value">${s.uniqueCodePoints}</div>
            </div>
            <div class="summary-item">
                <div class="summary-item-label">Longest Run</div>
                <div class="summary-item-value">${s.maxConsecutiveCodePoints}</div>
            </div>
            <div class="summary-item">
                <div class="summary-item-label">Longest Tag Run</div>
                <div class="summary-item-value">${s.maxConsecutiveUnicodeTags}</div>
            </div>`;

        // Category breakdown
        if (r.categoryBreakdown) {
            const entries = Object.entries(r.categoryBreakdown).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
            if (entries.length) {
                categorySection.style.display = 'block';
                categoryGrid.innerHTML = entries.map(([name, count]) =>
                    `<div class="category-row"><span class="cat-name">${esc(name)}</span><span class="cat-count">${count}</span></div>`
                ).join('');
            } else {
                categorySection.style.display = 'none';
            }
        }

        // Sync drawer controls with scan results settings
        if (r.settings) loadFilterSettings();

        // Detections
        renderDetections(r.detections);
        updateSettingsAlert();

        // Tag runs
        if (r.tagRunSummary) {
            tagRunsSection.style.display = 'block';
            tagRuns.textContent = r.tagRunSummary;
        } else {
            tagRunsSection.style.display = 'none';
        }
    }

    function renderDetections(detections) {
        if (!detections?.length) {
            detectionsList.innerHTML = '<div style="color:#666;padding:8px;">No detections.</div>';
            return;
        }

        const groups = { critical: [], high: [], medium: [], info: [] };
        for (const d of detections) (groups[d.severity] || groups.info).push(d);

        const labels = {
            critical: { emoji: '🔴', label: 'Critical' },
            high: { emoji: '🟠', label: 'High' },
            medium: { emoji: '🟡', label: 'Medium' },
            info: { emoji: '🔵', label: 'Info' },
        };

        let html = '';
        for (const [level, items] of Object.entries(groups)) {
            if (!items.length) continue;
            const { emoji, label } = labels[level];

            html += `<div class="detection-group-header">
                <span class="severity-dot ${level}"></span> ${emoji} ${label} (${items.length})
            </div>`;

            for (const d of items) {
                // Show detail line if it adds info beyond the code point
                const detailLine = d.detail && d.detail !== d.codePoints?.[0]
                    ? `<div class="detection-card-detail">${esc(d.detail)}</div>`
                    : '';
                // Show code point subtitle for single-char detections
                const codePointLine = d.groupSize === 1 && d.codePoints?.[0]
                    ? `<div class="detection-card-detail" style="opacity:0.6;font-family:monospace;">${esc(d.codePoints[0])}</div>`
                    : '';
                // Only show decoded line when it differs from both name and code point
                const showDecoded = d.decoded
                    && d.decoded !== d.charName
                    && d.decoded !== d.codePoints?.[0];

                const copyText = d.decoded || d.codePoints?.[0] || d.charName;

                html += `<div class="detection-card">
                    <div class="detection-card-header">
                        <div class="detection-card-title">
                            <span class="detection-card-type">${esc(d.charName)}</span>
                            <span class="detection-card-count">${d.groupSize} ${d.groupSize > 1 ? 'consecutive' : 'char'}</span>
                        </div>
                        <button class="detection-copy" data-copy-text="${esc(copyText)}" title="Copy decoded text">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>${codePointLine}${detailLine}
                    ${showDecoded ? `<div class="detection-card-decoded">→ "${esc(d.decoded)}"</div>` : ''}
                    <div class="detection-card-context">${esc(d.context)}</div>
                    <button class="detection-jump" data-node-id="${d.nodeId}">Jump to location ↗</button>
                </div>`;
            }
        }

        detectionsList.innerHTML = html;

        // Copy handlers
        detectionsList.querySelectorAll('.detection-copy').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const rawText = btn.dataset.copyText;
                if (!rawText) return;
                try {
                    // Sanitize output to prevent escaping quote structures when pasted
                    const sanitizedText = JSON.stringify(rawText).slice(1, -1).replace(/'/g, "\\'");
                    await navigator.clipboard.writeText(sanitizedText);
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="#00ff88" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                    }, 2000);
                } catch (err) {
                    console.error('AID: Failed to copy text:', err);
                }
            });
        });

        // Jump handlers
        detectionsList.querySelectorAll('.detection-jump').forEach(btn => {
            btn.addEventListener('click', async () => {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) chrome.tabs.sendMessage(tab.id, { action: 'scrollToDetection', nodeId: btn.dataset.nodeId });
            });
        });
    }

    // ─── Filter Drawer Controls ──────────────────────────────────────

    const panelFilterInput = document.getElementById('panel-filter-input');
    const panelFilterDropdown = document.getElementById('panel-filter-dropdown');
    const panelFilterChips = document.getElementById('panel-filter-chips');
    const panelOptFuzzySearch = document.getElementById('panel-opt-fuzzy-search');
    const panelOptNbsp = document.getElementById('panel-opt-nbsp');
    const panelOptConfusable = document.getElementById('panel-opt-confusable');
    const panelOptCc = document.getElementById('panel-opt-cc');
    const panelOptZs = document.getElementById('panel-opt-zs');
    const panelOptMinSeq = document.getElementById('panel-opt-min-seq');
    const panelOptMaxSeq = document.getElementById('panel-opt-max-seq');
    const panelSeqDrawer = document.getElementById('panel-seq-length-drawer');
    const panelSeqPreview = document.getElementById('panel-seq-preview');

    let charFilters = [];

    // ─── Filter UI Initialization ─────────────────────────────────────────────

    const filterUI = initFilterUI({
        inputEl: panelFilterInput,
        dropdownEl: panelFilterDropdown,
        chipsContainerEl: panelFilterChips,
        categoryChips: document.querySelectorAll('#active-filters-section .search-filter-chip'),
        fuzzyToggleEl: panelOptFuzzySearch,
        chipHintEl: document.getElementById('panel-chip-hint'),
        initialFilters: charFilters,
        onFilterChange: (newFilters) => {
            charFilters = newFilters;
            saveFilterSettings();
        }
    });

    // Search filter category toggles
    // Sync checkbox toggles visibility with the details toggle
    const filterToggle = document.getElementById('filter-toggle');
    const filterTogglesDiv = document.getElementById('panel-filter-toggles');
    filterToggle.addEventListener('toggle', () => {
        filterTogglesDiv.classList.toggle('collapsed', !filterToggle.open);
    });

    // ─── Detection Cards ─────────────────────────────────────────────

    function updateSeqPreview() {
        const min = parseInt(panelOptMinSeq.value, 10) || 1;
        const max = parseInt(panelOptMaxSeq.value, 10) || 0;
        panelSeqPreview.textContent = `Min: ${min} - Max: ${max}`;
    }

    panelSeqDrawer.addEventListener('toggle', updateSeqPreview);
    updateSeqPreview();

    function updateSettingsAlert() {
        const alertEl = document.getElementById('panel-settings-alert');
        if (!alertEl) return;

        const uiDefault = filterUI ? filterUI.isDefaultState() : true;
        const isNonDefault =
            !uiDefault ||
            panelOptNbsp.checked !== false ||
            panelOptConfusable.checked !== false ||
            panelOptCc.checked !== false ||
            panelOptZs.checked !== false ||
            (parseInt(panelOptMinSeq.value, 10) || 1) !== 1 ||
            (parseInt(panelOptMaxSeq.value, 10) || 0) !== 0;

        alertEl.classList.toggle('hidden', !isNonDefault);
    }

    // Save settings and trigger re-scan
    function saveFilterSettings() {
        const s = {
            autoScan: false, // Don't change autoScan from panel
            charFilters: charFilters,
            fuzzySearch: panelOptFuzzySearch.checked,
            detectNbsp: panelOptNbsp.checked,
            detectConfusableSpaces: panelOptConfusable.checked,
            detectControlChars: panelOptCc.checked,
            detectSpaceSeparators: panelOptZs.checked,
            minSeqLength: Math.max(1, parseInt(panelOptMinSeq.value, 10) || 1),
            maxSeqLength: Math.max(0, parseInt(panelOptMaxSeq.value, 10) || 0),
        };

        // Preserve autoScan from the loaded settings
        chrome.runtime.sendMessage({ action: 'getSettings' }, (resp) => {
            if (resp?.settings?.autoScan !== undefined) s.autoScan = resp.settings.autoScan;
            chrome.runtime.sendMessage({ action: 'saveSettings', settings: s });
            triggerRescan();
        });
        updateSeqPreview();
    }

    async function triggerRescan() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.runtime.sendMessage({ action: 'triggerScan', tabId: tab.id });
    }

    // Checkbox & number input handlers
    [panelOptNbsp, panelOptConfusable, panelOptCc, panelOptZs, panelOptFuzzySearch].forEach(el =>
        el.addEventListener('change', saveFilterSettings));
    [panelOptMinSeq, panelOptMaxSeq].forEach(el =>
        el.addEventListener('input', saveFilterSettings));

    // Load settings into the drawer controls
    async function loadFilterSettings() {
        const resp = await chrome.runtime.sendMessage({ action: 'getSettings' });
        const settings = resp?.settings || {};
        charFilters = settings.charFilters || [];
        panelOptNbsp.checked = settings.detectNbsp || false;
        panelOptFuzzySearch.checked = settings.fuzzySearch ?? true;
        panelOptConfusable.checked = settings.detectConfusableSpaces || false;
        panelOptCc.checked = settings.detectControlChars || false;
        panelOptZs.checked = settings.detectSpaceSeparators || false;
        panelOptMinSeq.value = settings.minSeqLength ?? 1;
        panelOptMaxSeq.value = settings.maxSeqLength ?? 0;
        if (typeof filterUI !== 'undefined') filterUI.updateFilters(charFilters);
        updateSeqPreview();
    }

    // ─── Export JSON ──────────────────────────────────────────────────

    exportJsonBtn.addEventListener('click', () => {
        if (!currentResults) return;
        const report = {
            metadata: {
                url: currentResults.url,
                timestamp: currentResults.timestamp,
                total_invisible_code_points: currentResults.suspicion?.totalCodePoints || 0,
            },
            page_suspicion: currentResults.suspicion,
            category_breakdown: currentResults.categoryBreakdown,
            detections: currentResults.detections.map(d => ({
                node_id: d.nodeId, group_size: d.groupSize, severity: d.severity,
                type: d.type, char_name: d.charName, code_points: d.codePoints,
                decoded: d.decoded, context: d.context, category: d.category,
            })),
        };
        download(JSON.stringify(report, null, 2), `aid-report-${Date.now()}.json`, 'application/json');
    });

    // ─── Export CSV ───────────────────────────────────────────────────

    exportCsvBtn.addEventListener('click', () => {
        if (!currentResults) return;
        const header = ['node_id', 'group_size', 'severity', 'type', 'char_name', 'code_points', 'decoded', 'context', 'category'];
        const rows = [header.join(',')];
        for (const d of currentResults.detections) {
            rows.push([d.nodeId, d.groupSize, d.severity, d.type, csvEsc(d.charName),
            csvEsc(d.codePoints.join(';')), csvEsc(d.decoded || ''), csvEsc(d.context), csvEsc(d.category)].join(','));
        }
        download(rows.join('\n'), `aid-report-${Date.now()}.csv`, 'text/csv');
    });

    // ─── Helpers ──────────────────────────────────────────────────────

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function csvEsc(str) {
        if (!str) return '';
        str = String(str);
        return (str.includes(',') || str.includes('"') || str.includes('\n'))
            ? '"' + str.replace(/"/g, '""') + '"'
            : str;
    }

    function download(content, filename, type) {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const a = Object.assign(document.createElement('a'), { href: url, download: filename });
        a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Initialize ───────────────────────────────────────────────────

    loadFilterSettings();
    loadResults();
});
