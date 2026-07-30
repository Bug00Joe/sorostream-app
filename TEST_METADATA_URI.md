# Metadata URI Feature Test Plan

## Overview
This document outlines testing for the Metadata URI feature added to the SoroStream create-stream form and stream detail page.

## Implementation Summary

### Components Modified
1. **sorostream.ts** - Core library
   - Added `metadataUri?: string` to `StreamData` interface
   - Added `metadataUri?: string` to `CreateStreamParams` interface
   - Created `validateMetadataUri()` function
   - Updated `createStream()` mock function to handle metadataUri

2. **create-stream form (stream/new/page.tsx)**
   - Imported `validateMetadataUri` function
   - Added `metadataUri` and `metadataUriError` state
   - Added metadataUri to form persistence
   - Added metadataUri input field in Advanced settings section
   - Added tooltip explaining metadata URI purpose
   - Updated `handleCreateStream()` to validate and pass metadataUri
   - Added metadataUri reset on successful stream creation

3. **stream detail page (stream/[id]/page.tsx)**
   - Added conditional display of metadata URI when present
   - Rendered as clickable link with icon
   - Truncates long URIs with ellipsis
   - Includes tooltip explaining the field's purpose
   - Opens in new tab with proper security attributes

## Validation Rules

The `validateMetadataUri()` function validates:
- Empty values are allowed (optional field)
- URI scheme must be one of: `ipfs://`, `https://`, or `ar://`
- Returns descriptive error messages for invalid formats

Valid examples:
- `ipfs://QmW2WQi7j6c7UgJTts41fredwWmxrSF7tzYAJN69ZycE9`
- `https://example.com/metadata.json`
- `ar://tx-hash-or-path`

Invalid examples:
- `http://example.com` (http not allowed)
- `ftp://example.com` (ftp not allowed)
- `not-a-uri` (no scheme)

## Test Cases

### TC-1: Form Field Display
**Objective:** Verify metadata URI field appears in Advanced section
**Steps:**
1. Navigate to `/stream/new`
2. Go to "Amount & Duration" step
3. Scroll to "Advanced settings"
4. Verify "Metadata URI (optional)" label with tooltip "?" button

**Expected Result:** Field visible with proper styling and tooltip

### TC-2: Validation - Valid IPFS URI
**Objective:** Test validation accepts valid IPFS URI
**Steps:**
1. In Advanced settings, enter: `ipfs://QmExample`
2. Blur field (click elsewhere)
3. Observe validation result

**Expected Result:** No error message shown, field accepts input

### TC-3: Validation - Valid HTTPS URI
**Objective:** Test validation accepts valid HTTPS URI
**Steps:**
1. In Advanced settings, enter: `https://example.com/metadata.json`
2. Blur field
3. Observe validation result

**Expected Result:** No error message shown, field accepts input

### TC-4: Validation - Valid Arweave URI
**Objective:** Test validation accepts valid Arweave URI
**Steps:**
1. In Advanced settings, enter: `ar://txHash`
2. Blur field
3. Observe validation result

**Expected Result:** No error message shown, field accepts input

### TC-5: Validation - Invalid HTTP URI
**Objective:** Test validation rejects HTTP (non-HTTPS)
**Steps:**
1. In Advanced settings, enter: `http://example.com`
2. Blur field
3. Observe validation result

**Expected Result:** Error message shown: "Must use one of: ipfs://, https://, or ar://"

### TC-6: Validation - Invalid Format
**Objective:** Test validation rejects malformed URI
**Steps:**
1. In Advanced settings, enter: `not-a-valid-uri`
2. Blur field
3. Observe validation result

**Expected Result:** Error message shown: "Invalid URI format."

### TC-7: Form Persistence
**Objective:** Test metadata URI value persists in sessionStorage
**Steps:**
1. Enter valid metadata URI: `https://example.com/meta.json`
2. Navigate away from form
3. Return to form
4. Observe field value

**Expected Result:** Metadata URI value is restored from draft

### TC-8: Form Submission with Valid URI
**Objective:** Test form accepts submission with valid metadata URI
**Steps:**
1. Fill in all required fields
2. Enter valid metadata URI in Advanced section
3. Progress through form steps
4. Click "Confirm and Sign" on review step

**Expected Result:** Form validation passes, transaction proceeds

### TC-9: Form Submission with Invalid URI
**Objective:** Test form rejects submission with invalid metadata URI
**Steps:**
1. Fill in all required fields
2. Enter invalid metadata URI: `http://example.com`
3. Progress to review step
4. Click "Confirm and Sign"

**Expected Result:** Validation error shown, form doesn't proceed

### TC-10: Empty Metadata URI (Optional)
**Objective:** Test that empty metadata URI is allowed
**Steps:**
1. Leave metadata URI field empty
2. Fill in all other required fields
3. Progress through form to submission

**Expected Result:** Form allows submission with empty metadata URI

### TC-11: Stream Detail Display - With Metadata
**Objective:** Test metadata URI displays on stream detail page
**Steps:**
1. Create stream with metadata URI: `https://example.com/metadata.json`
2. Navigate to stream detail page
3. Scroll through details

**Expected Result:** 
- Metadata URI section visible below auto-renewal section
- Shows as blue badge with link icon
- Text truncated if longer than 40 chars
- Clickable link opens in new tab

### TC-12: Stream Detail Display - Without Metadata
**Objective:** Test metadata URI section doesn't appear when not set
**Steps:**
1. View existing stream without metadata URI
2. Scroll through details

**Expected Result:** Metadata URI section not displayed

### TC-13: Stream Detail Tooltip
**Objective:** Test tooltip on stream detail page
**Steps:**
1. Create stream with metadata URI
2. Navigate to stream detail
3. Hover over "?" icon next to "Metadata URI"

**Expected Result:** Tooltip appears explaining metadata URI purpose

### TC-14: Stream Detail Link Behavior
**Objective:** Test metadata URI link behavior
**Steps:**
1. Create stream with metadata URI: `https://example.com/test`
2. Navigate to stream detail
3. Right-click on metadata URI link
4. Observe link properties

**Expected Result:**
- Link has correct href
- Opens in new tab (target="_blank")
- Has rel="noopener noreferrer"
- Title attribute matches full URI

### TC-15: Form Reset After Creation
**Objective:** Test form resets metadata URI after successful creation
**Steps:**
1. Create stream with metadata URI
2. Wait for success banner
3. Verify form resets
4. Check Advanced settings

**Expected Result:** Metadata URI field cleared and empty

### TC-16: Advanced Section Toggle
**Objective:** Test Advanced section properly shows/hides metadata field
**Steps:**
1. Navigate to form step 2 (Amount & Duration)
2. Click "Advanced settings" to expand
3. Verify metadata URI field visible
4. Click "Advanced settings" to collapse
5. Verify metadata URI field hidden

**Expected Result:** Field visibility toggles correctly with section

## Regression Testing

Ensure these existing features still work:
- Stream creation without metadata URI
- Form persistence for other fields
- Advanced settings toggle
- Auto-renewal toggle and duration picker
- Scheduled start date
- End date and cliff date validation
- Stream detail page display
- Claimable balance updates

## Browser Compatibility

Test on:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Accessibility

Verify:
- Tooltip buttons have proper `aria-label`
- Error messages have proper `id` and `aria-describedby`
- Input field has proper `aria-invalid` state
- Focus management works with keyboard navigation
- Tooltip is accessible via keyboard (group-focus-within)

## Edge Cases

1. **Very Long URI:** Test with URI > 100 chars - should truncate with ellipsis
2. **Special Characters:** URI with encoded characters (e.g., %20 for space)
3. **URI at Max Length:** Test with maximum reasonable URI length
4. **Trailing Spaces:** Test with URI that has trailing spaces
5. **Case Sensitivity:** Test scheme detection (ipfs:// vs IPFS://)
