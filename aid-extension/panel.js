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
                html += `<div class="detection-card">
                    <div class="detection-card-header">
                        <span class="detection-card-type">${esc(d.charName)}</span>
                        <span class="detection-card-count">${d.groupSize} ${d.groupSize > 1 ? 'consecutive' : 'char'}</span>
                    </div>
                    ${d.decoded ? `<div class="detection-card-decoded">→ "${esc(d.decoded)}"</div>` : ''}
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
            per_character_summary: [],
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

    loadResults();
});
