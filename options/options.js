/**
 * UncClickable Options Page Script
 */

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Default configuration
const DEFAULTS = {
  scheme: 'uncopener',
  htmlElements: 'code',
  activeUrls: [],
  allowedUncs: [],
};

/**
 * Get DOM elements (fetched fresh to support testing)
 */
function getElements() {
  return {
    form: document.getElementById('settings-form'),
    schemeInput: document.getElementById('scheme'),
    schemePreview: document.getElementById('scheme-preview'),
    htmlElementsInput: document.getElementById('html-elements'),
    activeUrlsContainer: document.getElementById('active-urls-list'),
    addUrlBtn: document.getElementById('add-url-btn'),
    allowedUncsInput: document.getElementById('allowed-uncs'),
    saveBtn: document.getElementById('save-btn'),
    resetBtn: document.getElementById('reset-btn'),
    statusEl: document.getElementById('status'),
  };
}

/**
 * Parse textarea content into array of non-empty lines
 * @param {string} text - Textarea content
 * @returns {string[]} - Array of trimmed, non-empty lines
 */
function parseTextareaToArray(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Convert array to textarea content
 * @param {string[]} arr - Array of strings
 * @returns {string} - Newline-separated string
 */
function arrayToTextarea(arr) {
  return arr.join('\n');
}

/**
 * Parse semicolon-separated HTML elements string
 * @param {string} text - Semicolon-separated elements (e.g., "code;pre;span")
 * @returns {string[]} - Array of trimmed, non-empty, lowercase element names
 */
function parseHtmlElements(text) {
  return text
    .split(';')
    .map(el => el.trim().toLowerCase())
    .filter(el => el.length > 0);
}

/**
 * Convert HTML elements array to semicolon-separated string
 * @param {string[]} arr - Array of element names
 * @returns {string} - Semicolon-separated string
 */
function htmlElementsToString(arr) {
  return arr.join(';');
}

// In-memory state for active URLs
let activeUrlsState = [];

/**
 * Get current HTML elements from input
 * @returns {string[]} - Array of element names
 */
function getCurrentHtmlElements() {
  const { htmlElementsInput } = getElements();
  return parseHtmlElements(htmlElementsInput.value);
}

/**
 * Create a URL row element
 * @param {string} url - The URL
 * @param {string[]} selectedElements - Elements selected for this URL
 * @param {number} index - Row index
 * @returns {HTMLElement} - The row element
 */
function createUrlRow(url, selectedElements, index) {
  const row = document.createElement('div');
  row.className = 'url-row';
  row.dataset.index = index;

  // Header row with URL input and delete button
  const header = document.createElement('div');
  header.className = 'url-row-header';

  // URL input
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'url-input';
  urlInput.value = url;
  urlInput.placeholder = 'https://example.com/';
  header.appendChild(urlInput);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = '×';
  deleteBtn.title = 'Remove URL';
  deleteBtn.addEventListener('click', () => removeUrlRow(index));
  header.appendChild(deleteBtn);

  row.appendChild(header);

  // Element checkboxes container
  const checkboxContainer = document.createElement('div');
  checkboxContainer.className = 'element-checkboxes';

  const htmlElements = getCurrentHtmlElements();
  htmlElements.forEach(el => {
    const label = document.createElement('label');
    label.className = 'element-checkbox';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = el;
    checkbox.checked = selectedElements.includes(el);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(el));
    checkboxContainer.appendChild(label);
  });

  row.appendChild(checkboxContainer);

  return row;
}

/**
 * Render the URL list from state
 */
function renderUrlList() {
  const { activeUrlsContainer } = getElements();
  activeUrlsContainer.innerHTML = '';

  activeUrlsState.forEach((entry, index) => {
    const row = createUrlRow(entry.url, entry.elements, index);
    activeUrlsContainer.appendChild(row);
  });
}

/**
 * Add a new URL row
 */
function addUrlRow() {
  const htmlElements = getCurrentHtmlElements();
  if (htmlElements.length === 0) {
    showStatus('Please configure HTML elements first', 'error');
    return;
  }

  // New row with first element checked
  activeUrlsState.push({
    url: '',
    elements: [htmlElements[0]],
  });
  renderUrlList();
}

/**
 * Remove a URL row
 * @param {number} index - Row index to remove
 */
function removeUrlRow(index) {
  activeUrlsState.splice(index, 1);
  renderUrlList();
}

/**
 * Read URL list state from DOM
 * @returns {{url: string, elements: string[]}[]} - Array of URL entries
 */
function readUrlListFromDom() {
  const { activeUrlsContainer } = getElements();
  const rows = activeUrlsContainer.querySelectorAll('.url-row');
  const result = [];

  rows.forEach(row => {
    const url = row.querySelector('.url-input').value.trim();
    const checkboxes = row.querySelectorAll('.element-checkboxes input[type="checkbox"]:checked');
    const elements = Array.from(checkboxes).map(cb => cb.value);

    result.push({ url, elements });
  });

  return result;
}

/**
 * Handle HTML elements input change - re-render URL list with updated checkboxes
 */
function handleHtmlElementsChange() {
  // Read current state from DOM before re-rendering
  activeUrlsState = readUrlListFromDom();

  // Filter out elements that no longer exist in the global list
  const validElements = getCurrentHtmlElements();
  activeUrlsState = activeUrlsState.map(entry => ({
    url: entry.url,
    elements: entry.elements.filter(el => validElements.includes(el)),
  }));

  // If any entry now has no elements, select the first available
  activeUrlsState = activeUrlsState.map(entry => {
    if (entry.elements.length === 0 && validElements.length > 0) {
      return { url: entry.url, elements: [validElements[0]] };
    }
    return entry;
  });

  renderUrlList();
}

/**
 * Show status message
 * @param {string} message - Message to show
 * @param {string} type - 'success' or 'error'
 */
function showStatus(message, type = 'success') {
  const { statusEl } = getElements();
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.hidden = false;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusEl.hidden = true;
  }, 3000);
}

/**
 * Load settings from storage and populate form
 */
async function loadSettings() {
  const { schemeInput, htmlElementsInput, allowedUncsInput } = getElements();

  try {
    const config = await api.storage.sync.get(DEFAULTS);

    schemeInput.value = config.scheme || DEFAULTS.scheme;
    htmlElementsInput.value = config.htmlElements || DEFAULTS.htmlElements;
    activeUrlsState = config.activeUrls || [];
    allowedUncsInput.value = arrayToTextarea(config.allowedUncs || []);

    // Render URL list
    renderUrlList();

    // Update preview
    updateSchemePreview();
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

/**
 * Validate settings before saving
 * @returns {{valid: boolean, error?: string}}
 */
function validateSettings() {
  const htmlElements = getCurrentHtmlElements();

  // HTML elements must not be empty
  if (htmlElements.length === 0) {
    return { valid: false, error: 'HTML elements cannot be empty' };
  }

  // Read URL list from DOM
  const urlList = readUrlListFromDom();

  // Each URL entry with a non-empty URL must have at least one element checked
  for (const entry of urlList) {
    if (entry.url && entry.elements.length === 0) {
      return { valid: false, error: `URL "${entry.url}" must have at least one element selected` };
    }
  }

  return { valid: true };
}

/**
 * Save settings to storage
 */
async function saveSettings(event) {
  event.preventDefault();

  // Validate before saving
  const validation = validateSettings();
  if (!validation.valid) {
    showStatus(validation.error, 'error');
    return;
  }

  const { schemeInput, htmlElementsInput, allowedUncsInput } = getElements();
  const htmlElements = getCurrentHtmlElements();

  // Read and clean URL list - filter out empty URLs and stale elements
  const urlList = readUrlListFromDom()
    .filter(entry => entry.url.length > 0)
    .map(entry => ({
      url: entry.url,
      elements: entry.elements.filter(el => htmlElements.includes(el)),
    }));

  const config = {
    scheme: schemeInput.value.trim() || DEFAULTS.scheme,
    htmlElements: htmlElementsToString(htmlElements),
    activeUrls: urlList,
    allowedUncs: parseTextareaToArray(allowedUncsInput.value),
  };

  try {
    await api.storage.sync.set(config);
    // Update in-memory state to match saved
    activeUrlsState = urlList;
    renderUrlList();
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  try {
    await api.storage.sync.set(DEFAULTS);
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus('Failed to reset settings', 'error');
  }
}

/**
 * Update the scheme preview in the example
 */
function updateSchemePreview() {
  const { schemeInput, schemePreview } = getElements();
  const scheme = schemeInput.value.trim() || DEFAULTS.scheme;
  schemePreview.textContent = scheme;
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  const { form, resetBtn, schemeInput, htmlElementsInput, addUrlBtn } = getElements();

  form.addEventListener('submit', saveSettings);
  resetBtn.addEventListener('click', resetSettings);
  schemeInput.addEventListener('input', updateSchemePreview);
  htmlElementsInput.addEventListener('input', handleHtmlElementsChange);
  addUrlBtn.addEventListener('click', addUrlRow);
}

// Initialize on page load
initEventListeners();
loadSettings();

// Export for testing
export {
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
  addUrlRow,
  renderUrlList,
  readUrlListFromDom,
};
