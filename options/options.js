/**
 * UncClickable Options Page Script
 */

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Default configuration
const DEFAULTS = {
  scheme: 'uncopener',
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
    activeUrlsInput: document.getElementById('active-urls'),
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
  const { schemeInput, activeUrlsInput, allowedUncsInput } = getElements();

  try {
    const config = await api.storage.sync.get(DEFAULTS);

    schemeInput.value = config.scheme || DEFAULTS.scheme;
    activeUrlsInput.value = arrayToTextarea(config.activeUrls || []);
    allowedUncsInput.value = arrayToTextarea(config.allowedUncs || []);

    // Update preview
    updateSchemePreview();
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(event) {
  event.preventDefault();

  const { schemeInput, activeUrlsInput, allowedUncsInput } = getElements();

  const config = {
    scheme: schemeInput.value.trim() || DEFAULTS.scheme,
    activeUrls: parseTextareaToArray(activeUrlsInput.value),
    allowedUncs: parseTextareaToArray(allowedUncsInput.value),
  };

  try {
    await api.storage.sync.set(config);
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
  const { form, resetBtn, schemeInput } = getElements();

  form.addEventListener('submit', saveSettings);
  resetBtn.addEventListener('click', resetSettings);
  schemeInput.addEventListener('input', updateSchemePreview);
}

// Initialize on page load
initEventListeners();
loadSettings();

// Export for testing
export {
  DEFAULTS,
  parseTextareaToArray,
  arrayToTextarea,
  showStatus,
  loadSettings,
  saveSettings,
  resetSettings,
  updateSchemePreview,
};
