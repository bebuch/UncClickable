/**
 * UncClickable Background Script (Service Worker)
 * Handles extension icon state and opens options page
 */

import { isUrlAllowed } from './utils/unc-matcher.js';

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Icon paths for active and inactive states
const ICONS_ACTIVE = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
};

const ICONS_INACTIVE = {
  16: 'icons/icon-16-gray.png',
  32: 'icons/icon-32-gray.png',
  48: 'icons/icon-48-gray.png',
  128: 'icons/icon-128-gray.png',
};

/**
 * Load configuration from storage
 */
async function loadConfig() {
  try {
    const result = await api.storage.sync.get({
      scheme: 'uncopener',
      activeUrls: [],
      allowedUncs: [],
    });
    return result;
  } catch (error) {
    console.error('UncClickable: Failed to load config', error);
    return { scheme: 'uncopener', activeUrls: [], allowedUncs: [] };
  }
}

/**
 * Update the extension icon and tooltip for a specific tab
 * @param {number} tabId - The tab ID
 * @param {string} url - The tab's URL
 */
async function updateIconForTab(tabId, url) {
  const config = await loadConfig();
  const active = isUrlAllowed(url, config.activeUrls);

  try {
    await api.action.setIcon({
      tabId,
      path: active ? ICONS_ACTIVE : ICONS_INACTIVE,
    });

    await api.action.setTitle({
      tabId,
      title: active 
        ? 'UncClickable - Active (click to open settings)' 
        : 'UncClickable - Inactive (click to open settings)',
    });
  } catch (error) {
    // Tab might have been closed or is a special page
    console.debug('UncClickable: Could not update icon for tab', tabId, error);
  }
}

/**
 * Handle tab updates (URL changes)
 */
function handleTabUpdated(tabId, changeInfo, tab) {
  // Only update when URL changes or page completes loading
  if (changeInfo.url || changeInfo.status === 'complete') {
    if (tab.url) {
      updateIconForTab(tabId, tab.url);
    }
  }
}

/**
 * Handle tab activation (switching tabs)
 */
function handleTabActivated(activeInfo) {
  api.tabs.get(activeInfo.tabId).then(tab => {
    if (tab.url) {
      updateIconForTab(tab.id, tab.url);
    }
  }).catch(() => {
    // Tab might not be accessible (e.g., chrome:// pages)
  });
}

/**
 * Handle extension icon click - open options page
 */
function handleActionClicked(tab) {
  api.runtime.openOptionsPage();
}

/**
 * Handle storage changes - notify content scripts
 */
function handleStorageChanged(changes, areaName) {
  if (areaName !== 'sync') {
    return;
  }

  // Notify all tabs about config change
  api.tabs.query({}).then(tabs => {
    tabs.forEach(tab => {
      // Update icon for the tab
      if (tab.url) {
        updateIconForTab(tab.id, tab.url);
      }

      // Notify content script
      api.tabs.sendMessage(tab.id, { type: 'configUpdated' }).catch(() => {
        // Content script might not be loaded on this tab
      });
    });
  });
}

/**
 * Initialize on extension install/update
 */
function handleInstalled(details) {
  if (details.reason === 'install') {
    // Open options page on first install
    api.runtime.openOptionsPage();
  }
}

// Register event listeners
api.tabs.onUpdated.addListener(handleTabUpdated);
api.tabs.onActivated.addListener(handleTabActivated);
api.action.onClicked.addListener(handleActionClicked);
api.storage.onChanged.addListener(handleStorageChanged);
api.runtime.onInstalled.addListener(handleInstalled);

// Update icon for current tab on startup
api.tabs.query({ active: true, currentWindow: true }).then(tabs => {
  if (tabs.length > 0 && tabs[0].url) {
    updateIconForTab(tabs[0].id, tabs[0].url);
  }
}).catch(() => {
  // No active tab or not accessible
});
