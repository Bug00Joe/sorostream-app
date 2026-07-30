# Metadata URI - Code Reference

## Key Code Snippets

### 1. URI Validation Function

**Location:** `src/lib/sorostream.ts`

```typescript
export function validateMetadataUri(value: string): string {
  if (!value) return ""; // Empty is allowed (optional field)
  
  try {
    const url = new URL(value);
    const scheme = url.protocol.replace(":", "");
    
    const allowedSchemes = ["ipfs", "https", "ar"];
    if (!allowedSchemes.includes(scheme)) {
      return `Must use one of: ipfs://, https://, or ar://`;
    }
    
    return "";
  } catch {
    return "Invalid URI format.";
  }
}
```

### 2. StreamData Interface

**Location:** `src/lib/sorostream.ts`

```typescript
export interface StreamData {
  id: string;
  sender: string;
  recipient: string;
  token: string;
  flowRate: number;
  deposit: number;
  startTime: string;
  endTime: string;
  lastWithdrawTime: string;
  status: "Active" | "Cancelled" | "Ended";
  autoRenew?: boolean;
  autoRenewDurationSeconds?: number;
  scheduledStartTime?: number;
  metadataUri?: string;  // ← New optional field
}
```

### 3. CreateStreamParams Interface

**Location:** `src/lib/sorostream.ts`

```typescript
export interface CreateStreamParams {
  recipient?: string;
  amount?: string;
  durationSeconds?: number;
  token?: string;
  autoRenew?: boolean;
  autoRenewDurationSeconds?: number;
  scheduledStartTime?: number;
  metadataUri?: string;  // ← New optional parameter
}
```

### 4. Create Stream API Call

**Location:** `src/app/stream/new/page.tsx` (line ~434)

```typescript
const result = await sorostream.createStream({
  recipient,
  amount,
  durationSeconds: duration,
  token: selectedToken === CUSTOM_TOKEN_VALUE ? tokenAddress : selectedToken,
  autoRenew,
  autoRenewDurationSeconds: autoRenew && autoRenewDuration > 0 ? autoRenewDuration : undefined,
  scheduledStartTime,
  metadataUri: metadataUri || undefined,  // ← Pass optional metadata URI
});
```

### 5. Form Field in Advanced Settings

**Location:** `src/app/stream/new/page.tsx` (line ~940-987)

```typescript
{/* Metadata URI field */}
<div>
  <div className="flex items-center gap-2 mb-2">
    <label htmlFor="metadata-uri" className="text-sm text-gray-200 font-medium">
      Metadata URI <span className="text-gray-400 font-normal">(optional)</span>
    </label>
    {/* Tooltip */}
    <div className="relative group">
      <button
        type="button"
        aria-label="What is a metadata URI?"
        className="text-gray-500 hover:text-gray-300 text-xs border border-gray-600 rounded-full w-4 h-4 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        ?
      </button>
      <div
        role="tooltip"
        className="hidden group-hover:block group-focus-within:block absolute left-0 bottom-6 w-64 bg-gray-700 border border-gray-600 rounded-lg p-3 text-xs text-gray-300 leading-relaxed z-10 shadow-lg"
      >
        A URI pointing to metadata about this stream (JSON, terms, documentation, etc.).
        Supports ipfs://, https://, and ar:// schemes.
      </div>
    </div>
  </div>
  <input
    id="metadata-uri"
    type="text"
    value={metadataUri}
    onChange={(e) => {
      const val = e.target.value;
      setMetadataUri(val);
      setMetadataUriError(validateMetadataUri(val));
      persist({ metadataUri: val });
    }}
    onBlur={() => {
      setMetadataUriError(validateMetadataUri(metadataUri));
    }}
    placeholder="e.g. ipfs://Qm... or https://example.com/metadata.json"
    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
    aria-invalid={!!metadataUriError}
    aria-describedby={metadataUriError ? "metadata-uri-error" : undefined}
  />
  {metadataUriError && (
    <p id="metadata-uri-error" className="text-red-400 text-sm mt-1">
      {metadataUriError}
    </p>
  )}
</div>
```

### 6. Metadata URI Display on Stream Detail Page

**Location:** `src/app/stream/[id]/page.tsx` (line ~824-860)

```typescript
{stream.metadataUri && (
  <div className="col-span-2">
    <p className="text-gray-400 mb-1 flex items-center gap-2">
      Metadata URI
      <div className="relative group">
        <button
          type="button"
          aria-label="What is metadata URI?"
          className="text-gray-500 hover:text-gray-300 text-xs border border-gray-600 rounded-full w-4 h-4 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          ?
        </button>
        <div
          role="tooltip"
          className="hidden group-hover:block group-focus-within:block absolute left-0 bottom-6 w-64 bg-gray-700 border border-gray-600 rounded-lg p-3 text-xs text-gray-300 leading-relaxed z-10 shadow-lg"
        >
          External metadata reference that provides additional context or documentation
          about this stream. Can point to JSON, terms of service, or other relevant data.
        </div>
      </div>
    </p>
    <a
      href={stream.metadataUri}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 hover:bg-blue-900/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      title={stream.metadataUri}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      {stream.metadataUri.length > 40 ? `${stream.metadataUri.slice(0, 37)}…` : stream.metadataUri}
    </a>
  </div>
)}
```

## Integration Points

### 1. Form State Management

```typescript
// State variables (lines ~249-250)
const [metadataUri, setMetadataUri] = useState("");
const [metadataUriError, setMetadataUriError] = useState("");

// Form persistence (lines ~178-197)
function persist(overrides: Partial<{
  // ... other fields
  metadataUri: string;
}> = {}) {
  saveDraft({
    // ... other fields
    metadataUri,
    ...overrides,
  });
}
```

### 2. Form Reset on Success

```typescript
// Lines ~445-446
setMetadataUri("");
setMetadataUriError("");
```

### 3. Validation in Submission

```typescript
// Line ~392
const mErr = validateMetadataUri(metadataUri);

// Line ~394
if (rErr || aErr || dErr || eErr || cErr || sErr || mErr) {
  // ... set errors
  setMetadataUriError(mErr);
  return;
}
```

## Styling Classes

### Form Input
- Background: `bg-gray-800`
- Border: `border-gray-600`
- Text: `text-white`
- Focus ring: `focus-visible:ring-green-500`

### Detail Page Badge
- Background: `bg-blue-900/40`
- Border: `border-blue-700/50`
- Text: `text-blue-300`
- Hover: `hover:bg-blue-900/60`

### Error Message
- Color: `text-red-400`
- Size: `text-sm`
- Margin: `mt-1`

### Tooltip
- Background: `bg-gray-700`
- Border: `border-gray-600`
- Text: `text-gray-300`
- Width: `w-64`
- Position: `absolute left-0 bottom-6`

## Accessibility Features

### ARIA Attributes
- `aria-label`: Tooltip button descriptions
- `aria-describedby`: Links error messages to inputs
- `aria-invalid`: Indicates validation state

### Keyboard Support
- Tab navigation to field
- Tab to tooltip button
- Enter to activate tooltip
- Space to activate button

### Focus Management
- Visible focus rings (green-500)
- Proper focus-visible states
- Group focus-within for tooltips

## Testing Examples

### Valid URIs (No Error)
```javascript
validateMetadataUri("ipfs://QmW2WQi7j6c7UgJTts41fredwWmxrSF7tzYAJN69ZycE9")
// Returns: ""

validateMetadataUri("https://example.com/metadata.json")
// Returns: ""

validateMetadataUri("ar://txHash")
// Returns: ""

validateMetadataUri("")
// Returns: ""
```

### Invalid URIs (Error Returned)
```javascript
validateMetadataUri("http://example.com")
// Returns: "Must use one of: ipfs://, https://, or ar://"

validateMetadataUri("ftp://example.com")
// Returns: "Must use one of: ipfs://, https://, or ar://"

validateMetadataUri("not-a-uri")
// Returns: "Invalid URI format."
```

## Data Flow

```
User Input
    ↓
onChange → validate → update state + persist
    ↓
onBlur → validate → update error state
    ↓
Submit → validate → pass to API
    ↓
createStream() → store in StreamData
    ↓
Stream Display → conditional render if present
    ↓
Clickable Link → open in new tab
```
