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
    const filterChips = document.getElementById('filter-chips');
    const optNbsp = document.getElementById('opt-nbsp');
    const optConfusable = document.getElementById('opt-confusable');
    const optCc = document.getElementById('opt-cc');
    const optZs = document.getElementById('opt-zs');
    const optMinSeq = document.getElementById('opt-min-seq');
    const optMaxSeq = document.getElementById('opt-max-seq');

    const EMOJI = { info: '🔵', medium: '🟡', high: '🟠', critical: '🔴' };

    // ─── Load Settings ──────────────────────────────────────────────

    const { settings } = await chrome.runtime.sendMessage({ action: 'getSettings' });
    optAutoScan.checked = settings.autoScan || false;
    let charFilters = settings.charFilters || [];
    renderChips();
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
            });
        } else {
            chrome.runtime.sendMessage({ action: 'saveSettings', settings: s });
        }
    }

    [optAutoScan, optNbsp, optConfusable, optCc, optZs].forEach(el => el.addEventListener('change', saveSettings));
    [optMinSeq, optMaxSeq].forEach(el => el.addEventListener('input', saveSettings));

    // ─── Filter Chips & Autocomplete ────────────────────────────────

    let knownChars = [];
    try {
        knownChars = getAllKnownCharacters();
    } catch (e) { /* might fail if unicode-chars.js isn't loaded properly in some environments */ }

    // ─── Search Filter Category Toggles ─────────────────────────────

    const searchFilterChips = document.querySelectorAll('.search-filter-chip');
    const categoryStates = {}; // { invisible: 'include', variation: 'include', ... }

    searchFilterChips.forEach(chip => {
        const cat = chip.dataset.category;
        categoryStates[cat] = chip.dataset.state;

        chip.addEventListener('click', () => {
            const newState = chip.dataset.state === 'include' ? 'exclude' : 'include';
            chip.dataset.state = newState;
            categoryStates[cat] = newState;
            chip.querySelector('.sf-toggle').textContent = newState === 'include' ? '+' : '\u2212';
            // Re-filter the dropdown if it's open
            triggerDropdownRefresh();
        });
    });

    function getFilteredKnownChars(query) {
        // First filter by enabled categories
        const enabledCategories = Object.entries(categoryStates)
            .filter(([, state]) => state === 'include')
            .map(([cat]) => cat);

        return knownChars.filter(c => {
            // Category filter
            if (!enabledCategories.includes(c.searchCategory)) return false;
            // Text query filter
            if (query) {
                return c.name.toLowerCase().includes(query) ||
                    c.codeStr.toLowerCase().includes(query);
            }
            return true;
        }).slice(0, 500);
    }

    function triggerDropdownRefresh() {
        if (!filterDropdown.classList.contains('show')) return;
        const query = filterInput.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    }

    function renderChips() {
        filterChips.innerHTML = '';
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
                renderChips();
                saveSettings();
            });

            const label = document.createElement('div');
            label.className = 'filter-chip-label';
            label.textContent = filter.id;

            const remove = document.createElement('div');
            remove.className = 'filter-chip-remove';
            remove.textContent = '×';
            remove.addEventListener('click', () => {
                charFilters.splice(index, 1);
                renderChips();
                saveSettings();
            });

            chip.appendChild(toggle);
            chip.appendChild(label);
            chip.appendChild(remove);
            filterChips.appendChild(chip);
        });
    }

    let currentFocus = -1;
    let currentMatches = [];

    function renderDropdown(matches) {
        currentMatches = matches;
        currentFocus = -1;
        filterDropdown.innerHTML = '';
        if (matches.length === 0) {
            filterDropdown.classList.remove('show');
            return;
        }

        matches.forEach((match, idx) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.id = `dropdown-item-${idx}`;

            const codeSpan = document.createElement('span');
            codeSpan.className = 'dropdown-item-code';
            codeSpan.textContent = match.codeStr;

            item.appendChild(codeSpan);
            item.appendChild(document.createTextNode(match.name));

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                addFilter(match);
            });

            filterDropdown.appendChild(item);
        });
        filterDropdown.classList.add('show');
    }

    function addFilter(match) {
        if (!charFilters.find(f => f.id === match.codeStr)) {
            charFilters.push({ id: match.codeStr, type: 'exclude' });
            renderChips();
            saveSettings();
        }
        filterInput.value = '';
        filterDropdown.classList.remove('show');
        filterInput.focus();
    }

    function setActiveItem(items) {
        if (!items || items.length === 0) return;
        Array.from(items).forEach(item => item.classList.remove('active'));
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('active');
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }

    filterInput.addEventListener('keydown', (e) => {
        const items = filterDropdown.querySelectorAll('.dropdown-item');
        if (!filterDropdown.classList.contains('show') || items.length === 0) return;

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

    filterInput.addEventListener('input', () => {
        const query = filterInput.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    });

    filterInput.addEventListener('focus', () => {
        const query = filterInput.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    });

    filterInput.addEventListener('click', () => {
        if (!filterDropdown.classList.contains('show')) {
            const query = filterInput.value.trim().toLowerCase();
            renderDropdown(getFilteredKnownChars(query));
        }
    });

    filterInput.addEventListener('blur', () => {
        filterDropdown.classList.remove('show');
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
