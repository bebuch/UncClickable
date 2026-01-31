/**
 * UNC path matching and conversion utilities
 * 
 * Functions are defined globally for browser content script compatibility.
 * For tests, these are exported via module.exports (CommonJS).
 */

// Forbidden characters in Windows file system paths
const FORBIDDEN_CHARS_REGEX = /[<>:"|?*\x00-\x1F]/;
const NEWLINE_REGEX = /[\r\n]/;

/**
 * Check if a URL is allowed based on configured URL prefixes
 * @param {string} currentUrl - The current page URL
 * @param {string[]} allowedUrls - Array of allowed URL prefixes
 * @returns {boolean} - True if URL is allowed (or no restrictions configured)
 */
function isUrlAllowed(currentUrl, allowedUrls) {
  if (!allowedUrls || allowedUrls.length === 0) {
    return true;
  }
  const currentLower = currentUrl.toLowerCase();
  return allowedUrls.some(allowedUrl => {
    const allowedLower = allowedUrl.toLowerCase();
    return currentLower.startsWith(allowedLower);
  });
}

/**
 * Check if a UNC path is allowed based on configured UNC prefixes
 * @param {string} uncPath - The UNC path to check
 * @param {string[]} allowedPrefixes - Array of allowed UNC prefixes
 * @returns {boolean} - True if UNC is allowed (or no restrictions configured)
 */
function isUncAllowed(uncPath, allowedPrefixes) {
  if (!allowedPrefixes || allowedPrefixes.length === 0) {
    return true;
  }
  const uncLower = uncPath.toLowerCase();
  return allowedPrefixes.some(prefix => {
    const prefixLower = prefix.toLowerCase();
    if (uncLower === prefixLower) {
      return true;
    }
    if (prefixLower.endsWith('\\')) {
      return uncLower.startsWith(prefixLower);
    }
    return uncLower.startsWith(prefixLower);
  });
}

/**
 * Validate if a string is a valid UNC path
 * @param {string} text - The text to validate
 * @returns {boolean} - True if valid UNC path format
 */
function isValidUncPath(text) {
  if (!text || text.length < 3 || text.length > 260) {
    return false;
  }
  if (!text.startsWith('\\\\')) {
    return false;
  }
  if (NEWLINE_REGEX.test(text)) {
    return false;
  }
  const pathPart = text.substring(2);
  if (FORBIDDEN_CHARS_REGEX.test(pathPart)) {
    return false;
  }
  return true;
}

/**
 * Convert a UNC path to a custom URL scheme link
 * @param {string} uncPath - The UNC path (e.g., "\\server\share\folder\")
 * @param {string} scheme - The URL scheme to use (e.g., "uncopener")
 * @returns {string} - The URL (e.g., "uncopener://server/share/folder/")
 */
function convertUncToUrl(uncPath, scheme) {
  const pathPart = uncPath.substring(2).replace(/\\/g, '/');
  return `${scheme}://${pathPart}`;
}

/**
 * Check if an element or any ancestor is editable
 * @param {Element} element - The DOM element to check
 * @returns {boolean} - True if element or ancestor is editable
 */
function isElementEditable(element) {
  let current = element;
  while (current && current !== document.body) {
    if (current.isContentEditable) {
      return true;
    }
    const tagName = current.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') {
      return true;
    }
    const contentEditable = current.getAttribute?.('contenteditable');
    if (contentEditable === 'true' || contentEditable === '') {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

/**
 * Check if a code element is a valid candidate for UNC conversion
 * @param {Element} element - The code element to check
 * @returns {{valid: boolean, text?: string}} - Validation result with text if valid
 */
function validateCodeElement(element) {
  if (isElementEditable(element)) {
    return { valid: false };
  }
  if (element.childNodes.length !== 1) {
    return { valid: false };
  }
  const child = element.childNodes[0];
  if (child.nodeType !== Node.TEXT_NODE) {
    return { valid: false };
  }
  const text = child.textContent;
  if (!isValidUncPath(text)) {
    return { valid: false };
  }
  return { valid: true, text };
}

// Export for Node.js/test environment (ignored in browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isUrlAllowed,
    isUncAllowed,
    isValidUncPath,
    convertUncToUrl,
    isElementEditable,
    validateCodeElement,
  };
}
