/**
 * Unit Tests for Content Script
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isUrlAllowed,
  isUncAllowed,
  convertUncToUrl,
  validateCodeElement,
} from '../src/utils/unc-matcher.cjs';

/**
 * Helper to create a code element with text
 */
function createCodeElement(text) {
  const code = document.createElement('code');
  code.textContent = text;
  document.body.appendChild(code);
  return code;
}

/**
 * Simulates the core logic of processCodeElement from content.js
 * We test this separately to avoid module import side effects
 */
function processCodeElement(element, config) {
  const validation = validateCodeElement(element);
  
  if (!validation.valid) {
    return false;
  }

  const text = validation.text;

  if (!isUncAllowed(text, config.allowedUncs)) {
    return false;
  }

  const url = convertUncToUrl(text, config.scheme);

  const link = document.createElement('a');
  link.href = url;
  link.textContent = text;

  element.textContent = '';
  element.appendChild(link);

  return true;
}

/**
 * Process all code elements in a container
 */
function processCodeElements(root, config) {
  if (!isUrlAllowed(window.location.href, config.activeUrls)) {
    return 0;
  }

  const elements = root.querySelectorAll('code');
  let count = 0;

  elements.forEach(element => {
    if (processCodeElement(element, config)) {
      count++;
    }
  });

  return count;
}

describe('Content Script - processCodeElement', () => {
  const defaultConfig = {
    scheme: 'uncopener',
    activeUrls: [],
    allowedUncs: [],
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should convert valid UNC path to link', () => {
    const code = createCodeElement('\\\\server\\share\\file.txt');
    const result = processCodeElement(code, defaultConfig);

    expect(result).toBe(true);
    
    const link = code.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toBe('uncopener://server/share/file.txt');
    expect(link.textContent).toBe('\\\\server\\share\\file.txt');
  });

  it('should use custom scheme', () => {
    const code = createCodeElement('\\\\server\\share');
    processCodeElement(code, { ...defaultConfig, scheme: 'myscheme' });

    const link = code.querySelector('a');
    expect(link.href).toBe('myscheme://server/share');
  });

  it('should not convert non-UNC text', () => {
    const code = createCodeElement('just some text');
    const result = processCodeElement(code, defaultConfig);

    expect(result).toBe(false);
    expect(code.querySelector('a')).toBeNull();
    expect(code.textContent).toBe('just some text');
  });

  it('should not convert disallowed UNC paths', () => {
    const config = {
      ...defaultConfig,
      allowedUncs: ['\\\\allowed-server\\'],
    };
    
    const code = createCodeElement('\\\\other-server\\share');
    const result = processCodeElement(code, config);

    expect(result).toBe(false);
    expect(code.querySelector('a')).toBeNull();
  });

  it('should convert allowed UNC paths', () => {
    const config = {
      ...defaultConfig,
      allowedUncs: ['\\\\allowed-server\\'],
    };
    
    const code = createCodeElement('\\\\allowed-server\\share\\file.txt');
    const result = processCodeElement(code, config);

    expect(result).toBe(true);
    expect(code.querySelector('a')).not.toBeNull();
  });

  it('should preserve original text in link', () => {
    const code = createCodeElement('\\\\SERVER\\Share\\');
    processCodeElement(code, defaultConfig);

    const link = code.querySelector('a');
    expect(link.textContent).toBe('\\\\SERVER\\Share\\');
  });
});

describe('Content Script - processCodeElements', () => {
  const defaultConfig = {
    scheme: 'uncopener',
    activeUrls: [],
    allowedUncs: [],
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/page' },
      writable: true,
    });
  });

  it('should process multiple code elements', () => {
    document.body.innerHTML = `
      <code>\\\\server1\\share</code>
      <code>\\\\server2\\data\\file.txt</code>
      <code>not a UNC</code>
    `;

    const count = processCodeElements(document, defaultConfig);

    expect(count).toBe(2);
    
    const links = document.querySelectorAll('a');
    expect(links.length).toBe(2);
  });

  it('should not process when URL is not allowed', () => {
    const config = {
      ...defaultConfig,
      activeUrls: ['https://allowed.com/'],
    };

    document.body.innerHTML = '<code>\\\\server\\share</code>';
    
    const count = processCodeElements(document, config);

    expect(count).toBe(0);
    expect(document.querySelector('a')).toBeNull();
  });

  it('should process when URL is allowed', () => {
    const config = {
      ...defaultConfig,
      activeUrls: ['https://example.com/'],
    };

    document.body.innerHTML = '<code>\\\\server\\share</code>';
    
    const count = processCodeElements(document, config);

    expect(count).toBe(1);
    expect(document.querySelector('a')).not.toBeNull();
  });

  it('should process code elements within container', () => {
    document.body.innerHTML = `
      <div id="container">
        <code>\\\\server\\share</code>
      </div>
      <code>\\\\other\\share</code>
    `;

    const container = document.getElementById('container');
    const count = processCodeElements(container, defaultConfig);

    expect(count).toBe(1);
    
    // Only the one inside container should be converted
    expect(container.querySelector('a')).not.toBeNull();
  });
});

describe('Content Script - Dynamic Content (MutationObserver simulation)', () => {
  const defaultConfig = {
    scheme: 'uncopener',
    activeUrls: [],
    allowedUncs: [],
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/' },
      writable: true,
    });
  });

  it('should process dynamically added code elements', () => {
    // Initial state - no code elements
    expect(document.querySelectorAll('code').length).toBe(0);

    // Simulate dynamic content addition
    const newDiv = document.createElement('div');
    newDiv.innerHTML = '<code>\\\\server\\share</code>';
    document.body.appendChild(newDiv);

    // Process the newly added container
    processCodeElements(newDiv, defaultConfig);

    const link = newDiv.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toBe('uncopener://server/share');
  });

  it('should handle nested dynamically added content', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <article>
        <section>
          <code>\\\\deep\\nested\\path</code>
        </section>
      </article>
    `;
    document.body.appendChild(container);

    processCodeElements(container, defaultConfig);

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toBe('uncopener://deep/nested/path');
  });
});

describe('Content Script - Edge Cases', () => {
  const defaultConfig = {
    scheme: 'uncopener',
    activeUrls: [],
    allowedUncs: [],
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should not convert code element that was already converted', () => {
    // First conversion
    const code = createCodeElement('\\\\server\\share');
    processCodeElement(code, defaultConfig);

    // Second attempt - should fail because child is now <a>, not text node
    const result = processCodeElement(code, defaultConfig);
    expect(result).toBe(false);

    // Should still have exactly one link
    const links = code.querySelectorAll('a');
    expect(links.length).toBe(1);
  });

  it('should handle special characters in path', () => {
    const code = createCodeElement('\\\\server\\share with spaces\\file (1).txt');
    processCodeElement(code, defaultConfig);

    const link = code.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.textContent).toBe('\\\\server\\share with spaces\\file (1).txt');
  });

  it('should handle minimum valid UNC path', () => {
    const code = createCodeElement('\\\\s'); // 3 chars minimum
    processCodeElement(code, defaultConfig);

    const link = code.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toBe('uncopener://s');
  });

  it('should reject path at exactly 261 characters', () => {
    const longPath = '\\\\' + 'a'.repeat(259); // 261 chars total
    const code = createCodeElement(longPath);
    const result = processCodeElement(code, defaultConfig);

    expect(result).toBe(false);
    expect(code.querySelector('a')).toBeNull();
  });

  it('should accept path at exactly 260 characters', () => {
    const longPath = '\\\\' + 'a'.repeat(258); // 260 chars total
    const code = createCodeElement(longPath);
    const result = processCodeElement(code, defaultConfig);

    expect(result).toBe(true);
    expect(code.querySelector('a')).not.toBeNull();
  });
});

describe('Content Script - GitHub README HTML Structure (from test.html)', () => {
  const defaultConfig = {
    scheme: 'uncopener',
    activeUrls: [],
    allowedUncs: [],
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://github.com/bebuch/first-repo' },
      writable: true,
    });
  });

  it('should convert UNC paths with hyphens in server name (Data-1)', () => {
    // This is the exact HTML structure from the GitHub README
    document.body.innerHTML = `
      <article class="markdown-body entry-content container-lg" itemprop="text">
        <p dir="auto">This is not my first Git repositrory ;-)</p>
        <ul dir="auto">
          <li><code>\\\\Data-1\\userstmp\\Benjamin_Buch\\X.txt</code></li>
          <li><code>\\\\Data-1\\userstmp\\Benjamin_Buch</code></li>
        </ul>
      </article>
    `;

    const count = processCodeElements(document, defaultConfig);

    expect(count).toBe(2);

    const links = document.querySelectorAll('a');
    expect(links.length).toBe(2);

    // Check first link
    expect(links[0].href).toBe('uncopener://Data-1/userstmp/Benjamin_Buch/X.txt');
    expect(links[0].textContent).toBe('\\\\Data-1\\userstmp\\Benjamin_Buch\\X.txt');

    // Check second link
    expect(links[1].href).toBe('uncopener://Data-1/userstmp/Benjamin_Buch');
    expect(links[1].textContent).toBe('\\\\Data-1\\userstmp\\Benjamin_Buch');
  });

  it('should handle code elements inside list items', () => {
    document.body.innerHTML = `
      <ul>
        <li><code>\\\\server\\share\\file.txt</code></li>
      </ul>
    `;

    const count = processCodeElements(document, defaultConfig);
    expect(count).toBe(1);
  });

  it('should validate the exact UNC path from test.html', () => {
    const code = createCodeElement('\\\\Data-1\\userstmp\\Benjamin_Buch\\X.txt');
    const result = processCodeElement(code, defaultConfig);

    expect(result).toBe(true);
    
    const link = code.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toBe('uncopener://Data-1/userstmp/Benjamin_Buch/X.txt');
  });

  it('should work with configured activeUrls for github.com', () => {
    const config = {
      ...defaultConfig,
      activeUrls: ['https://github.com'],
    };

    document.body.innerHTML = '<code>\\\\Data-1\\userstmp\\Benjamin_Buch\\X.txt</code>';
    
    const count = processCodeElements(document, config);

    expect(count).toBe(1);
    expect(document.querySelector('a')).not.toBeNull();
  });

  it('should work with configured allowedUncs prefix', () => {
    const config = {
      ...defaultConfig,
      allowedUncs: ['\\\\Data-1\\'],
    };

    document.body.innerHTML = '<code>\\\\Data-1\\userstmp\\Benjamin_Buch\\X.txt</code>';
    
    const count = processCodeElements(document, config);

    expect(count).toBe(1);
  });

  it('should reject UNC when allowedUncs does not match', () => {
    const config = {
      ...defaultConfig,
      allowedUncs: ['\\\\Other-Server\\'],
    };

    document.body.innerHTML = '<code>\\\\Data-1\\userstmp\\Benjamin_Buch\\X.txt</code>';
    
    const count = processCodeElements(document, config);

    expect(count).toBe(0);
  });
});
