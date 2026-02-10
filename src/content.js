/**
 * UncClickable Content Script
 * Converts UNC paths in configured HTML elements to clickable links
 *
 * Message Passing API:
 * This script listens for messages from the background script:
 *
 * Incoming messages (from background script):
 * - { type: 'configUpdated' } - Configuration changed, reload and reprocess
 * - { type: 'getStatus' } - Request current status
 *
 * Outgoing responses:
 * - For 'getStatus': { active: boolean } - Whether extension is active on current page
 */

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Will be populated by dynamic import
let getActiveUrlEntry, isUncAllowed, convertUncToUrl, validateCodeElement;

/**
 * Initialize by dynamically importing the utilities module
 */
async function loadModule() {
  const module = await import('/src/utils/unc-matcher.js');
  getActiveUrlEntry = module.getActiveUrlEntry;
  isUncAllowed = module.isUncAllowed;
  convertUncToUrl = module.convertUncToUrl;
  validateCodeElement = module.validateCodeElement;
}

// Configuration state
let config = {
  scheme: 'uncopener',
  htmlElements: 'code',
  activeUrls: [],
  allowedUncs: [],
};

// Track if extension is active on current page and which elements to process
let isActive = false;
let activeElements = [];

/**
 * Load configuration from storage
 */
async function loadConfig() {
  try {
    const result = await api.storage.sync.get({
      scheme: 'uncopener',
      htmlElements: 'code',
      activeUrls: [],
      allowedUncs: [],
    });
    config = result;
  } catch (error) {
    console.error('UncClickable: Failed to load config', error);
  }
}

/**
 * Check if the extension should be active on the current page
 */
function checkIfActive() {
  const currentUrl = window.location.href;
  const entry = getActiveUrlEntry(currentUrl, config.activeUrls, config.htmlElements);

  if (entry) {
    isActive = true;
    activeElements = entry.elements;
  } else {
    isActive = false;
    activeElements = [];
  }

  return isActive;
}

/**
 * Process a single code element
 * @param {Element} codeElement - The code element to process
 * @returns {boolean} - True if element was converted
 */
function processCodeElement(codeElement) {
  const validation = validateCodeElement(codeElement);

  if (!validation.valid) {
    return false;
  }

  const text = validation.text;

  // Check if UNC path is allowed
  if (!isUncAllowed(text, config.allowedUncs)) {
    return false;
  }

  // Convert UNC to URL
  const url = convertUncToUrl(text, config.scheme);

  // Create link element
  const link = document.createElement('a');
  link.href = url;
  link.textContent = text;

  // Replace text node with link
  codeElement.textContent = '';
  codeElement.appendChild(link);

  return true;
}

/**
 * Process all matching elements within a root element
 * @param {Element|Document} root - The root element to search within
 * @returns {number} - Number of elements converted
 */
function processCodeElements(root = document) {
  if (!isActive || activeElements.length === 0) {
    return 0;
  }

  // Build selector from active elements (e.g., "code, pre, span")
  const selector = activeElements.join(', ');
  const elements = root.querySelectorAll(selector);
  let count = 0;

  elements.forEach(element => {
    if (processCodeElement(element)) {
      count++;
    }
  });

  return count;
}

/**
 * Process newly added nodes from MutationObserver
 * @param {Node} node - The added node
 */
function processAddedNode(node) {
  if (!isActive || activeElements.length === 0) {
    return;
  }

  // Skip non-element nodes
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  // If the node itself is one of the active elements, process it
  const tagName = node.tagName?.toLowerCase();
  if (tagName && activeElements.includes(tagName)) {
    processCodeElement(node);
  }

  // Process any matching elements within the added node
  processCodeElements(node);
}

/**
 * Set up MutationObserver for dynamic content
 */
function setupMutationObserver() {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(processAddedNode);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

/**
 * Handle messages from background script
 */
function handleMessage(message, sender, sendResponse) {
  if (message.type === 'configUpdated') {
    // Reload config when settings change
    loadConfig().then(() => {
      const wasActive = isActive;
      checkIfActive();

      // If we just became active, process the page
      if (!wasActive && isActive) {
        processCodeElements();
      }
    });
  } else if (message.type === 'getStatus') {
    sendResponse({ active: isActive });
  }
}

/**
 * Initialize the content script
 */
async function init() {
  // Load the utilities module first
  await loadModule();

  // Load configuration
  await loadConfig();

  // Check if active on this page
  if (!checkIfActive()) {
    // Still set up message listener for config changes
    api.runtime.onMessage.addListener(handleMessage);
    return;
  }

  // Process existing code elements
  processCodeElements();

  // Set up observer for dynamic content
  setupMutationObserver();

  // Listen for messages from background script
  api.runtime.onMessage.addListener(handleMessage);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
