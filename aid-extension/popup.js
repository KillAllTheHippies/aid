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
    const filterInput = document.getElementById('filter-input');
    const filterDropdown = document.getElementById('filter-dropdown');
    const optFuzzySearch = document.getElementById('opt-fuzzy-search');
    const filterChips = document.getElementById('filter-chips');
    const optNbsp = document.getElementById('opt-nbsp');
    const optConfusable = document.getElementById('opt-confusable');
    const optCc = document.getElementById('opt-cc');
    const optZs = document.getElementById('opt-zs');
    const optMinSeq = document.getElementById('opt-min-seq');
    const optMaxSeq = document.getElementById('opt-max-seq');
    const seqDrawer = document.getElementById('seq-length-drawer');
    const seqPreview = document.getElementById('seq-preview');

    const EMOJI = { info: '🔵', medium: '🟡', high: '🟠', critical: '🔴' };

    // ─── Load Settings ──────────────────────────────────────────────

    const { settings } = await chrome.runtime.sendMessage({ action: 'getSettings' });
    optAutoScan.checked = settings.autoScan || false;
    let charFilters = settings.charFilters || [];
    optFuzzySearch.checked = settings.fuzzySearch ?? true;
    optNbsp.checked = settings.detectNbsp || false;
    optConfusable.checked = settings.detectConfusableSpaces || false;
    optCc.checked = settings.detectControlChars || false;
    optZs.checked = settings.detectSpaceSeparators || false;
    optMinSeq.value = settings.minSeqLength ?? 1;
    optMaxSeq.value = settings.maxSeqLength ?? 0;

    // ─── Settings Panel ─────────────────────────────────────────────

    settingsToggle.addEventListener('click', () => {
        settingsSection.style.display = settingsSection.style.display === 'none' ? 'block' : 'none';
    });

    function saveSettings() {
        const s = {
            autoScan: optAutoScan.checked,
            charFilters: charFilters,
            fuzzySearch: optFuzzySearch.checked,
            detectNbsp: optNbsp.checked,
            detectConfusableSpaces: optConfusable.checked,
            detectControlChars: optCc.checked,
            detectSpaceSeparators: optZs.checked,
            minSeqLength: Math.max(1, parseInt(optMinSeq.value, 10) || 1),
            maxSeqLength: Math.max(0, parseInt(optMaxSeq.value, 10) || 0),
        };

        if (s.autoScan && !settings.autoScan) {
            chrome.permissions.request({ origins: ['<all_urls>'] }, granted => {
                if (!granted) { optAutoScan.checked = false; s.autoScan = false; }
                chrome.runtime.sendMessage({ action: 'saveSettings', settings: s });
                triggerRescan();
            });
        } else {
            chrome.runtime.sendMessage({ action: 'saveSettings', settings: s });
            triggerRescan();
        }
        updateSeqPreview();
        updateSettingsAlert();
    }

    async function triggerRescan() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.runtime.sendMessage({ action: 'triggerScan', tabId: tab.id });
    }

    function updateSeqPreview() {
        const min = parseInt(optMinSeq.value, 10) || 1;
        const max = parseInt(optMaxSeq.value, 10) || 0;
        seqPreview.textContent = `Min: ${min} - Max: ${max}`;
    }

    // Update preview on drawer toggle
    seqDrawer.addEventListener('toggle', updateSeqPreview);
    updateSeqPreview();

    [optAutoScan, optNbsp, optConfusable, optCc, optZs, optFuzzySearch].forEach(el => el.addEventListener('change', saveSettings));
    [optMinSeq, optMaxSeq].forEach(el => el.addEventListener('input', saveSettings));

    // ─── Filter Chips & Autocomplete ────────────────────────────────

    // ─── Filter UI Initialization ─────────────────────────────────────────────

    const filterUI = initFilterUI({
        inputEl: filterInput,
        dropdownEl: filterDropdown,
        chipsContainerEl: filterChips,
        categoryChips: document.querySelectorAll('.search-filter-chip'),
        fuzzyToggleEl: optFuzzySearch,
        chipHintEl: document.getElementById('chip-hint'),
        initialFilters: charFilters,
        onFilterChange: (newFilters) => {
            charFilters = newFilters;
            saveSettings();
        }
    });

    // ─── Scan Button ────────────────────────────────────────────────

    scanBtn.addEventListener('click', async () => {
        scanBtn.disabled = true;
        scanBtn.classList.add('scanning');
        scanBtn.innerHTML = '<span class="btn-icon">⏳</span> Scanning…';

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.runtime.sendMessage({ action: 'triggerScan', tabId: tab.id });
    });

    // ─── Results Handling ───────────────────────────────────────────

    chrome.runtime.onMessage.addListener(message => {
        if (message.action === 'scanComplete') showLiveResults(message);
    });

    // Show cached results if available
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        const { results } = await chrome.runtime.sendMessage({ action: 'getResults', tabId: tab.id });
        if (results) showCachedResults(results);
    }

    function showLiveResults({ suspicion, totalDetections }) {
        scanBtn.disabled = false;
        scanBtn.classList.remove('scanning');
        scanBtn.innerHTML = '<span class="btn-icon">▶</span> Re-scan Page';
        statusSection.style.display = 'block';

        if (totalDetections === 0) {
            setClean();
        } else {
            statusBadge.className = `status-badge ${suspicion.suspicionLevel}`;
            statusEmoji.textContent = EMOJI[suspicion.suspicionLevel] || '⚪';
            statusText.textContent = `${totalDetections} detection${totalDetections !== 1 ? 's' : ''}`;
            statusDetail.textContent = suspicion.reason;
        }
        updateSettingsAlert();
    }

    function showCachedResults(results) {
        scanBtn.innerHTML = '<span class="btn-icon">▶</span> Re-scan Page';
        statusSection.style.display = 'block';

        if (!results.suspicion || !results.detections?.length) {
            setClean();
            return;
        }

        const s = results.suspicion;
        statusBadge.className = `status-badge ${s.suspicionLevel}`;
        statusEmoji.textContent = EMOJI[s.suspicionLevel] || '⚪';
        statusText.textContent = `${s.totalCodePoints} detection${s.totalCodePoints !== 1 ? 's' : ''}`;
        statusDetail.textContent = s.reason;
        updateSettingsAlert();

        if (results.categoryBreakdown) {
            const entries = Object.entries(results.categoryBreakdown)
                .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
            if (entries.length) {
                categorySection.style.display = 'block';
                categoryList.innerHTML = entries.map(([name, count]) =>
                    `<div class="category-row"><span class="category-name">${name}</span><span class="category-count">${count}</span></div>`
                ).join('');
            }
        }
    }

    function setClean() {
        statusBadge.className = 'status-badge clean';
        statusEmoji.textContent = '✓';
        statusText.textContent = 'No detections';
        statusDetail.textContent = 'Page is clean';
        categorySection.style.display = 'none';
        updateSettingsAlert();
    }

    function updateSettingsAlert() {
        const alertEl = document.getElementById('popup-settings-alert');
        if (!alertEl) return;

        const uiDefault = filterUI ? filterUI.isDefaultState() : true;
        const isNonDefault =
            !uiDefault ||
            optNbsp.checked !== false ||
            optConfusable.checked !== false ||
            optCc.checked !== false ||
            optZs.checked !== false ||
            (parseInt(optMinSeq.value, 10) || 1) !== 1 ||
            (parseInt(optMaxSeq.value, 10) || 0) !== 0;

        alertEl.classList.toggle('hidden', !isNonDefault);
    }

    // ─── Open Panel ─────────────────────────────────────────────────

    panelBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (chrome.sidePanel) {
            chrome.sidePanel.open({ tabId: tab.id });
        } else {
            window.close(); // Firefox: sidebar is accessible via sidebar_action
        }
    });
});
