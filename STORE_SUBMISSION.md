# Store Submission Guidelines

This document provides guidance for submitting UncClickable to browser extension stores.

## Pre-Submission Checklist

Before submitting to any store, ensure:

- [ ] All tests pass (`npm run test:run`)
- [ ] Code is linted and formatted (`npm run lint` and `npm run format:check`)
- [ ] README.md is up to date
- [ ] PRIVACY.md is accessible
- [ ] manifest.json version is updated
- [ ] Icons are present in all required sizes
- [ ] Extension has been manually tested in target browser

## Chrome Web Store Submission

### Requirements

1. **Developer Account**
   - Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - One-time registration fee: $5 USD

2. **Listing Information**
   - **Name**: UncClickable
   - **Summary**: Converts UNC paths in code elements to clickable custom URL scheme links
   - **Description**: Use the description from README.md, highlighting key features
   - **Category**: Developer Tools or Productivity
   - **Language**: English (add more as needed)

3. **Privacy Information**
   - **Privacy Policy URL**: https://github.com/bebuch/UncClickable/blob/main/PRIVACY.md
   - **Permissions Justification**:
     - `storage`: Required to save user configuration preferences (URL scheme, active URLs, allowed UNC prefixes)
   - **Data Usage Certification**: 
     - Does NOT collect user data
     - Does NOT transmit data externally
     - Stores only configuration locally

4. **Store Assets**
   - **Icon**: 128x128px (already included in `icons/icon-128.png`)
   - **Screenshots**: Recommended 1280x800 or 640x400
     - Show the extension in action on a sample page
     - Show the settings/options page
   - **Promotional Tile**: Optional 440x280px

5. **Distribution**
   - **Visibility**: Public
   - **Regions**: All regions (unless you have specific restrictions)

### Submission Steps

1. Create a ZIP file of the extension:
   ```bash
   zip -r UncClickable.zip . -x "*.git*" -x "*node_modules*" -x "*.DS_Store" -x "*tests*" -x "*.md" -x "package*.json" -x "*.config.js" -x "*scripts*"
   ```

2. Upload to Chrome Web Store Developer Dashboard
3. Fill in all required listing information
4. Provide privacy policy URL
5. Submit for review

### Review Process

- Initial review: Typically 1-3 business days
- Automated checks for malware, policy violations
- May require additional information or changes

## Microsoft Edge Add-ons Store

### Requirements

1. **Developer Account**
   - Register at [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login)
   - No registration fee

2. **Listing Information**
   - Same as Chrome Web Store (Edge accepts Chrome extensions)
   - **Category**: Developer tools / Productivity

3. **Privacy Information**
   - **Privacy Policy URL**: https://github.com/bebuch/UncClickable/blob/main/PRIVACY.md
   - Same justifications as Chrome

4. **Store Assets**
   - Same requirements as Chrome
   - Edge store also accepts Chrome Web Store screenshots

### Submission Steps

1. Use the same ZIP file as Chrome submission
2. Upload to Edge Add-ons Partner Center
3. Fill in listing information
4. Provide privacy policy URL
5. Submit for review

### Review Process

- Review: Typically 1-5 business days
- Automated and manual review
- Generally follows similar guidelines as Chrome

## Mozilla Add-ons (AMO)

### Requirements

1. **Developer Account**
   - Register at [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/)
   - No registration fee

2. **Listing Information**
   - **Name**: UncClickable
   - **Summary**: Converts UNC paths in code elements to clickable custom URL scheme links
   - **Category**: Other

3. **Privacy Information**
   - **Privacy Policy URL**: https://github.com/bebuch/UncClickable/blob/main/PRIVACY.md
   - **Data Collection Declaration**: Already included in manifest.json via `data_collection_permissions`

4. **Store Assets**
   - Icon: 128x128px (from manifest)
   - Screenshots: Any size, but recommended 1280x800

### Submission Steps

1. Create a ZIP file (can use same as Chrome)
2. Upload to AMO Developer Hub
3. Fill in listing information
4. Submit for review

### Review Process

- Automated review: Minutes to hours
- Manual review (if flagged): 1-10 days
- Firefox requires source code review if using minified/compiled code (we use ES modules, no build step needed)

## Policy Compliance Summary

### Chrome Web Store Policies

✅ **Single Purpose**: The extension has one clear purpose - converting UNC paths to clickable links

✅ **Permissions**: Minimal permissions requested (only `storage`)

✅ **Privacy**: 
- Clear privacy policy provided
- No data collection or transmission
- User data handled securely (stored locally)

✅ **User Experience**: 
- Extension only activates on user-configured URLs
- Non-intrusive (only modifies code elements)
- Provides clear configuration options

✅ **Metadata**: Accurate description and screenshots

### Microsoft Edge Policies

✅ **Single Purpose**: Narrow, focused functionality

✅ **Security**: 
- No external code loading
- No eval() or similar unsafe practices
- Minimal permissions

✅ **Privacy**: Same as Chrome compliance

✅ **User Experience**: Same as Chrome compliance

### Mozilla Policies

✅ **Data Collection**: Properly declared in manifest via `data_collection_permissions`

✅ **Permissions**: Justified and minimal

✅ **Source Code**: Open source, available for review

✅ **Privacy**: Comprehensive privacy policy

## Post-Submission

After approval:

1. **Monitor Reviews**: Respond to user feedback promptly
2. **Update Regularly**: Keep extension up to date with browser changes
3. **Maintain Policy Compliance**: Review policy updates from stores
4. **Version Updates**: Increment version number for each submission

## Common Rejection Reasons to Avoid

❌ Missing or incomplete privacy policy → ✅ We have PRIVACY.md  
❌ Requesting unnecessary permissions → ✅ We only request `storage`  
❌ Misleading description → ✅ Our description is accurate  
❌ Keyword stuffing → ✅ Our metadata is clean  
❌ Incomplete functionality → ✅ Extension is fully functional  
❌ Malware or suspicious code → ✅ Open source, clean code  

## Support and Documentation

- **Support URL**: https://github.com/bebuch/UncClickable/issues
- **Homepage**: https://github.com/bebuch/UncClickable
- **Privacy Policy**: https://github.com/bebuch/UncClickable/blob/main/PRIVACY.md
- **Source Code**: https://github.com/bebuch/UncClickable

## Notes

- All three stores generally accept the same extension package with minimal modifications
- Firefox requires the `browser_specific_settings.gecko` field in manifest (already included)
- Keep store listings synchronized across all platforms
- Update all stores when releasing new versions
