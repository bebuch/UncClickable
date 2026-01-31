/**
 * Browser API Mocks for Testing
 */

import { vi } from 'vitest';

/**
 * Create a mock for browser.storage API
 */
export function createStorageMock() {
  let storage = {};

  const storageMethods = {
    get: vi.fn(async (keys) => {
      if (keys === null || keys === undefined) {
        return { ...storage };
      }
      if (typeof keys === 'string') {
        return { [keys]: storage[keys] };
      }
      if (Array.isArray(keys)) {
        return keys.reduce((acc, key) => {
          if (key in storage) {
            acc[key] = storage[key];
          }
          return acc;
        }, {});
      }
      // Object with defaults
      return Object.keys(keys).reduce((acc, key) => {
        acc[key] = key in storage ? storage[key] : keys[key];
        return acc;
      }, {});
    }),
    set: vi.fn(async (items) => {
      Object.assign(storage, items);
    }),
    remove: vi.fn(async (keys) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => delete storage[key]);
    }),
    clear: vi.fn(async () => {
      storage = {};
    }),
  };

  return {
    sync: storageMethods,
    local: storageMethods,
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
    // Test helpers
    _reset: () => {
      storage = {};
      vi.clearAllMocks();
    },
    _getAll: () => ({ ...storage }),
    _setDirect: (data) => {
      storage = { ...data };
    },
  };
}

/**
 * Create a mock for browser.action API (Manifest V3)
 */
export function createActionMock() {
  return {
    setIcon: vi.fn(async () => {}),
    setTitle: vi.fn(async () => {}),
    setBadgeText: vi.fn(async () => {}),
    setBadgeBackgroundColor: vi.fn(async () => {}),
    enable: vi.fn(async () => {}),
    disable: vi.fn(async () => {}),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  };
}

/**
 * Create a mock for browser.tabs API
 */
export function createTabsMock() {
  return {
    query: vi.fn(async () => []),
    get: vi.fn(async (tabId) => ({ id: tabId, url: 'https://example.com/' })),
    sendMessage: vi.fn(async () => {}),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };
}

/**
 * Create a mock for browser.runtime API
 */
export function createRuntimeMock() {
  return {
    sendMessage: vi.fn(async () => {}),
    openOptionsPage: vi.fn(async () => {}),
    getURL: vi.fn((path) => `moz-extension://mock-id/${path}`),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };
}

/**
 * Create complete browser API mock
 */
export function createBrowserMock() {
  return {
    storage: createStorageMock(),
    action: createActionMock(),
    tabs: createTabsMock(),
    runtime: createRuntimeMock(),
  };
}
