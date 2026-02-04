/**
 * Unit Tests for Background Script (Service Worker)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrowserMock } from './mocks/browser-api.js';

// Set up browser mock before importing background.js
const browserMock = createBrowserMock();
globalThis.browser = browserMock;
globalThis.chrome = undefined;

// Now import the background module
const {
  loadConfig,
  updateIconForTab,
  handleTabUpdated,
  handleTabActivated,
  handleActionClicked,
  handleStorageChanged,
  handleInstalled,
  ICONS_ACTIVE,
  ICONS_INACTIVE,
} = await import('../src/background.js');

describe('Background Script - loadConfig', () => {
  beforeEach(() => {
    browserMock.storage._reset();
  });

  it('should return default config when storage is empty', async () => {
    const config = await loadConfig();

    expect(config).toEqual({
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    });
  });

  it('should return stored config values', async () => {
    browserMock.storage._setDirect({
      scheme: 'myscheme',
      htmlElements: 'code;pre',
      activeUrls: [{ url: 'https://example.com/', elements: ['code'] }],
      allowedUncs: ['\\\\server\\'],
    });

    const config = await loadConfig();

    expect(config.scheme).toBe('myscheme');
    expect(config.htmlElements).toBe('code;pre');
    expect(config.activeUrls).toEqual([{ url: 'https://example.com/', elements: ['code'] }]);
    expect(config.allowedUncs).toEqual(['\\\\server\\']);
  });

  it('should merge defaults with partial stored config', async () => {
    browserMock.storage._setDirect({
      scheme: 'custom',
    });

    const config = await loadConfig();

    expect(config.scheme).toBe('custom');
    expect(config.htmlElements).toBe('code');
    expect(config.activeUrls).toEqual([]);
    expect(config.allowedUncs).toEqual([]);
  });

  it('should return defaults on storage error', async () => {
    browserMock.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const config = await loadConfig();

    expect(config).toEqual({
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('Background Script - updateIconForTab', () => {
  beforeEach(() => {
    browserMock.storage._reset();
    vi.clearAllMocks();
  });

  it('should set active icon when URL is allowed', async () => {
    browserMock.storage._setDirect({
      activeUrls: [],
    });

    await updateIconForTab(1, 'https://example.com/');

    expect(browserMock.action.setIcon).toHaveBeenCalledWith({
      tabId: 1,
      path: ICONS_ACTIVE,
    });
    expect(browserMock.action.setTitle).toHaveBeenCalledWith({
      tabId: 1,
      title: 'UncClickable - Active (click to open settings)',
    });
  });

  it('should set inactive icon when URL is not allowed', async () => {
    browserMock.storage._setDirect({
      htmlElements: 'code',
      activeUrls: [{ url: 'https://allowed.com/', elements: ['code'] }],
    });

    await updateIconForTab(1, 'https://other.com/');

    expect(browserMock.action.setIcon).toHaveBeenCalledWith({
      tabId: 1,
      path: ICONS_INACTIVE,
    });
    expect(browserMock.action.setTitle).toHaveBeenCalledWith({
      tabId: 1,
      title: 'UncClickable - Inactive (click to open settings)',
    });
  });

  it('should set active icon when URL matches configured prefix', async () => {
    browserMock.storage._setDirect({
      htmlElements: 'code',
      activeUrls: [{ url: 'https://example.com/docs/', elements: ['code'] }],
    });

    await updateIconForTab(1, 'https://example.com/docs/page.html');

    expect(browserMock.action.setIcon).toHaveBeenCalledWith({
      tabId: 1,
      path: ICONS_ACTIVE,
    });
  });

  it('should handle API errors gracefully', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });
    browserMock.action.setIcon.mockRejectedValueOnce(new Error('Tab closed'));
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    await updateIconForTab(1, 'https://example.com/');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Background Script - handleTabUpdated', () => {
  beforeEach(() => {
    browserMock.storage._reset();
    vi.clearAllMocks();
  });

  it('should update icon when URL changes', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });

    handleTabUpdated(1, { url: 'https://example.com/' }, { url: 'https://example.com/' });

    // Wait for async operations
    await vi.waitFor(() => {
      expect(browserMock.action.setIcon).toHaveBeenCalled();
    });
  });

  it('should update icon when page completes loading', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });

    handleTabUpdated(1, { status: 'complete' }, { url: 'https://example.com/' });

    await vi.waitFor(() => {
      expect(browserMock.action.setIcon).toHaveBeenCalled();
    });
  });

  it('should not update icon for other change types', () => {
    handleTabUpdated(1, { title: 'New Title' }, { url: 'https://example.com/' });

    expect(browserMock.action.setIcon).not.toHaveBeenCalled();
  });

  it('should not update icon if tab has no URL', () => {
    handleTabUpdated(1, { url: 'https://example.com/' }, {});

    expect(browserMock.action.setIcon).not.toHaveBeenCalled();
  });
});

describe('Background Script - handleTabActivated', () => {
  beforeEach(() => {
    browserMock.storage._reset();
    vi.clearAllMocks();
  });

  it('should update icon for activated tab', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });
    browserMock.tabs.get.mockResolvedValueOnce({ id: 1, url: 'https://example.com/' });

    handleTabActivated({ tabId: 1 });

    await vi.waitFor(() => {
      expect(browserMock.tabs.get).toHaveBeenCalledWith(1);
      expect(browserMock.action.setIcon).toHaveBeenCalled();
    });
  });

  it('should handle inaccessible tabs gracefully', async () => {
    browserMock.tabs.get.mockRejectedValueOnce(new Error('Tab not accessible'));

    handleTabActivated({ tabId: 1 });

    // Should not throw
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  it('should not update icon if tab has no URL', async () => {
    browserMock.tabs.get.mockResolvedValueOnce({ id: 1 });

    handleTabActivated({ tabId: 1 });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(browserMock.action.setIcon).not.toHaveBeenCalled();
  });
});

describe('Background Script - handleActionClicked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open options page when icon is clicked', () => {
    handleActionClicked({ id: 1, url: 'https://example.com/' });

    expect(browserMock.runtime.openOptionsPage).toHaveBeenCalled();
  });
});

describe('Background Script - handleStorageChanged', () => {
  beforeEach(() => {
    browserMock.storage._reset();
    vi.clearAllMocks();
  });

  it('should ignore non-sync storage changes', () => {
    handleStorageChanged({}, 'local');

    expect(browserMock.tabs.query).not.toHaveBeenCalled();
  });

  it('should update all tabs when sync storage changes', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });
    browserMock.tabs.query.mockResolvedValueOnce([
      { id: 1, url: 'https://example.com/' },
      { id: 2, url: 'https://other.com/' },
    ]);

    handleStorageChanged({ activeUrls: { newValue: ['https://example.com/'] } }, 'sync');

    await vi.waitFor(() => {
      expect(browserMock.tabs.query).toHaveBeenCalledWith({});
      expect(browserMock.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  it('should send configUpdated message to content scripts', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });
    browserMock.tabs.query.mockResolvedValueOnce([{ id: 1, url: 'https://example.com/' }]);

    handleStorageChanged({}, 'sync');

    await vi.waitFor(() => {
      expect(browserMock.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'configUpdated' });
    });
  });

  it('should handle tabs without URL', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });
    browserMock.tabs.query.mockResolvedValueOnce([
      { id: 1 },
      { id: 2, url: 'https://example.com/' },
    ]);

    handleStorageChanged({}, 'sync');

    await vi.waitFor(() => {
      expect(browserMock.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle content script not loaded gracefully', async () => {
    browserMock.storage._setDirect({ activeUrls: [] });
    browserMock.tabs.query.mockResolvedValueOnce([{ id: 1, url: 'https://example.com/' }]);
    browserMock.tabs.sendMessage.mockRejectedValueOnce(new Error('No content script'));

    handleStorageChanged({}, 'sync');

    // Should not throw
    await new Promise(resolve => setTimeout(resolve, 10));
  });
});

describe('Background Script - handleInstalled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open options page on first install', () => {
    handleInstalled({ reason: 'install' });

    expect(browserMock.runtime.openOptionsPage).toHaveBeenCalled();
  });

  it('should not open options page on update', () => {
    handleInstalled({ reason: 'update' });

    expect(browserMock.runtime.openOptionsPage).not.toHaveBeenCalled();
  });

  it('should not open options page on browser update', () => {
    handleInstalled({ reason: 'browser_update' });

    expect(browserMock.runtime.openOptionsPage).not.toHaveBeenCalled();
  });
});

describe('Background Script - Icon Constants', () => {
  it('should have correct active icon paths', () => {
    expect(ICONS_ACTIVE).toEqual({
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    });
  });

  it('should have correct inactive icon paths', () => {
    expect(ICONS_INACTIVE).toEqual({
      16: 'icons/icon-16-gray.png',
      32: 'icons/icon-32-gray.png',
      48: 'icons/icon-48-gray.png',
      128: 'icons/icon-128-gray.png',
    });
  });
});
