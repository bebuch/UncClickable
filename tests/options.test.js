/**
 * Unit Tests for Options Page Script
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { browserMock } from './setup.js';

// Set up DOM elements before importing options.js
function setupOptionsDOM() {
  document.body.innerHTML = `
    <form id="settings-form">
      <input type="text" id="scheme" value="">
      <span id="scheme-preview"></span>
      <input type="text" id="html-elements" value="code">
      <div id="active-urls-list"></div>
      <button type="button" id="add-url-btn">Add URL</button>
      <textarea id="allowed-uncs"></textarea>
      <button type="submit" id="save-btn">Save</button>
      <button type="button" id="reset-btn">Reset</button>
    </form>
    <div id="status" hidden></div>
  `;
}

// Set up DOM before importing the module
setupOptionsDOM();

// Import options module (it will access DOM elements and call init)
const {
  DEFAULTS,
  parseTextareaToArray,
  arrayToTextarea,
  parseHtmlElements,
  htmlElementsToString,
  showStatus,
  loadSettings,
  saveSettings,
  resetSettings,
  updateSchemePreview,
  validateSettings,
} = await import('../options/options.js');

// Wait for initial loadSettings to complete
await new Promise(resolve => setTimeout(resolve, 0));

describe('Options - parseTextareaToArray', () => {
  it('should parse single line', () => {
    const result = parseTextareaToArray('https://example.com/');
    expect(result).toEqual(['https://example.com/']);
  });

  it('should parse multiple lines', () => {
    const result = parseTextareaToArray('https://example.com/\nhttps://other.com/');
    expect(result).toEqual(['https://example.com/', 'https://other.com/']);
  });

  it('should trim whitespace from lines', () => {
    const result = parseTextareaToArray('  https://example.com/  \n  https://other.com/  ');
    expect(result).toEqual(['https://example.com/', 'https://other.com/']);
  });

  it('should filter empty lines', () => {
    const result = parseTextareaToArray('https://example.com/\n\n\nhttps://other.com/');
    expect(result).toEqual(['https://example.com/', 'https://other.com/']);
  });

  it('should return empty array for empty input', () => {
    expect(parseTextareaToArray('')).toEqual([]);
  });

  it('should return empty array for whitespace-only input', () => {
    expect(parseTextareaToArray('   \n   \n   ')).toEqual([]);
  });
});

describe('Options - arrayToTextarea', () => {
  it('should join array with newlines', () => {
    const result = arrayToTextarea(['https://example.com/', 'https://other.com/']);
    expect(result).toBe('https://example.com/\nhttps://other.com/');
  });

  it('should return empty string for empty array', () => {
    expect(arrayToTextarea([])).toBe('');
  });

  it('should handle single item', () => {
    expect(arrayToTextarea(['https://example.com/'])).toBe('https://example.com/');
  });
});

describe('Options - parseHtmlElements', () => {
  it('should parse semicolon-separated elements', () => {
    const result = parseHtmlElements('code;pre;span');
    expect(result).toEqual(['code', 'pre', 'span']);
  });

  it('should trim whitespace from elements', () => {
    const result = parseHtmlElements('  code  ;  pre  ;  span  ');
    expect(result).toEqual(['code', 'pre', 'span']);
  });

  it('should filter empty elements', () => {
    const result = parseHtmlElements('code;;pre;;;span');
    expect(result).toEqual(['code', 'pre', 'span']);
  });

  it('should return empty array for empty input', () => {
    expect(parseHtmlElements('')).toEqual([]);
  });

  it('should convert to lowercase', () => {
    const result = parseHtmlElements('CODE;Pre;SPAN');
    expect(result).toEqual(['code', 'pre', 'span']);
  });

  it('should handle single element', () => {
    expect(parseHtmlElements('code')).toEqual(['code']);
  });
});

describe('Options - htmlElementsToString', () => {
  it('should join array with semicolons', () => {
    const result = htmlElementsToString(['code', 'pre', 'span']);
    expect(result).toBe('code;pre;span');
  });

  it('should return empty string for empty array', () => {
    expect(htmlElementsToString([])).toBe('');
  });

  it('should handle single element', () => {
    expect(htmlElementsToString(['code'])).toBe('code');
  });
});

describe('Options - DEFAULTS', () => {
  it('should have correct default scheme', () => {
    expect(DEFAULTS.scheme).toBe('uncopener');
  });

  it('should have correct default htmlElements', () => {
    expect(DEFAULTS.htmlElements).toBe('code');
  });

  it('should have empty activeUrls array', () => {
    expect(DEFAULTS.activeUrls).toEqual([]);
  });

  it('should have empty allowedUncs array', () => {
    expect(DEFAULTS.allowedUncs).toEqual([]);
  });
});

describe('Options - showStatus', () => {
  beforeEach(() => {
    setupOptionsDOM();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show success message', () => {
    showStatus('Settings saved!', 'success');

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('Settings saved!');
    expect(statusEl.className).toBe('status success');
    expect(statusEl.hidden).toBe(false);
  });

  it('should show error message', () => {
    showStatus('Failed to save', 'error');

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('Failed to save');
    expect(statusEl.className).toBe('status error');
    expect(statusEl.hidden).toBe(false);
  });

  it('should default to success type', () => {
    showStatus('Message');

    const statusEl = document.getElementById('status');
    expect(statusEl.className).toBe('status success');
  });

  it('should auto-hide after 3 seconds', () => {
    showStatus('Message');

    const statusEl = document.getElementById('status');
    expect(statusEl.hidden).toBe(false);

    vi.advanceTimersByTime(3000);
    expect(statusEl.hidden).toBe(true);
  });
});

describe('Options - updateSchemePreview', () => {
  beforeEach(() => {
    setupOptionsDOM();
  });

  it('should update preview with scheme value', () => {
    const schemeInput = document.getElementById('scheme');
    schemeInput.value = 'myscheme';

    updateSchemePreview();

    const preview = document.getElementById('scheme-preview');
    expect(preview.textContent).toBe('myscheme');
  });

  it('should use default when scheme is empty', () => {
    const schemeInput = document.getElementById('scheme');
    schemeInput.value = '';

    updateSchemePreview();

    const preview = document.getElementById('scheme-preview');
    expect(preview.textContent).toBe('uncopener');
  });

  it('should trim whitespace', () => {
    const schemeInput = document.getElementById('scheme');
    schemeInput.value = '  customscheme  ';

    updateSchemePreview();

    const preview = document.getElementById('scheme-preview');
    expect(preview.textContent).toBe('customscheme');
  });
});

describe('Options - loadSettings', () => {
  beforeEach(() => {
    setupOptionsDOM();
    browserMock.storage._reset();
    vi.clearAllMocks();
  });

  it('should populate form with stored values', async () => {
    browserMock.storage._setDirect({
      scheme: 'myscheme',
      htmlElements: 'code;pre;span',
      activeUrls: [
        { url: 'https://example.com/', elements: ['code', 'pre'] },
        { url: 'https://other.com/', elements: ['span'] },
      ],
      allowedUncs: ['\\\\server1\\', '\\\\server2\\'],
    });

    await loadSettings();

    expect(document.getElementById('scheme').value).toBe('myscheme');
    expect(document.getElementById('html-elements').value).toBe('code;pre;span');
    expect(document.getElementById('allowed-uncs').value).toBe('\\\\server1\\\n\\\\server2\\');

    // Check URL list is rendered
    const urlRows = document.querySelectorAll('.url-row');
    expect(urlRows.length).toBe(2);
  });

  it('should use defaults when storage is empty', async () => {
    await loadSettings();

    expect(document.getElementById('scheme').value).toBe('uncopener');
    expect(document.getElementById('html-elements').value).toBe('code');
    expect(document.getElementById('allowed-uncs').value).toBe('');

    const urlRows = document.querySelectorAll('.url-row');
    expect(urlRows.length).toBe(0);
  });

  it('should update scheme preview', async () => {
    browserMock.storage._setDirect({ scheme: 'testscheme' });

    await loadSettings();

    expect(document.getElementById('scheme-preview').textContent).toBe('testscheme');
  });

  it('should show error on storage failure', async () => {
    browserMock.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();

    await loadSettings();

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('Failed to load settings');
    expect(statusEl.className).toBe('status error');

    consoleSpy.mockRestore();
    vi.useRealTimers();
  });
});

describe('Options - saveSettings', () => {
  beforeEach(() => {
    setupOptionsDOM();
    browserMock.storage._reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save form values to storage', async () => {
    document.getElementById('scheme').value = 'myscheme';
    document.getElementById('html-elements').value = 'code;pre';
    document.getElementById('allowed-uncs').value = '\\\\server\\share\\';

    // Add a URL row manually
    const container = document.getElementById('active-urls-list');
    container.innerHTML = `
      <div class="url-row">
        <input class="url-input" value="https://example.com/">
        <div class="element-checkboxes">
          <label><input type="checkbox" value="code" checked>code</label>
          <label><input type="checkbox" value="pre">pre</label>
        </div>
      </div>
    `;

    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(browserMock.storage.sync.set).toHaveBeenCalledWith({
      scheme: 'myscheme',
      htmlElements: 'code;pre',
      activeUrls: [{ url: 'https://example.com/', elements: ['code'] }],
      allowedUncs: ['\\\\server\\share\\'],
    });
  });

  it('should use default scheme when empty', async () => {
    document.getElementById('scheme').value = '';
    document.getElementById('html-elements').value = 'code';
    document.getElementById('allowed-uncs').value = '';

    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    expect(browserMock.storage.sync.set).toHaveBeenCalledWith({
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    });
  });

  it('should show success message on save', async () => {
    document.getElementById('scheme').value = 'test';
    document.getElementById('html-elements').value = 'code';
    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('Settings saved successfully!');
    expect(statusEl.className).toBe('status success');
  });

  it('should show error when htmlElements is empty', async () => {
    document.getElementById('scheme').value = 'test';
    document.getElementById('html-elements').value = '';

    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('HTML elements cannot be empty');
    expect(statusEl.className).toBe('status error');
    expect(browserMock.storage.sync.set).not.toHaveBeenCalled();
  });

  it('should show error when URL has no elements selected', async () => {
    document.getElementById('scheme').value = 'test';
    document.getElementById('html-elements').value = 'code;pre';

    // Add a URL row with no checkboxes checked
    const container = document.getElementById('active-urls-list');
    container.innerHTML = `
      <div class="url-row">
        <input class="url-input" value="https://example.com/">
        <div class="element-checkboxes">
          <label><input type="checkbox" value="code">code</label>
          <label><input type="checkbox" value="pre">pre</label>
        </div>
      </div>
    `;

    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toContain('must have at least one element selected');
    expect(statusEl.className).toBe('status error');
    expect(browserMock.storage.sync.set).not.toHaveBeenCalled();
  });

  it('should show error on storage failure', async () => {
    browserMock.storage.sync.set.mockRejectedValueOnce(new Error('Storage error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    document.getElementById('scheme').value = 'test';
    document.getElementById('html-elements').value = 'code';
    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('Failed to save settings');
    expect(statusEl.className).toBe('status error');

    consoleSpy.mockRestore();
  });

  it('should trim scheme whitespace', async () => {
    document.getElementById('scheme').value = '  spacedscheme  ';
    document.getElementById('html-elements').value = 'code';
    document.getElementById('allowed-uncs').value = '';

    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    expect(browserMock.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ scheme: 'spacedscheme' })
    );
  });

  it('should filter out empty URLs on save', async () => {
    document.getElementById('scheme').value = 'test';
    document.getElementById('html-elements').value = 'code';

    // Add a URL row with empty URL
    const container = document.getElementById('active-urls-list');
    container.innerHTML = `
      <div class="url-row">
        <input class="url-input" value="">
        <div class="element-checkboxes">
          <label><input type="checkbox" value="code" checked>code</label>
        </div>
      </div>
    `;

    const event = { preventDefault: vi.fn() };
    await saveSettings(event);

    expect(browserMock.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeUrls: [] })
    );
  });
});

describe('Options - resetSettings', () => {
  beforeEach(() => {
    setupOptionsDOM();
    browserMock.storage._reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should ask for confirmation', async () => {
    await resetSettings();

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to reset all settings to defaults?'
    );
  });

  it('should reset storage to defaults when confirmed', async () => {
    await resetSettings();

    expect(browserMock.storage.sync.set).toHaveBeenCalledWith(DEFAULTS);
  });

  it('should reload settings after reset', async () => {
    document.getElementById('scheme').value = 'custom';
    document.getElementById('html-elements').value = 'div;span';

    await resetSettings();

    // After reset, the form should show default values
    expect(document.getElementById('scheme').value).toBe('uncopener');
    expect(document.getElementById('html-elements').value).toBe('code');
  });

  it('should show success message', async () => {
    await resetSettings();

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('Settings reset to defaults');
  });

  it('should not reset when cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    await resetSettings();

    expect(browserMock.storage.sync.set).not.toHaveBeenCalled();
  });

  it('should show error on storage failure', async () => {
    browserMock.storage.sync.set.mockRejectedValueOnce(new Error('Storage error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await resetSettings();

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toBe('Failed to reset settings');
    expect(statusEl.className).toBe('status error');

    consoleSpy.mockRestore();
  });
});

describe('Options - validateSettings', () => {
  beforeEach(() => {
    setupOptionsDOM();
  });

  it('should return valid for correct settings', () => {
    document.getElementById('html-elements').value = 'code;pre';

    const result = validateSettings();
    expect(result.valid).toBe(true);
  });

  it('should return invalid when htmlElements is empty', () => {
    document.getElementById('html-elements').value = '';

    const result = validateSettings();
    expect(result.valid).toBe(false);
    expect(result.error).toBe('HTML elements cannot be empty');
  });

  it('should return invalid when URL has no elements selected', () => {
    document.getElementById('html-elements').value = 'code;pre';

    // Add a URL row with no checkboxes checked
    const container = document.getElementById('active-urls-list');
    container.innerHTML = `
      <div class="url-row">
        <input class="url-input" value="https://example.com/">
        <div class="element-checkboxes">
          <label><input type="checkbox" value="code">code</label>
          <label><input type="checkbox" value="pre">pre</label>
        </div>
      </div>
    `;

    const result = validateSettings();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must have at least one element selected');
  });

  it('should allow empty URL with no elements (will be filtered on save)', () => {
    document.getElementById('html-elements').value = 'code';

    // Add a URL row with empty URL and no checkbox - this is allowed
    const container = document.getElementById('active-urls-list');
    container.innerHTML = `
      <div class="url-row">
        <input class="url-input" value="">
        <div class="element-checkboxes">
          <label><input type="checkbox" value="code">code</label>
        </div>
      </div>
    `;

    const result = validateSettings();
    expect(result.valid).toBe(true);
  });
});
