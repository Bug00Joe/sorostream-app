# Metadata URI - Quick Start Guide

## For End Users

### Adding Metadata to a Stream

1. **Open Create Stream Form**
   - Navigate to `/stream/new`
   - Fill in Recipient, Amount, and Duration as usual

2. **Access Advanced Settings**
   - Scroll down in the "Amount & Duration" step
   - Click "Advanced settings" to expand

3. **Enter Metadata URI** (Optional)
   - You'll see a new "Metadata URI (optional)" field
   - Enter a valid URI pointing to metadata about your stream
   - Click the "?" tooltip to see what formats are supported

4. **Valid Formats**
   - IPFS: `ipfs://QmW2WQi7j6c7UgJTts41fredwWmxrSF7tzYAJN69ZycE9`
   - HTTPS: `https://example.com/metadata.json`
   - Arweave: `ar://txHashOrPath`

5. **Review & Submit**
   - The metadata URI will be shown in the review step
   - Submit the form as normal

### Viewing Metadata on Stream Detail Page

1. **Navigate to Stream Detail**
   - View any stream you created with metadata

2. **Find Metadata Section**
   - Scroll down to see the stream details
   - Look for "Metadata URI" section (appears after auto-renewal if present)

3. **Access Metadata**
   - Click the metadata URI link
   - Opens in a new browser tab
   - Shows the full URI on hover

## For Developers

### Using validateMetadataUri Function

```typescript
import { validateMetadataUri } from "@/src/lib/sorostream";

// Valid URI - returns empty string
const error = validateMetadataUri("https://example.com/meta.json");
console.log(error); // ""

// Invalid URI - returns error message
const error = validateMetadataUri("http://example.com");
console.log(error); // "Must use one of: ipfs://, https://, or ar://"

// Empty is allowed (optional field)
const error = validateMetadataUri("");
console.log(error); // ""
```

### Adding Metadata URI to Stream Creation

```typescript
const result = await sorostream.createStream({
  recipient: "GXXXXX...",
  amount: "100",
  durationSeconds: 86400,
  token: "USDC",
  metadataUri: "https://example.com/my-stream-metadata.json"
});
```

### Accessing Metadata from Stream Object

```typescript
const stream = await sorostream.getStream(streamId);

if (stream.metadataUri) {
  console.log("Metadata available at:", stream.metadataUri);
  // Fetch and process metadata
  const response = await fetch(stream.metadataUri);
  const metadata = await response.json();
} else {
  console.log("No metadata set for this stream");
}
```

## Metadata URI Use Cases

### 1. Stream Terms & Conditions
```
https://example.com/streams/123/terms.json
```
Provides legal framework for the stream.

### 2. Project Documentation
```
ipfs://QmProjectDocumentation...
```
Links to detailed project information stored on IPFS.

### 3. Community Governance
```
ar://ArweaveTransactionHash
```
References voting record or governance info on Arweave.

### 4. Stream Configuration Details
```
https://api.example.com/streams/metadata/123
```
Points to API endpoint with stream-specific configuration.

## Troubleshooting

### "Must use one of: ipfs://, https://, or ar://"
- **Problem:** Using unsupported URI scheme
- **Solution:** Use one of the three supported schemes
- **Examples of invalid schemes:** http://, ftp://, gopher://, etc.

### "Invalid URI format."
- **Problem:** URI is malformed
- **Solution:** Ensure proper URI format with scheme
- **Examples of invalid:** `example.com`, `just-text`, `://broken`

### Metadata URI field not appearing
- **Problem:** Not in Advanced settings section
- **Solution:** Click "Advanced settings" button to expand the section

### Can't reach metadata link
- **Problem:** Metadata URI is valid but returns 404
- **Solution:** Verify URI is still active and accessible

## Best Practices

1. **Use HTTPS for Most Cases**
   - Most accessible and user-friendly
   - Use `https://` for documents you control

2. **Use IPFS for Immutable Content**
   - Use `ipfs://` for historical/immutable metadata
   - Example: archived stream documentation

3. **Use Arweave for Permanent Records**
   - Use `ar://` for permanent, tamper-proof records
   - Good for regulatory compliance

4. **Keep Metadata Updated**
   - Maintain live HTTPS endpoint with current info
   - Update when stream terms or conditions change

5. **Structure Metadata Well**
   - If using JSON, provide clear structure
   - Include relevant fields: description, terms, dates, etc.

6. **Ensure Accessibility**
   - Test that links work and are public
   - Consider making metadata human-readable

## Example Metadata File

```json
{
  "stream_name": "Developer Sponsorship",
  "description": "Monthly sponsorship for open source development",
  "terms": "Terms of service link...",
  "recipient_org": "Example Foundation",
  "start_date": "2026-07-27",
  "purpose": "Support ongoing development efforts",
  "contact": "contact@example.com",
  "documentation": "https://example.com/stream-docs"
}
```

## API Reference

### validateMetadataUri(value: string): string

Validates a metadata URI.

**Parameters:**
- `value` (string): URI to validate

**Returns:**
- Empty string if valid or empty
- Error message if invalid

**Supported Schemes:**
- `ipfs://` - IPFS content hash
- `https://` - HTTPS URL
- `ar://` - Arweave transaction hash

**Examples:**
```typescript
validateMetadataUri("https://example.com/meta.json") // ""
validateMetadataUri("http://example.com") // "Must use one of: ipfs://, https://, or ar://"
validateMetadataUri("") // ""
```

### CreateStreamParams

New optional parameter:

```typescript
interface CreateStreamParams {
  // ... existing parameters
  metadataUri?: string;
}
```

### StreamData

New optional field:

```typescript
interface StreamData {
  // ... existing fields
  metadataUri?: string;
}
```

## FAQ

**Q: Can I use HTTP instead of HTTPS?**
A: No, only HTTPS, IPFS, and Arweave are supported for security reasons.

**Q: Is metadata URI required?**
A: No, it's completely optional. Leave it blank if you don't need it.

**Q: Can I change metadata after stream creation?**
A: The metadata URI is set at creation time and cannot be changed. Create a new stream if you need different metadata.

**Q: What happens if the metadata link breaks?**
A: The stream continues to work fine. The link just won't be accessible. Users can still withdraw from the stream.

**Q: Can I use a query string in the URI?**
A: Yes, as long as the full URI is valid (e.g., `https://example.com/metadata?id=123`).

**Q: How long can a metadata URI be?**
A: URLs can be quite long. On the detail page, URIs over 40 characters are truncated with ellipsis, but the full URI is shown in the title attribute.

**Q: Are there any size limits on what metadata can point to?**
A: No technical limits, but keep in mind that very large files may be slow to load.
