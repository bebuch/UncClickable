/**
 * UNC path matching and conversion utilities
 */

// Forbidden characters in Windows file system paths
// Includes: < > : " | ? * and control characters (0-31)
const FORBIDDEN_CHARS_REGEX = /[<>:"|?*\x00-\x1F]/;

// Newline characters
const NEWLINE_REGEX = /[\r\n]/;

/**
 * Check if a URL is allowed based on configured URL prefixes
 * @param {string} currentUrl - The current page URL
 * @param {string[]} allowedUrls - Array of allowed URL prefixes
 * @returns {boolean} - True if URL is allowed (or no restrictions configured)
 */
export function isUrlAllowed(currentUrl, allowedUrls) {
  // Empty list means all URLs are allowed
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
export function isUncAllowed(uncPath, allowedPrefixes) {
  // Empty list means all UNCs are allowed
  if (!allowedPrefixes || allowedPrefixes.length === 0) {
    return true;
  }

  const uncLower = uncPath.toLowerCase();
  
  return allowedPrefixes.some(prefix => {
    const prefixLower = prefix.toLowerCase();
    
    // Exact match
    if (uncLower === prefixLower) {
      return true;
    }
    
    // If prefix ends with backslash, require exact directory match
    // e.g., prefix "\\server\share\" should match "\\server\share\file" but not "\\server\sharefile"
    if (prefixLower.endsWith('\\')) {
      return uncLower.startsWith(prefixLower);
    }
    
    // Without trailing backslash, allow prefix matching
    // e.g., prefix "\\server\share" should match "\\server\share", "\\server\share\", "\\server\sharefile"
    return uncLower.startsWith(prefixLower);
  });
}

/**
 * Validate if a string is a valid UNC path
 * @param {string} text - The text to validate
 * @returns {boolean} - True if valid UNC path format
 */
export function isValidUncPath(text) {
  // Check length: minimum 3 (\\x), maximum 260 (Windows MAX_PATH)
  if (!text || text.length < 3 || text.length > 260) {
    return false;
  }

  // Must start with two backslashes
  if (!text.startsWith('\\\\')) {
    return false;
  }

  // Must not contain newlines
  if (NEWLINE_REGEX.test(text)) {
    return false;
  }

  // Check for forbidden characters (excluding the leading backslashes)
  // Note: Backslash itself is allowed as path separator
  // The forbidden chars regex excludes backslash since it's the separator
  const pathPart = text.substring(2); // Remove leading \\
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
export function convertUncToUrl(uncPath, scheme) {
  // Remove leading \\ and replace backslashes with forward slashes
  const pathPart = uncPath.substring(2).replace(/\\/g, '/');
  return `${scheme}://${pathPart}`;
}

/**
 * Check if an element or any ancestor is editable
 * @param {Element} element - The DOM element to check
 * @returns {boolean} - True if element or ancestor is editable
 */
export function isElementEditable(element) {
  let current = element;
  
  while (current && current !== document.body) {
    // Check for contenteditable attribute
    if (current.isContentEditable) {
      return true;
    }
    
    // Check for editable form elements
    const tagName = current.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') {
      return true;
    }
    
    // Check explicit contenteditable attribute
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
export function validateCodeElement(element) {
  // Must not be editable
  if (isElementEditable(element)) {
    return { valid: false };
  }

  // Must have exactly one child
  if (element.childNodes.length !== 1) {
    return { valid: false };
  }

  // The child must be a text node
  const child = element.childNodes[0];
  if (child.nodeType !== Node.TEXT_NODE) {
    return { valid: false };
  }

  const text = child.textContent;

  // Validate as UNC path
  if (!isValidUncPath(text)) {
    return { valid: false };
  }

  return { valid: true, text };
}
