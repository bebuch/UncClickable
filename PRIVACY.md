# Privacy Policy for UncClickable

**Last Updated:** February 10, 2026

## Overview

UncClickable is a browser extension that converts UNC (Universal Naming Convention) paths found in HTML code elements into clickable links using a custom URL scheme. This privacy policy explains what data the extension collects, how it is used, and your rights regarding this data.

## Data Collection and Usage

### What Data We Collect

UncClickable collects and stores **only** the following user preferences locally in your browser:

1. **Custom URL Scheme**: Your preferred URL scheme (default: `uncopener://`)
2. **Active URLs**: A list of website URLs where you want the extension to be active
3. **Allowed UNC Prefixes**: A list of UNC path prefixes that should be converted to clickable links
4. **HTML Elements**: The HTML elements (e.g., `code`, `pre`) to scan for UNC paths

### How We Use This Data

- All configuration data is stored **locally in your browser** using the browser's built-in storage API (`chrome.storage.sync` or `browser.storage.sync`)
- This data is used **only** to control the extension's behavior according to your preferences
- The extension processes web pages you visit to find and convert UNC paths based on your configured settings

### Data Storage Location

- All data is stored locally in your browser
- If you enable browser sync, your settings may sync across your devices through your browser's built-in sync mechanism (controlled by your browser, not by this extension)

## Data We Do NOT Collect

UncClickable does **NOT**:

- Collect any personal information (name, email, etc.)
- Track your browsing history
- Transmit any data to external servers
- Use analytics or tracking services
- Store or access passwords, financial information, or authentication credentials
- Share any data with third parties

## Third-Party Services

UncClickable does **NOT** use any third-party services, analytics, or tracking tools. The extension operates entirely within your browser.

## Permissions Explained

The extension requests the following permissions:

- **`storage`**: Required to save your configuration preferences locally in your browser
- **Content scripts on `<all_urls>`**: Required to scan web pages for UNC paths, but the extension only becomes active on URLs you specify in your configuration (or all URLs if you leave the active URLs list empty)

## Your Rights and Control

You have complete control over your data:

- **View Settings**: Click the extension icon to open the settings page and view all stored configuration
- **Modify Settings**: Change any configuration at any time through the settings page
- **Reset Settings**: Use the "Reset to Defaults" button to restore factory settings
- **Delete All Data**: Uninstall the extension to completely remove all stored data from your browser

## Data Retention

- Configuration data is retained until you modify it, reset it, or uninstall the extension
- Uninstalling the extension will remove all stored data from your browser

## Security

- All data is stored using the browser's secure storage API
- No data is transmitted over the internet
- The extension only processes data locally within your browser

## Children's Privacy

This extension does not knowingly collect any information from children under the age of 13. The extension is designed for users who work with network file paths, typically in professional or technical environments.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be posted in this document with an updated "Last Updated" date. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Open Source

UncClickable is open source software. You can review the complete source code at:
https://github.com/bebuch/UncClickable

## Contact

For questions, concerns, or requests regarding this privacy policy or the extension's data practices, please:

- Open an issue on GitHub: https://github.com/bebuch/UncClickable/issues
- Review the source code to verify our privacy claims

## Compliance

This privacy policy is designed to comply with:

- Chrome Web Store Program Policies
- Microsoft Edge Add-ons Store Developer Policies
- Mozilla Add-on Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

## Summary

**In short**: UncClickable stores only your configuration preferences locally in your browser and does not collect, transmit, or share any personal data with anyone. The extension operates entirely offline within your browser.
