/**
 * UncClickable Content Script
 * Converts UNC paths in <code> elements to clickable links
 */

import {
  isUrlAllowed,
  isUncAllowed,
  convertUncToUrl,
  validateCodeElement,
} from './utils/unc-matcher.js';

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Configuration state
let config = {
  scheme: 'uncopener',
  activeUrls: [],
  allowedUncs: [],
};

// Track if extension is active on current page
let isActive = false;

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
  isActive = isUrlAllowed(currentUrl, config.activeUrls);
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
 * Process all code elements within a root element
 * @param {Element|Document} root - The root element to search within
 * @returns {number} - Number of elements converted
 */
function processCodeElements(root = document) {
  if (!isActive) {
    return 0;
  }

  const codeElements = root.querySelectorAll('code');
  let count = 0;

  codeElements.forEach(element => {
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
  if (!isActive) {
    return;
  }

  // Skip non-element nodes
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  // If the node itself is a code element, process it
  if (node.tagName?.toLowerCase() === 'code') {
    processCodeElement(node);
  }

  // Process any code elements within the added node
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
