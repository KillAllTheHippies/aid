/**
 * AID – ASCII Smuggling Detector
 * Background Service Worker
 * Handles icon clicks, content script injection, badge updates, and message routing.
 */

// ─── Default Settings ────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
    autoScan: false,
    detectConfusableSpaces: false,
    detectControlChars: false,
    detectSpaceSeparators: false,
};

// ─── Badge Colors ────────────────────────────────────────────────────────────

const BADGE_COLORS = {
    clean: '#4CAF50',
    info: '#2196F3',
    medium: '#FFC107',
    high: '#FF9800',
    critical: '#F44336',
};

// ─── State ───────────────────────────────────────────────────────────────────

// Cache scan results per tab
const tabResults = new Map();

// ─── Initialization ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get('settings', (data) => {
        if (!data.settings) {
            chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
        }
    });

    // Enable side panel on Chrome/Edge
    if (chrome.sidePanel) {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    }
});

// ─── Content Script Injection ────────────────────────────────────────────────

async function injectAndScan(tabId) {
    const settings = await getSettings();

    try {
        // Inject the detection engine files
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['unicode-chars.js', 'content.js'],
        });

        // Inject the page styles
        await chrome.scripting.insertCSS({
            target: { tabId },
            files: ['styles.css'],
        });

        // Send scan command with settings
        chrome.tabs.sendMessage(tabId, {
            action: 'scan',
            settings: settings,
        });
    } catch (err) {
        console.error('AID: Failed to inject content script:', err);
    }
}

// ─── Message Handling ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scanComplete':
            handleScanComplete(sender.tab.id, message);
            break;

        case 'scanResults':
            // Cache full results for the panel
            tabResults.set(sender.tab.id, message.results);
            break;

        case 'getResults':
            // Panel requesting results for a tab
            sendResponse({ results: tabResults.get(message.tabId) || null });
            return true; // async response

        case 'triggerScan':
            // Popup requesting a scan
            injectAndScan(message.tabId);
            break;

        case 'getSettings':
            getSettings().then(settings => sendResponse({ settings }));
            return true;

        case 'saveSettings':
            chrome.storage.local.set({ settings: message.settings }, () => {
                sendResponse({ ok: true });
                handleAutoScanToggle(message.settings);
            });
            return true;
    }
});

// ─── Badge Management ────────────────────────────────────────────────────────

function handleScanComplete(tabId, message) {
    const { suspicion, totalDetections } = message;

    if (totalDetections === 0) {
        chrome.action.setBadgeText({ text: '✓', tabId });
        chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.clean, tabId });
    } else {
        const text = totalDetections > 999 ? '999+' : String(totalDetections);
        chrome.action.setBadgeText({ text, tabId });
        chrome.action.setBadgeBackgroundColor({
            color: BADGE_COLORS[suspicion.suspicionLevel] || BADGE_COLORS.info,
            tabId,
        });
    }
}

// ─── Auto-Scan Support ──────────────────────────────────────────────────────

function handleAutoScanToggle(settings) {
    if (settings.autoScan) {
        registerAutoScan();
    } else {
        unregisterAutoScan();
    }
}

function registerAutoScan() {
    // Register content scripts for all URLs when auto-scan is enabled
    chrome.scripting.registerContentScripts([{
        id: 'aid-autoscan',
        matches: ['<all_urls>'],
        js: ['unicode-chars.js', 'content.js'],
        css: ['styles.css'],
        runAt: 'document_idle',
    }]).catch(() => {
        // Script may already be registered
    });
}

function unregisterAutoScan() {
    chrome.scripting.unregisterContentScripts({ ids: ['aid-autoscan'] }).catch(() => { });
}

// ─── Tab Cleanup ─────────────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
    tabResults.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
        tabResults.delete(tabId);
        chrome.action.setBadgeText({ text: '', tabId });
    }
});

// ─── Settings Helpers ────────────────────────────────────────────────────────

function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get('settings', (data) => {
            resolve(data.settings || DEFAULT_SETTINGS);
        });
    });
}

// On startup, check if auto-scan is enabled
getSettings().then(settings => {
    if (settings.autoScan) {
        registerAutoScan();
    }
});
