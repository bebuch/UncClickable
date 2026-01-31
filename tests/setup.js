/**
 * Test Setup - Runs before all tests
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { createBrowserMock } from './mocks/browser-api.js';

// Create browser mock
const browserMock = createBrowserMock();

// Set as global (Firefox-style API)
global.browser = browserMock;

// Also set as chrome (Chrome-style API)
global.chrome = browserMock;

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  browserMock.storage._reset();
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Export for use in tests
export { browserMock };
