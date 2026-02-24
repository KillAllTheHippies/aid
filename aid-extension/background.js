/**
 * AID – ASCII Smuggling Detector
 * Background Service Worker
 * Handles content-script injection, badge updates, message routing, and auto-scan.
 */

// ─── Defaults & Constants ───────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
    autoScan: false,
    detectConfusableSpaces: false,
    detectControlChars: false,
    detectSpaceSeparators: false,
    minSeqLength: 1,
    maxSeqLength: 0,  // 0 = no limit
};

const BADGE_COLORS = {
    clean: '#4CAF50',
    info: '#2196F3',
    medium: '#FFC107',
    high: '#FF9800',
    critical: '#F44336',
};

// ─── State ──────────────────────────────────────────────────────────────────

const tabResults = new Map(); // tabId → scan results

// ─── Initialization ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get('settings', data => {
        if (!data.settings) chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    });
    if (chrome.sidePanel) {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    }
});

// ─── Content-Script Injection ───────────────────────────────────────────────

async function injectAndScan(tabId) {
    const settings = await getSettings();
    try {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['unicode-chars.js', 'content.js'] });
        await chrome.scripting.insertCSS({ target: { tabId }, files: ['styles.css'] });
        chrome.tabs.sendMessage(tabId, { action: 'scan', settings });
    } catch (err) {
        console.error('AID: injection failed:', err);
    }
}

// ─── Message Handling ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scanComplete':
            updateBadge(sender.tab.id, message);
            break;

        case 'scanResults':
            tabResults.set(sender.tab.id, message.results);
            break;

        case 'getResults':
            sendResponse({ results: tabResults.get(message.tabId) || null });
            return true;

        case 'triggerScan':
            injectAndScan(message.tabId);
            break;

        case 'getSettings':
            getSettings().then(s => sendResponse({ settings: s }));
            return true;

        case 'saveSettings':
            chrome.storage.local.set({ settings: message.settings }, () => {
                sendResponse({ ok: true });
                handleAutoScanToggle(message.settings);
            });
            return true;
    }
});

// ─── Badge ──────────────────────────────────────────────────────────────────

function updateBadge(tabId, { suspicion, totalDetections }) {
    if (totalDetections === 0) {
        chrome.action.setBadgeText({ text: '✓', tabId });
        chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.clean, tabId });
    } else {
        chrome.action.setBadgeText({ text: totalDetections > 999 ? '999+' : String(totalDetections), tabId });
        chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS[suspicion.suspicionLevel] || BADGE_COLORS.info, tabId });
    }
}

// ─── Auto-Scan ──────────────────────────────────────────────────────────────

function handleAutoScanToggle(settings) {
    settings.autoScan ? registerAutoScan() : unregisterAutoScan();
}

function registerAutoScan() {
    chrome.scripting.registerContentScripts([{
        id: 'aid-autoscan',
        matches: ['<all_urls>'],
        js: ['unicode-chars.js', 'content.js'],
        css: ['styles.css'],
        runAt: 'document_idle',
    }]).catch(() => { /* may already be registered */ });
}

function unregisterAutoScan() {
    chrome.scripting.unregisterContentScripts({ ids: ['aid-autoscan'] }).catch(() => { });
}

// ─── Tab Cleanup ────────────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener(tabId => tabResults.delete(tabId));

chrome.tabs.onUpdated.addListener((tabId, info) => {
    if (info.status === 'loading') {
        tabResults.delete(tabId);
        chrome.action.setBadgeText({ text: '', tabId });
    }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSettings() {
    return new Promise(resolve => {
        chrome.storage.local.get('settings', data => resolve(data.settings || DEFAULT_SETTINGS));
    });
}

// Restore auto-scan on startup
getSettings().then(s => { if (s.autoScan) registerAutoScan(); });
