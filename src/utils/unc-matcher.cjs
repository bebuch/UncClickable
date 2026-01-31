/**
 * Re-export from unc-matcher.js for test compatibility
 * This file exists to support import paths that use the .cjs extension.
 */

export {
  isUrlAllowed,
  isUncAllowed,
  isValidUncPath,
  convertUncToUrl,
  isElementEditable,
  validateCodeElement,
} from './unc-matcher.js';
