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

    // Close button
    document.getElementById('close-btn').addEventListener('click', () => window.close());

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

        // Active Filters summary (read-only chips above the drawer)
        const activeFiltersContent = document.getElementById('active-filters-content');
        if (r.settings) {
            let filtersHtml = '';

            // Render Include/Exclude Chips
            if (r.settings.charFilters && r.settings.charFilters.length > 0) {
                filtersHtml += `<div class="filter-chips-container" style="margin-bottom: 8px;">`;
                r.settings.charFilters.forEach(filter => {
                    const typeSymbol = filter.type === 'include' ? '+' : '−';
                    filtersHtml += `
                        <div class="filter-chip" style="cursor: default;">
                            <div class="filter-chip-toggle" data-type="${filter.type}" style="cursor: default;" title="${filter.type === 'include' ? 'Include' : 'Exclude'}">${typeSymbol}</div>
                            <div class="filter-chip-label">${esc(filter.id)}</div>
                        </div>`;
                });
                filtersHtml += `</div>`;
            }

            // Render Sequence Limits
            const min = r.settings.minSeqLength ?? 1;
            const max = r.settings.maxSeqLength ?? 0;
            filtersHtml += `<div style="font-size: 11px; color: #aaa; margin-top: 4px; padding-left: 4px; font-family: monospace;">` +
                `Sequence limits&nbsp; ▶ &nbsp;Min: <span style="color:#fff">${min}</span> &nbsp;Max: <span style="color:#fff">${max === 0 ? '∞' : max}</span>` +
                `</div>`;

            activeFiltersContent.innerHTML = filtersHtml;
        }

        // Detections
        renderDetections(r.detections);

        // Tag runs
        if (r.tagRunSummary) {
            tagRunsSection.style.display = 'block';
            tagRuns.textContent = r.tagRunSummary;
        } else {
            tagRunsSection.style.display = 'none';
        }
    }

    // ─── Detection Cards ─────────────────────────────────────────────

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
                html += `<div class="detection-card">
                    <div class="detection-card-header">
                        <span class="detection-card-type">${esc(d.charName)}</span>
                        <span class="detection-card-count">${d.groupSize} ${d.groupSize > 1 ? 'consecutive' : 'char'}</span>
                    </div>${codePointLine}${detailLine}
                    ${showDecoded ? `<div class="detection-card-decoded">→ "${esc(d.decoded)}"</div>` : ''}
                    <div class="detection-card-context">${esc(d.context)}</div>
                    <button class="detection-jump" data-node-id="${d.nodeId}">Jump to location ↗</button>
                </div>`;
            }
        }

        detectionsList.innerHTML = html;

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
    const panelOptNbsp = document.getElementById('panel-opt-nbsp');
    const panelOptConfusable = document.getElementById('panel-opt-confusable');
    const panelOptCc = document.getElementById('panel-opt-cc');
    const panelOptZs = document.getElementById('panel-opt-zs');
    const panelOptMinSeq = document.getElementById('panel-opt-min-seq');
    const panelOptMaxSeq = document.getElementById('panel-opt-max-seq');
    const panelSeqDrawer = document.getElementById('panel-seq-length-drawer');
    const panelSeqPreview = document.getElementById('panel-seq-preview');

    let charFilters = [];

    // Load known characters for autocomplete
    let knownChars = [];
    try { knownChars = getAllKnownCharacters(); } catch { /* */ }

    // Search filter category toggles
    const searchFilterChips = document.querySelectorAll('#filter-drawer .search-filter-chip');
    const categoryStates = {};

    searchFilterChips.forEach(chip => {
        const cat = chip.dataset.category;
        categoryStates[cat] = chip.dataset.state;

        chip.addEventListener('click', () => {
            const newState = chip.dataset.state === 'include' ? 'exclude' : 'include';
            chip.dataset.state = newState;
            categoryStates[cat] = newState;
            chip.querySelector('.sf-toggle').textContent = newState === 'include' ? '+' : '\u2212';
            triggerDropdownRefresh();
        });
    });

    function getFilteredKnownChars(query) {
        const enabledCategories = Object.entries(categoryStates)
            .filter(([, state]) => state === 'include')
            .map(([cat]) => cat);

        return knownChars.filter(c => {
            if (!enabledCategories.includes(c.searchCategory)) return false;
            if (query) {
                return c.name.toLowerCase().includes(query) ||
                    c.codeStr.toLowerCase().includes(query);
            }
            return true;
        }).slice(0, 500);
    }

    function triggerDropdownRefresh() {
        if (!panelFilterDropdown.classList.contains('show')) return;
        const query = panelFilterInput.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    }

    function renderFilterChips() {
        panelFilterChips.innerHTML = '';
        charFilters.forEach((filter, index) => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';

            const toggle = document.createElement('div');
            toggle.className = 'filter-chip-toggle';
            toggle.dataset.type = filter.type;
            toggle.textContent = filter.type === 'include' ? '+' : '−';
            toggle.title = filter.type === 'include' ? 'Include (Allow-list)' : 'Exclude (Ignore)';
            toggle.addEventListener('click', () => {
                filter.type = filter.type === 'include' ? 'exclude' : 'include';
                renderFilterChips();
                saveFilterSettings();
            });

            const label = document.createElement('div');
            label.className = 'filter-chip-label';
            label.textContent = filter.id;

            const remove = document.createElement('div');
            remove.className = 'filter-chip-remove';
            remove.textContent = '×';
            remove.addEventListener('click', () => {
                charFilters.splice(index, 1);
                renderFilterChips();
                saveFilterSettings();
            });

            chip.appendChild(toggle);
            chip.appendChild(label);
            chip.appendChild(remove);
            panelFilterChips.appendChild(chip);
        });
    }

    let currentFocus = -1;
    let currentMatches = [];

    function renderDropdown(matches) {
        currentMatches = matches;
        currentFocus = -1;
        panelFilterDropdown.innerHTML = '';
        if (matches.length === 0) {
            panelFilterDropdown.classList.remove('show');
            return;
        }

        matches.forEach((match, idx) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.id = `panel-dropdown-item-${idx}`;

            const codeSpan = document.createElement('span');
            codeSpan.className = 'dropdown-item-code';
            codeSpan.textContent = match.codeStr;

            item.appendChild(codeSpan);
            item.appendChild(document.createTextNode(match.name));

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                addFilter(match);
            });

            panelFilterDropdown.appendChild(item);
        });
        panelFilterDropdown.classList.add('show');
    }

    function addFilter(match) {
        if (!charFilters.find(f => f.id === match.codeStr)) {
            charFilters.push({ id: match.codeStr, type: 'exclude' });
            renderFilterChips();
            saveFilterSettings();
        }
        panelFilterInput.value = '';
        panelFilterDropdown.classList.remove('show');
        panelFilterInput.focus();
    }

    function setActiveItem(items) {
        if (!items || items.length === 0) return;
        Array.from(items).forEach(item => item.classList.remove('active'));
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('active');
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }

    panelFilterInput.addEventListener('keydown', (e) => {
        const items = panelFilterDropdown.querySelectorAll('.dropdown-item');
        if (!panelFilterDropdown.classList.contains('show') || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            currentFocus++;
            setActiveItem(items);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            setActiveItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1) {
                items[currentFocus].dispatchEvent(new MouseEvent('mousedown'));
            } else if (items.length === 1) {
                items[0].dispatchEvent(new MouseEvent('mousedown'));
            }
        }
    });

    panelFilterInput.addEventListener('input', () => {
        const query = panelFilterInput.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    });

    panelFilterInput.addEventListener('focus', () => {
        const query = panelFilterInput.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    });

    panelFilterInput.addEventListener('click', () => {
        if (!panelFilterDropdown.classList.contains('show')) {
            const query = panelFilterInput.value.trim().toLowerCase();
            renderDropdown(getFilteredKnownChars(query));
        }
    });

    panelFilterInput.addEventListener('blur', () => {
        panelFilterDropdown.classList.remove('show');
    });

    function updateSeqPreview() {
        const min = parseInt(panelOptMinSeq.value, 10) || 1;
        const max = parseInt(panelOptMaxSeq.value, 10) || 0;
        panelSeqPreview.textContent = `Min: ${min} - Max: ${max}`;
    }

    panelSeqDrawer.addEventListener('toggle', updateSeqPreview);
    updateSeqPreview();

    // Save settings and trigger re-scan
    function saveFilterSettings() {
        const s = {
            autoScan: false, // Don't change autoScan from panel
            charFilters: charFilters,
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
    [panelOptNbsp, panelOptConfusable, panelOptCc, panelOptZs].forEach(el =>
        el.addEventListener('change', saveFilterSettings));
    [panelOptMinSeq, panelOptMaxSeq].forEach(el =>
        el.addEventListener('input', saveFilterSettings));

    // Load settings into the drawer controls
    async function loadFilterSettings() {
        const resp = await chrome.runtime.sendMessage({ action: 'getSettings' });
        const settings = resp?.settings || {};
        charFilters = settings.charFilters || [];
        panelOptNbsp.checked = settings.detectNbsp || false;
        panelOptConfusable.checked = settings.detectConfusableSpaces || false;
        panelOptCc.checked = settings.detectControlChars || false;
        panelOptZs.checked = settings.detectSpaceSeparators || false;
        panelOptMinSeq.value = settings.minSeqLength ?? 1;
        panelOptMaxSeq.value = settings.maxSeqLength ?? 0;
        renderFilterChips();
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
        return d.innerHTML;
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
