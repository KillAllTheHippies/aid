/**
 * AID – ASCII Smuggling Detector
 * Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
    const scanBtn = document.getElementById('scan-btn');
    const statusSection = document.getElementById('status-section');
    const statusBadge = document.getElementById('status-badge');
    const statusEmoji = document.getElementById('status-emoji');
    const statusText = document.getElementById('status-text');
    const statusDetail = document.getElementById('status-detail');
    const categorySection = document.getElementById('category-section');
    const categoryList = document.getElementById('category-list');
    const panelBtn = document.getElementById('panel-btn');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsSection = document.getElementById('settings-section');

    const optAutoScan = document.getElementById('opt-autoscan');
    const optConfusable = document.getElementById('opt-confusable');
    const optCc = document.getElementById('opt-cc');
    const optZs = document.getElementById('opt-zs');

    // ─── Load Settings ──────────────────────────────────────────────────

    const { settings } = await chrome.runtime.sendMessage({ action: 'getSettings' });
    optAutoScan.checked = settings.autoScan || false;
    optConfusable.checked = settings.detectConfusableSpaces || false;
    optCc.checked = settings.detectControlChars || false;
    optZs.checked = settings.detectSpaceSeparators || false;

    // ─── Settings Toggle ───────────────────────────────────────────────

    settingsToggle.addEventListener('click', () => {
        settingsSection.style.display =
            settingsSection.style.display === 'none' ? 'block' : 'none';
    });

    // ─── Save Settings on Change ──────────────────────────────────────

    function saveSettings() {
        const newSettings = {
            autoScan: optAutoScan.checked,
            detectConfusableSpaces: optConfusable.checked,
            detectControlChars: optCc.checked,
            detectSpaceSeparators: optZs.checked,
        };

        // If enabling auto-scan, request permission first
        if (newSettings.autoScan && !settings.autoScan) {
            chrome.permissions.request(
                { origins: ['<all_urls>'] },
                (granted) => {
                    if (!granted) {
                        optAutoScan.checked = false;
                        newSettings.autoScan = false;
                    }
                    chrome.runtime.sendMessage({ action: 'saveSettings', settings: newSettings });
                }
            );
        } else {
            chrome.runtime.sendMessage({ action: 'saveSettings', settings: newSettings });
        }
    }

    optAutoScan.addEventListener('change', saveSettings);
    optConfusable.addEventListener('change', saveSettings);
    optCc.addEventListener('change', saveSettings);
    optZs.addEventListener('change', saveSettings);

    // ─── Scan Button ──────────────────────────────────────────────────

    scanBtn.addEventListener('click', async () => {
        scanBtn.disabled = true;
        scanBtn.classList.add('scanning');
        scanBtn.innerHTML = '<span class="btn-icon">⏳</span> Scanning…';

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.runtime.sendMessage({ action: 'triggerScan', tabId: tab.id });
        }
    });

    // ─── Listen for Scan Results ──────────────────────────────────────

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'scanComplete') {
            showResults(message);
        }
    });

    // Also check if we already have results for this tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        const response = await chrome.runtime.sendMessage({
            action: 'getResults',
            tabId: tab.id,
        });
        if (response?.results) {
            showResultsFromCache(response.results);
        }
    }

    function showResults(message) {
        const { suspicion, totalDetections } = message;
        scanBtn.disabled = false;
        scanBtn.classList.remove('scanning');
        scanBtn.innerHTML = '<span class="btn-icon">▶</span> Re-scan Page';

        statusSection.style.display = 'block';

        if (totalDetections === 0) {
            statusBadge.className = 'status-badge clean';
            statusEmoji.textContent = '✓';
            statusText.textContent = 'No detections';
            statusDetail.textContent = 'Page is clean';
            categorySection.style.display = 'none';
        } else {
            const emojis = { info: '🔵', medium: '🟡', high: '🟠', critical: '🔴' };
            statusBadge.className = `status-badge ${suspicion.suspicionLevel}`;
            statusEmoji.textContent = emojis[suspicion.suspicionLevel] || '⚪';
            statusText.textContent = `${totalDetections} detection${totalDetections !== 1 ? 's' : ''}`;
            statusDetail.textContent = suspicion.reason;
        }
    }

    function showResultsFromCache(results) {
        scanBtn.innerHTML = '<span class="btn-icon">▶</span> Re-scan Page';
        statusSection.style.display = 'block';

        if (!results.suspicion || results.detections.length === 0) {
            statusBadge.className = 'status-badge clean';
            statusEmoji.textContent = '✓';
            statusText.textContent = 'No detections';
            statusDetail.textContent = 'Page is clean';
            categorySection.style.display = 'none';
            return;
        }

        const s = results.suspicion;
        const emojis = { info: '🔵', medium: '🟡', high: '🟠', critical: '🔴' };
        statusBadge.className = `status-badge ${s.suspicionLevel}`;
        statusEmoji.textContent = emojis[s.suspicionLevel] || '⚪';
        statusText.textContent = `${s.totalCodePoints} detection${s.totalCodePoints !== 1 ? 's' : ''}`;
        statusDetail.textContent = s.reason;

        // Category breakdown
        if (results.categoryBreakdown) {
            const cats = results.categoryBreakdown;
            const entries = Object.entries(cats).filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1]);

            if (entries.length > 0) {
                categorySection.style.display = 'block';
                categoryList.innerHTML = entries.map(([name, count]) => `
          <div class="category-row">
            <span class="category-name">${name}</span>
            <span class="category-count">${count}</span>
          </div>
        `).join('');
            }
        }
    }

    // ─── Open Panel ───────────────────────────────────────────────────

    panelBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (chrome.sidePanel) {
            // Chrome/Edge: open side panel
            chrome.sidePanel.open({ tabId: tab.id });
        } else {
            // Firefox fallback: sidebar is already accessible via sidebar_action
            // Just close popup and let user use the sidebar button
            window.close();
        }
    });
});
