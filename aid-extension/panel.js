/**
 * AID – ASCII Smuggling Detector
 * Detail Panel Script
 * Side Panel (Chrome/Edge) / Sidebar (Firefox)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const emptyState = document.getElementById('empty-state');
    const resultsContainer = document.getElementById('results-container');
    const pageUrl = document.getElementById('page-url');
    const summaryGrid = document.getElementById('summary-grid');
    const categorySection = document.getElementById('category-section');
    const categoryGrid = document.getElementById('category-grid');
    const detectionsList = document.getElementById('detections-list');
    const charSummarySection = document.getElementById('char-summary-section');
    const charTable = document.getElementById('char-table');
    const tagRunsSection = document.getElementById('tag-runs-section');
    const tagRuns = document.getElementById('tag-runs');
    const exportJsonBtn = document.getElementById('export-json');
    const exportCsvBtn = document.getElementById('export-csv');

    let currentResults = null;

    // Close button
    document.getElementById('close-btn').addEventListener('click', () => window.close());

    // ─── Fetch Results ────────────────────────────────────────────────

    async function loadResults() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Try getting from background cache first
        const response = await chrome.runtime.sendMessage({
            action: 'getResults',
            tabId: tab.id,
        });

        if (response?.results) {
            currentResults = response.results;
            renderResults(currentResults);
        }
    }

    // Listen for live scan updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'scanResults') {
            currentResults = message.results;
            renderResults(currentResults);
        }
    });

    // ─── Render Results ───────────────────────────────────────────────

    function renderResults(results) {
        if (!results || !results.suspicion) {
            emptyState.style.display = 'block';
            resultsContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        resultsContainer.style.display = 'block';

        // URL
        pageUrl.textContent = results.url || '';

        // Summary
        const s = results.suspicion;
        const severityEmojis = { info: '🔵', medium: '🟡', high: '🟠', critical: '🔴' };
        summaryGrid.innerHTML = `
      <div class="summary-item summary-item-full level-${s.suspicionLevel}">
        <div class="summary-item-label">Suspicion Level</div>
        <div class="summary-item-value">${severityEmojis[s.suspicionLevel] || '⚪'} ${s.suspicionLevel.toUpperCase()}</div>
      </div>
      <div class="summary-item summary-item-full">
        <div class="summary-item-label">Reason</div>
        <div class="summary-item-value" style="font-size:12px;color:#aaa;">${escapeHtml(s.reason)}</div>
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
      </div>
    `;

        // Category breakdown
        if (results.categoryBreakdown) {
            const entries = Object.entries(results.categoryBreakdown)
                .filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1]);

            if (entries.length > 0) {
                categorySection.style.display = 'block';
                categoryGrid.innerHTML = entries.map(([name, count]) => `
          <div class="category-row">
            <span class="cat-name">${escapeHtml(name)}</span>
            <span class="cat-count">${count}</span>
          </div>
        `).join('');
            } else {
                categorySection.style.display = 'none';
            }
        }

        // Detections grouped by severity
        renderDetections(results.detections);

        // Per-character summary
        if (results.perCharSummary && results.perCharSummary.length > 0) {
            charSummarySection.style.display = 'block';
            charTable.innerHTML = results.perCharSummary.map(([name, count]) => `
        <div class="char-row">
          <span class="char-name">${escapeHtml(name)}</span>
          <span class="char-freq">${count}</span>
        </div>
      `).join('');
        } else {
            charSummarySection.style.display = 'none';
        }

        // Tag runs
        if (results.tagRunSummary) {
            tagRunsSection.style.display = 'block';
            tagRuns.textContent = results.tagRunSummary;
        } else {
            tagRunsSection.style.display = 'none';
        }
    }

    // ─── Render Detections ────────────────────────────────────────────

    function renderDetections(detections) {
        if (!detections || detections.length === 0) {
            detectionsList.innerHTML = '<div style="color:#666;padding:8px;">No detections.</div>';
            return;
        }

        // Group by severity
        const groups = { critical: [], high: [], medium: [], info: [] };
        for (const d of detections) {
            (groups[d.severity] || groups.info).push(d);
        }

        const severityLabels = {
            critical: { emoji: '🔴', label: 'Critical' },
            high: { emoji: '🟠', label: 'High' },
            medium: { emoji: '🟡', label: 'Medium' },
            info: { emoji: '🔵', label: 'Info' },
        };

        let html = '';

        for (const [level, items] of Object.entries(groups)) {
            if (items.length === 0) continue;
            const { emoji, label } = severityLabels[level];

            html += `
        <div class="detection-group-header">
          <span class="severity-dot ${level}"></span>
          ${emoji} ${label} (${items.length})
        </div>
      `;

            for (const d of items) {
                html += `
          <div class="detection-card">
            <div class="detection-card-header">
              <span class="detection-card-type">${escapeHtml(d.charName)}</span>
              <span class="detection-card-count">${d.groupSize} ${d.groupSize > 1 ? 'consecutive' : 'char'}</span>
            </div>
            ${d.decoded ? `<div class="detection-card-decoded">→ "${escapeHtml(d.decoded)}"</div>` : ''}
            <div class="detection-card-context">${escapeHtml(d.context)}</div>
            <button class="detection-jump" data-node-id="${d.nodeId}">Jump to location ↗</button>
          </div>
        `;
            }
        }

        detectionsList.innerHTML = html;

        // Attach jump handlers
        detectionsList.querySelectorAll('.detection-jump').forEach(btn => {
            btn.addEventListener('click', async () => {
                const nodeId = btn.dataset.nodeId;
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'scrollToDetection',
                        nodeId,
                    });
                }
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
            per_character_summary: (currentResults.perCharSummary || []).map(([name, count]) => ({
                name, count
            })),
            detections: currentResults.detections.map(d => ({
                node_index: d.nodeIndex,
                group_size: d.groupSize,
                severity: d.severity,
                type: d.type,
                char_name: d.charName,
                code_points: d.codePoints,
                decoded: d.decoded,
                context: d.context,
                category: d.category,
            })),
        };

        downloadFile(
            JSON.stringify(report, null, 2),
            `aid-report-${Date.now()}.json`,
            'application/json'
        );
    });

    // ─── Export CSV ───────────────────────────────────────────────────

    exportCsvBtn.addEventListener('click', () => {
        if (!currentResults) return;

        const header = ['node_index', 'group_size', 'severity', 'type', 'char_name',
            'code_points', 'decoded', 'context', 'category'];
        const rows = [header.join(',')];

        for (const d of currentResults.detections) {
            const row = [
                d.nodeIndex,
                d.groupSize,
                d.severity,
                d.type,
                csvEscape(d.charName),
                csvEscape(d.codePoints.join(';')),
                csvEscape(d.decoded || ''),
                csvEscape(d.context),
                csvEscape(d.category),
            ];
            rows.push(row.join(','));
        }

        downloadFile(
            rows.join('\n'),
            `aid-report-${Date.now()}.csv`,
            'text/csv'
        );
    });

    // ─── Helpers ──────────────────────────────────────────────────────

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function csvEscape(str) {
        if (!str) return '';
        str = String(str);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Initialize ───────────────────────────────────────────────────

    loadResults();
});
