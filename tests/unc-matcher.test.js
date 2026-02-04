/**
 * Unit Tests for UNC Matcher Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isUrlAllowed,
  getActiveUrlEntry,
  isUncAllowed,
  isValidUncPath,
  convertUncToUrl,
  isElementEditable,
  validateCodeElement,
} from '../src/utils/unc-matcher.js';

describe('isUrlAllowed', () => {
  describe('with empty allowed list', () => {
    it('should allow any URL when list is empty', () => {
      expect(isUrlAllowed('https://example.com/', [])).toBe(true);
      expect(isUrlAllowed('http://localhost:3000/', [])).toBe(true);
      expect(isUrlAllowed('file:///home/user/', [])).toBe(true);
    });

    it('should allow any URL when list is undefined', () => {
      expect(isUrlAllowed('https://example.com/', undefined)).toBe(true);
    });

    it('should allow any URL when list is null', () => {
      expect(isUrlAllowed('https://example.com/', null)).toBe(true);
    });
  });

  describe('with configured URLs', () => {
    const allowedUrls = ['https://wiki.example.com/', 'https://intranet.company.com/docs/'];

    it('should allow exact URL match', () => {
      expect(isUrlAllowed('https://wiki.example.com/', allowedUrls)).toBe(true);
    });

    it('should allow URL with subpath', () => {
      expect(isUrlAllowed('https://wiki.example.com/page/article', allowedUrls)).toBe(true);
      expect(isUrlAllowed('https://intranet.company.com/docs/file.pdf', allowedUrls)).toBe(true);
    });

    it('should reject URL not matching any prefix', () => {
      expect(isUrlAllowed('https://other.com/', allowedUrls)).toBe(false);
      expect(isUrlAllowed('https://wiki.example.org/', allowedUrls)).toBe(false);
    });

    it('should reject URL with similar but different path', () => {
      // 'intranet.company.com/documents/' does not start with 'intranet.company.com/docs/'
      expect(isUrlAllowed('https://intranet.company.com/documents/', allowedUrls)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isUrlAllowed('HTTPS://WIKI.EXAMPLE.COM/PAGE', allowedUrls)).toBe(true);
      expect(isUrlAllowed('https://Wiki.Example.Com/', allowedUrls)).toBe(true);
    });

    it('should include protocol in matching', () => {
      expect(isUrlAllowed('http://wiki.example.com/', allowedUrls)).toBe(false);
    });
  });
});

describe('getActiveUrlEntry', () => {
  const defaultElements = 'code;pre;span';

  describe('with empty activeUrls list', () => {
    it('should return all default elements when list is empty', () => {
      const result = getActiveUrlEntry('https://example.com/', [], defaultElements);
      expect(result).toEqual({ url: '', elements: ['code', 'pre', 'span'] });
    });

    it('should return all default elements when list is undefined', () => {
      const result = getActiveUrlEntry('https://example.com/', undefined, defaultElements);
      expect(result).toEqual({ url: '', elements: ['code', 'pre', 'span'] });
    });

    it('should return all default elements when list is null', () => {
      const result = getActiveUrlEntry('https://example.com/', null, defaultElements);
      expect(result).toEqual({ url: '', elements: ['code', 'pre', 'span'] });
    });
  });

  describe('with configured URLs', () => {
    const activeUrls = [
      { url: 'https://wiki.example.com/', elements: ['code', 'pre'] },
      { url: 'https://intranet.company.com/docs/', elements: ['span'] },
    ];

    it('should return matching entry with its elements', () => {
      const result = getActiveUrlEntry('https://wiki.example.com/page', activeUrls, defaultElements);
      expect(result).toEqual({ url: 'https://wiki.example.com/', elements: ['code', 'pre'] });
    });

    it('should return null for non-matching URL', () => {
      const result = getActiveUrlEntry('https://other.com/', activeUrls, defaultElements);
      expect(result).toBeNull();
    });

    it('should be case-insensitive', () => {
      const result = getActiveUrlEntry('HTTPS://WIKI.EXAMPLE.COM/PAGE', activeUrls, defaultElements);
      expect(result).not.toBeNull();
      expect(result.elements).toEqual(['code', 'pre']);
    });

    it('should match URL with subpath', () => {
      const result = getActiveUrlEntry(
        'https://intranet.company.com/docs/file.pdf',
        activeUrls,
        defaultElements
      );
      expect(result).toEqual({ url: 'https://intranet.company.com/docs/', elements: ['span'] });
    });
  });

  describe('with empty elements in entry', () => {
    it('should use default elements when entry has empty elements array', () => {
      const activeUrls = [{ url: 'https://example.com/', elements: [] }];
      const result = getActiveUrlEntry('https://example.com/page', activeUrls, defaultElements);
      expect(result.elements).toEqual([]);
    });

    it('should use default elements when entry has undefined elements', () => {
      const activeUrls = [{ url: 'https://example.com/' }];
      const result = getActiveUrlEntry('https://example.com/page', activeUrls, defaultElements);
      expect(result.elements).toEqual(['code', 'pre', 'span']);
    });
  });
});

describe('isUncAllowed', () => {
  describe('with empty allowed list', () => {
    it('should allow any UNC when list is empty', () => {
      expect(isUncAllowed('\\\\server\\share', [])).toBe(true);
      expect(isUncAllowed('\\\\data-1\\files\\doc.txt', [])).toBe(true);
    });

    it('should allow any UNC when list is undefined', () => {
      expect(isUncAllowed('\\\\server\\share', undefined)).toBe(true);
    });

    it('should allow any UNC when list is null', () => {
      expect(isUncAllowed('\\\\server\\share', null)).toBe(true);
    });
  });

  describe('with trailing backslash (exact directory match)', () => {
    const allowedPrefixes = ['\\\\fileserver\\share\\'];

    it('should allow exact match', () => {
      expect(isUncAllowed('\\\\fileserver\\share\\', allowedPrefixes)).toBe(true);
    });

    it('should allow paths under the directory', () => {
      expect(isUncAllowed('\\\\fileserver\\share\\file.txt', allowedPrefixes)).toBe(true);
      expect(isUncAllowed('\\\\fileserver\\share\\subdir\\file.txt', allowedPrefixes)).toBe(true);
    });

    it('should reject paths with similar prefix but different directory', () => {
      // 'share2' does not start with 'share\'
      expect(isUncAllowed('\\\\fileserver\\share2\\file.txt', allowedPrefixes)).toBe(false);
      expect(isUncAllowed('\\\\fileserver\\sharefile.txt', allowedPrefixes)).toBe(false);
    });
  });

  describe('without trailing backslash (prefix match)', () => {
    const allowedPrefixes = ['\\\\fileserver\\share'];

    it('should allow exact match', () => {
      expect(isUncAllowed('\\\\fileserver\\share', allowedPrefixes)).toBe(true);
    });

    it('should allow paths under the directory', () => {
      expect(isUncAllowed('\\\\fileserver\\share\\file.txt', allowedPrefixes)).toBe(true);
    });

    it('should allow paths with same prefix', () => {
      // This is the key difference: without trailing \, prefix matching allows this
      expect(isUncAllowed('\\\\fileserver\\share2\\file.txt', allowedPrefixes)).toBe(true);
      expect(isUncAllowed('\\\\fileserver\\sharefile.txt', allowedPrefixes)).toBe(true);
    });
  });

  describe('case sensitivity', () => {
    const allowedPrefixes = ['\\\\FileServer\\Share\\'];

    it('should be case-insensitive', () => {
      expect(isUncAllowed('\\\\fileserver\\share\\file.txt', allowedPrefixes)).toBe(true);
      expect(isUncAllowed('\\\\FILESERVER\\SHARE\\FILE.TXT', allowedPrefixes)).toBe(true);
    });
  });

  describe('multiple prefixes', () => {
    const allowedPrefixes = ['\\\\server1\\', '\\\\server2\\data\\'];

    it('should match any of the allowed prefixes', () => {
      expect(isUncAllowed('\\\\server1\\anything', allowedPrefixes)).toBe(true);
      expect(isUncAllowed('\\\\server2\\data\\file.txt', allowedPrefixes)).toBe(true);
    });

    it('should reject if no prefix matches', () => {
      expect(isUncAllowed('\\\\server2\\other\\', allowedPrefixes)).toBe(false);
      expect(isUncAllowed('\\\\server3\\', allowedPrefixes)).toBe(false);
    });
  });
});

describe('isValidUncPath', () => {
  describe('valid paths', () => {
    it('should accept minimal UNC path', () => {
      expect(isValidUncPath('\\\\s')).toBe(true); // 3 chars minimum
    });

    it('should accept typical UNC paths', () => {
      expect(isValidUncPath('\\\\server\\share')).toBe(true);
      expect(isValidUncPath('\\\\server\\share\\folder\\file.txt')).toBe(true);
      expect(isValidUncPath('\\\\192.168.1.1\\share')).toBe(true);
    });

    it('should accept paths with trailing backslash', () => {
      expect(isValidUncPath('\\\\server\\share\\')).toBe(true);
    });

    it('should accept paths up to 260 characters', () => {
      const longPath = '\\\\' + 'a'.repeat(258); // Total 260 chars
      expect(isValidUncPath(longPath)).toBe(true);
    });
  });

  describe('invalid paths', () => {
    it('should reject paths shorter than 3 characters', () => {
      expect(isValidUncPath('\\\\')).toBe(false);
      expect(isValidUncPath('\\')).toBe(false);
      expect(isValidUncPath('')).toBe(false);
    });

    it('should reject paths longer than 260 characters', () => {
      const longPath = '\\\\' + 'a'.repeat(259); // Total 261 chars
      expect(isValidUncPath(longPath)).toBe(false);
    });

    it('should reject paths not starting with \\\\', () => {
      expect(isValidUncPath('server\\share')).toBe(false);
      expect(isValidUncPath('/server/share')).toBe(false);
      expect(isValidUncPath('C:\\folder')).toBe(false);
    });

    it('should reject paths with newlines', () => {
      expect(isValidUncPath('\\\\server\nshare')).toBe(false);
      expect(isValidUncPath('\\\\server\rshare')).toBe(false);
      expect(isValidUncPath('\\\\server\r\nshare')).toBe(false);
    });

    it('should reject paths with forbidden characters', () => {
      expect(isValidUncPath('\\\\server\\share<name')).toBe(false);
      expect(isValidUncPath('\\\\server\\share>name')).toBe(false);
      expect(isValidUncPath('\\\\server\\share:name')).toBe(false);
      expect(isValidUncPath('\\\\server\\share"name')).toBe(false);
      expect(isValidUncPath('\\\\server\\share|name')).toBe(false);
      expect(isValidUncPath('\\\\server\\share?name')).toBe(false);
      expect(isValidUncPath('\\\\server\\share*name')).toBe(false);
    });

    it('should reject paths with control characters', () => {
      expect(isValidUncPath('\\\\server\\share\x00name')).toBe(false);
      expect(isValidUncPath('\\\\server\\share\x1Fname')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidUncPath(null)).toBe(false);
      expect(isValidUncPath(undefined)).toBe(false);
    });
  });
});

describe('convertUncToUrl', () => {
  it('should convert basic UNC path', () => {
    expect(convertUncToUrl('\\\\server\\share', 'uncopener')).toBe('uncopener://server/share');
  });

  it('should convert UNC path with subdirectories', () => {
    expect(convertUncToUrl('\\\\server\\share\\folder\\file.txt', 'uncopener')).toBe(
      'uncopener://server/share/folder/file.txt'
    );
  });

  it('should preserve trailing slash', () => {
    expect(convertUncToUrl('\\\\server\\share\\', 'uncopener')).toBe('uncopener://server/share/');
  });

  it('should work with custom scheme', () => {
    expect(convertUncToUrl('\\\\server\\share', 'myscheme')).toBe('myscheme://server/share');
  });

  it('should handle IP addresses', () => {
    expect(convertUncToUrl('\\\\192.168.1.1\\share', 'uncopener')).toBe(
      'uncopener://192.168.1.1/share'
    );
  });
});

describe('isElementEditable', () => {
  it('should return false for regular elements', () => {
    document.body.innerHTML = '<code>test</code>';
    const element = document.querySelector('code');
    expect(isElementEditable(element)).toBe(false);
  });

  it('should return true for contenteditable element', () => {
    document.body.innerHTML = '<code contenteditable="true">test</code>';
    const element = document.querySelector('code');
    expect(isElementEditable(element)).toBe(true);
  });

  it('should return true for element inside contenteditable', () => {
    document.body.innerHTML = '<div contenteditable="true"><code>test</code></div>';
    const element = document.querySelector('code');
    expect(isElementEditable(element)).toBe(true);
  });

  it('should return true for input elements', () => {
    document.body.innerHTML = '<input type="text">';
    const element = document.querySelector('input');
    expect(isElementEditable(element)).toBe(true);
  });

  it('should return true for textarea elements', () => {
    document.body.innerHTML = '<textarea></textarea>';
    const element = document.querySelector('textarea');
    expect(isElementEditable(element)).toBe(true);
  });

  it('should return false for contenteditable="false"', () => {
    document.body.innerHTML = '<code contenteditable="false">test</code>';
    const element = document.querySelector('code');
    expect(isElementEditable(element)).toBe(false);
  });
});

describe('validateCodeElement', () => {
  it('should validate code element with single text node', () => {
    document.body.innerHTML = '<code>\\\\server\\share</code>';
    const element = document.querySelector('code');
    const result = validateCodeElement(element);
    expect(result.valid).toBe(true);
    expect(result.text).toBe('\\\\server\\share');
  });

  it('should reject element with multiple children', () => {
    document.body.innerHTML = '<code>text<span>span</span></code>';
    const element = document.querySelector('code');
    expect(validateCodeElement(element).valid).toBe(false);
  });

  it('should reject element with non-text child', () => {
    document.body.innerHTML = '<code><span>\\\\server\\share</span></code>';
    const element = document.querySelector('code');
    expect(validateCodeElement(element).valid).toBe(false);
  });

  it('should reject editable elements', () => {
    document.body.innerHTML = '<div contenteditable="true"><code>\\\\server\\share</code></div>';
    const element = document.querySelector('code');
    expect(validateCodeElement(element).valid).toBe(false);
  });

  it('should reject invalid UNC paths', () => {
    document.body.innerHTML = '<code>not a UNC path</code>';
    const element = document.querySelector('code');
    expect(validateCodeElement(element).valid).toBe(false);
  });

  it('should reject empty elements', () => {
    document.body.innerHTML = '<code></code>';
    const element = document.querySelector('code');
    expect(validateCodeElement(element).valid).toBe(false);
  });
});
