/**
 * CommonJS wrapper for unc-matcher.js
 * This file allows importing the browser-compatible unc-matcher.js in Node.js tests.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and execute the unc-matcher.js file
const code = readFileSync(join(__dirname, 'unc-matcher.js'), 'utf-8');

// Create a module-like environment
const module = { exports: {} };
const func = new Function('module', 'exports', code);
func(module, module.exports);

// Re-export everything
export const {
  isUrlAllowed,
  isUncAllowed,
  isValidUncPath,
  convertUncToUrl,
  isElementEditable,
  validateCodeElement,
} = module.exports;
