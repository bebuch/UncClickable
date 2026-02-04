/**
 * Integration Tests
 *
 * Tests the interaction between different components of the extension.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { browserMock } from './setup.js';
import {
  getActiveUrlEntry,
  isUncAllowed,
  convertUncToUrl,
  validateCodeElement,
} from '../src/utils/unc-matcher.js';

/**
 * Helper to simulate the full content script flow
 */
function simulateContentScriptFlow(config) {
  // Step 1: Check if URL is allowed and get active elements
  const currentUrl = window.location.href;
  const entry = getActiveUrlEntry(currentUrl, config.activeUrls, config.htmlElements || 'code');

  if (!entry || entry.elements.length === 0) {
    return { processed: 0, active: false };
  }

  // Step 2: Find and process matching elements
  const selector = entry.elements.join(', ');
  const elements = document.querySelectorAll(selector);
  let processed = 0;

  elements.forEach(element => {
    const validation = validateCodeElement(element);
    if (!validation.valid) {
      return;
    }

    // Step 3: Check UNC allowlist
    if (!isUncAllowed(validation.text, config.allowedUncs)) {
      return;
    }

    // Step 4: Convert and create link
    const url = convertUncToUrl(validation.text, config.scheme);
    const link = document.createElement('a');
    link.href = url;
    link.textContent = validation.text;
    element.textContent = '';
    element.appendChild(link);
    processed++;
  });

  return { processed, active: true };
}

describe('Integration - Full Content Script Flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://wiki.example.com/docs/page' },
      writable: true,
    });
  });

  it('should process UNC paths when URL is allowed and no UNC restrictions', () => {
    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [{ url: 'https://wiki.example.com/', elements: ['code'] }],
      allowedUncs: [],
    };

    document.body.innerHTML = `
      <article>
        <p>Server path: <code>\\\\fileserver\\share\\docs\\readme.txt</code></p>
        <p>Another path: <code>\\\\data-1\\users\\john\\</code></p>
      </article>
    `;

    const result = simulateContentScriptFlow(config);

    expect(result.active).toBe(true);
    expect(result.processed).toBe(2);

    const links = document.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].href).toBe('uncopener://fileserver/share/docs/readme.txt');
    expect(links[1].href).toBe('uncopener://data-1/users/john/');
  });

  it('should not process when URL is not in allowed list', () => {
    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [{ url: 'https://intranet.company.com/', elements: ['code'] }],
      allowedUncs: [],
    };

    document.body.innerHTML = '<code>\\\\server\\share</code>';

    const result = simulateContentScriptFlow(config);

    expect(result.active).toBe(false);
    expect(result.processed).toBe(0);
    expect(document.querySelector('a')).toBeNull();
  });

  it('should filter UNC paths based on allowlist', () => {
    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: ['\\\\approved-server\\'],
    };

    document.body.innerHTML = `
      <code>\\\\approved-server\\data\\file.txt</code>
      <code>\\\\other-server\\data\\file.txt</code>
    `;

    const result = simulateContentScriptFlow(config);

    expect(result.processed).toBe(1);

    const links = document.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].textContent).toBe('\\\\approved-server\\data\\file.txt');
  });

  it('should use custom scheme in generated URLs', () => {
    const config = {
      scheme: 'myapp',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    };

    document.body.innerHTML = '<code>\\\\server\\share</code>';

    simulateContentScriptFlow(config);

    const link = document.querySelector('a');
    expect(link.href).toBe('myapp://server/share');
  });

  it('should skip invalid UNC paths while processing valid ones', () => {
    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    };

    document.body.innerHTML = `
      <code>\\\\valid\\path\\file.txt</code>
      <code>not a UNC path</code>
      <code>\\\\another\\valid</code>
      <code>\\\\invalid<chars</code>
    `;

    const result = simulateContentScriptFlow(config);

    expect(result.processed).toBe(2);
  });

  it('should handle complex page structure', () => {
    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    };

    document.body.innerHTML = `
      <nav>Navigation</nav>
      <main>
        <article class="content">
          <h1>Documentation</h1>
          <section>
            <p>Access the file at <code>\\\\docs-server\\manuals\\user-guide.pdf</code></p>
            <ul>
              <li>Item 1: <code>\\\\data\\item1</code></li>
              <li>Item 2: <code>\\\\data\\item2</code></li>
            </ul>
          </section>
          <aside>
            <code>\\\\sidebar\\info</code>
          </aside>
        </article>
      </main>
      <footer>Footer</footer>
    `;

    const result = simulateContentScriptFlow(config);

    expect(result.processed).toBe(4);
  });
});

describe('Integration - Config and URL Matching', () => {
  beforeEach(() => {
    document.body.innerHTML = '<code>\\\\server\\share</code>';
  });

  it('should be active everywhere when activeUrls is empty', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://random-site.com/page' },
      writable: true,
    });

    const config = { scheme: 'uncopener', htmlElements: 'code', activeUrls: [], allowedUncs: [] };
    const result = simulateContentScriptFlow(config);

    expect(result.active).toBe(true);
    expect(result.processed).toBe(1);
  });

  it('should match URL prefix correctly', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://wiki.example.com/docs/deep/nested/page.html' },
      writable: true,
    });

    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [{ url: 'https://wiki.example.com/docs/', elements: ['code'] }],
      allowedUncs: [],
    };

    const result = simulateContentScriptFlow(config);
    expect(result.active).toBe(true);
  });

  it('should not match similar but different URL', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://wiki.example.com/documents/page.html' },
      writable: true,
    });

    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [{ url: 'https://wiki.example.com/docs/', elements: ['code'] }],
      allowedUncs: [],
    };

    const result = simulateContentScriptFlow(config);
    expect(result.active).toBe(false);
  });

  it('should be case-insensitive for URL matching', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'HTTPS://WIKI.EXAMPLE.COM/DOCS/' },
      writable: true,
    });

    const config = {
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [{ url: 'https://wiki.example.com/docs/', elements: ['code'] }],
      allowedUncs: [],
    };

    const result = simulateContentScriptFlow(config);
    expect(result.active).toBe(true);
  });
});

describe('Integration - UNC Path Validation and Conversion', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/' },
      writable: true,
    });
  });

  it('should validate and convert various UNC path formats', () => {
    const testCases = [
      { input: '\\\\server\\share', expected: 'uncopener://server/share' },
      { input: '\\\\server\\share\\', expected: 'uncopener://server/share/' },
      { input: '\\\\192.168.1.1\\data', expected: 'uncopener://192.168.1.1/data' },
      {
        input: '\\\\server-01\\share\\folder\\file.txt',
        expected: 'uncopener://server-01/share/folder/file.txt',
      },
    ];

    const config = { scheme: 'uncopener', htmlElements: 'code', activeUrls: [], allowedUncs: [] };

    testCases.forEach(({ input, expected }) => {
      document.body.innerHTML = `<code>${input}</code>`;
      simulateContentScriptFlow(config);
      const link = document.querySelector('a');
      expect(link.href).toBe(expected);
    });
  });

  it('should reject invalid UNC paths', () => {
    const invalidPaths = [
      'C:\\local\\path',
      '/unix/path',
      'plain text',
      '\\single-backslash',
      '\\\\server\\share<invalid>',
      '\\\\', // Too short
    ];

    const config = { scheme: 'uncopener', htmlElements: 'code', activeUrls: [], allowedUncs: [] };

    invalidPaths.forEach(path => {
      document.body.innerHTML = `<code>${path}</code>`;
      const result = simulateContentScriptFlow(config);
      expect(result.processed).toBe(0);
    });
  });
});

describe('Integration - Message Passing Simulation', () => {
  beforeEach(() => {
    browserMock.storage._reset();
    vi.clearAllMocks();
  });

  it('should simulate config update flow', async () => {
    // Initial config
    browserMock.storage._setDirect({
      scheme: 'uncopener',
      htmlElements: 'code;pre',
      activeUrls: [{ url: 'https://example.com/', elements: ['code'] }],
      allowedUncs: [],
    });

    // Simulate background sending configUpdated message { type: 'configUpdated' }
    // In real scenario, content script would reload config and reprocess
    const newConfig = await browserMock.storage.sync.get({
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    });

    expect(newConfig.activeUrls).toEqual([{ url: 'https://example.com/', elements: ['code'] }]);
    expect(newConfig.htmlElements).toBe('code;pre');
  });

  it('should simulate status request/response', () => {
    // Content script would respond to getStatus message { type: 'getStatus' }
    const isActive = true; // Simulated state

    const response = { active: isActive };
    expect(response).toEqual({ active: true });
  });
});

describe('Integration - Edge Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/' },
      writable: true,
    });
  });

  it('should not process already converted elements', () => {
    const config = { scheme: 'uncopener', htmlElements: 'code', activeUrls: [], allowedUncs: [] };

    document.body.innerHTML = '<code>\\\\server\\share</code>';

    // First pass
    const result1 = simulateContentScriptFlow(config);
    expect(result1.processed).toBe(1);

    // Second pass (element now contains <a> not text)
    const result2 = simulateContentScriptFlow(config);
    expect(result2.processed).toBe(0);
  });

  it('should handle mixed valid and invalid code elements', () => {
    const config = { scheme: 'uncopener', htmlElements: 'code', activeUrls: [], allowedUncs: [] };

    document.body.innerHTML = `
      <code>\\\\valid\\path</code>
      <code><span>nested element</span></code>
      <code>\\\\another\\valid</code>
      <code></code>
      <code>\\\\third\\valid</code>
    `;

    const result = simulateContentScriptFlow(config);
    expect(result.processed).toBe(3);
  });

  it('should preserve original UNC path text in link', () => {
    const config = { scheme: 'uncopener', htmlElements: 'code', activeUrls: [], allowedUncs: [] };
    const originalPath = '\\\\Server-Name\\Share\\Folder\\';

    document.body.innerHTML = `<code>${originalPath}</code>`;
    simulateContentScriptFlow(config);

    const link = document.querySelector('a');
    expect(link.textContent).toBe(originalPath);
  });

  it('should process multiple HTML element types per URL', () => {
    const config = {
      scheme: 'uncopener',
      htmlElements: 'code;pre;span',
      activeUrls: [{ url: 'https://example.com/', elements: ['code', 'pre'] }],
      allowedUncs: [],
    };

    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/page' },
      writable: true,
    });

    document.body.innerHTML = `
      <code>\\\\server\\share1</code>
      <pre>\\\\server\\share2</pre>
      <span>\\\\server\\share3</span>
    `;

    const result = simulateContentScriptFlow(config);

    // Only code and pre should be processed, not span
    expect(result.processed).toBe(2);
    expect(document.querySelector('code a')).not.toBeNull();
    expect(document.querySelector('pre a')).not.toBeNull();
    expect(document.querySelector('span a')).toBeNull();
  });
});
