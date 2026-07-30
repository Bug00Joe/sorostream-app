# Wallet Session Timeout - Developer Documentation

## Implementation Overview

The wallet session timeout detection system monitors Freighter wallet connections and alerts users 5 minutes and 1 minute before the session expires (15-minute default).

## Architecture

### Components
1. **WalletContext** - Session state and lifecycle management
2. **SessionWarningToast** - 5-minute warning component
3. **SessionTimeoutModal** - 1-minute blocking modal component
4. **Root Layout** - Component integration point

### Data Flow
```
User connects
    ↓
startSessionTracking() called
    ↓
sessionExpiresAt set (now + 15 min)
    ↓
5-minute warning scheduled
    ↓
1-minute blocking modal scheduled
    ↓
Warning triggers → Toast appears (dismissable)
    ↓
Modal triggers → Modal appears (blocking)
    ↓
User extends or session expires
    ↓
Cleanup
```

## File Structure

```
src/
├── context/
│   └── WalletContext.tsx          # Enhanced with session tracking
├── components/
│   ├── SessionWarningToast.tsx    # 5-minute warning toast
│   └── SessionTimeoutModal.tsx    # 1-minute blocking modal
└── app/
    └── layout.tsx                  # Components integrated here
```

## WalletContext Enhancements

### New State Variables
```typescript
const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
const [showSessionWarning5Min, setShowSessionWarning5Min] = useState(false);
const [showSessionWarning1Min, setShowSessionWarning1Min] = useState(false);
const sessionCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
const warning5MinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const warning1MinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### Context Value Export
```typescript
interface WalletContextValue {
  // ... existing fields
  sessionExpiresAt: number | null;
  sessionTimeRemaining: number | null;
  showSessionWarning5Min: boolean;
  showSessionWarning1Min: boolean;
  extendSession: () => Promise<void>;
}
```

### Key Functions

#### startSessionTracking()
Initiates session timeout tracking when user connects.
```typescript
const startSessionTracking = useCallback(() => {
  clearSessionWarnings();
  const expiryTime = Date.now() + SESSION_TIMEOUT_MS;
  setSessionExpiresAt(expiryTime);

  // Schedule 5-minute warning
  const timeUntil5Min = expiryTime - Date.now() - SESSION_WARNING_5MIN_MS;
  if (timeUntil5Min > 0) {
    warning5MinTimeoutRef.current = setTimeout(() => {
      setShowSessionWarning5Min(true);
    }, timeUntil5Min);
  }

  // Schedule 1-minute warning
  const timeUntil1Min = expiryTime - Date.now() - SESSION_WARNING_1MIN_MS;
  if (timeUntil1Min > 0) {
    warning1MinTimeoutRef.current = setTimeout(() => {
      setShowSessionWarning1Min(true);
    }, timeUntil1Min);
  }
}, [clearSessionWarnings]);
```

#### extendSession()
Refreshes the session timeout.
```typescript
const extendSession = useCallback(async () => {
  try {
    const adapter = await getFreighterAdapter();
    const connected = await adapter.isConnected();
    if (connected) {
      startSessionTracking();
      setShowSessionWarning5Min(false);
      setShowSessionWarning1Min(false);
    }
  } catch (err) {
    console.error("Failed to extend session:", err);
  }
}, [startSessionTracking]);
```

#### clearSessionWarnings()
Cleans up all timeouts and resets warning states.
```typescript
const clearSessionWarnings = useCallback(() => {
  if (warning5MinTimeoutRef.current) {
    clearTimeout(warning5MinTimeoutRef.current);
    warning5MinTimeoutRef.current = null;
  }
  if (warning1MinTimeoutRef.current) {
    clearTimeout(warning1MinTimeoutRef.current);
    warning1MinTimeoutRef.current = null;
  }
  if (sessionCheckIntervalRef.current) {
    clearInterval(sessionCheckIntervalRef.current);
    sessionCheckIntervalRef.current = null;
  }
  setShowSessionWarning5Min(false);
  setShowSessionWarning1Min(false);
}, []);
```

### Integration Points

**In connect():**
```typescript
if (publicKey) {
  startSessionTracking();
}
```

**In disconnect():**
```typescript
const disconnect = useCallback(() => {
  setAddress(null);
  setError(null);
  setNetworkMismatch(false);
  setSessionExpiresAt(null);
  clearSessionWarnings();  // ← Added
  // ...
}, [clearSessionWarnings]);
```

**Cleanup effect:**
```typescript
useEffect(() => {
  return () => {
    clearSessionWarnings();
  };
}, [clearSessionWarnings]);
```

## SessionWarningToast Component

### Purpose
Display a dismissable warning at 5 minutes before session expiry.

### Props (via Context)
- `showSessionWarning5Min: boolean` - Show/hide state
- No direct props - subscribes to context

### Features
- Dismissable via close button
- Toast position: top-right
- Amber color scheme
- Icon animation (pulsing)
- Auto-reset on warning change

### Styling
```tsx
className="fixed top-6 right-6 z-40 max-w-sm animate-slide-in-right"
className="bg-amber-900/80 border border-amber-700 rounded-lg shadow-lg"
```

## SessionTimeoutModal Component

### Purpose
Display a blocking modal at 1 minute before session expiry.

### Props (via Context)
- `showSessionWarning1Min: boolean` - Show/hide state
- `sessionTimeRemaining: number | null` - Milliseconds until expiry
- `extendSession: () => Promise<void>` - Extend session callback
- `disconnect: () => void` - Disconnect callback

### Features
- Blocking modal (can't click outside)
- Countdown timer with seconds remaining
- Two action buttons: Extend Session, Disconnect
- Loading state on extend
- Keyboard trap (Escape doesn't close)
- Pulsing countdown display

### Key Functions

**formatTimeRemaining()**
Converts milliseconds to readable format.
```typescript
const formatTimeRemaining = (ms: number | null): string => {
  if (!ms) return "0s";
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}s`;
};
```

**handleExtend()**
Handles extend session action with loading state.
```typescript
const handleExtend = async () => {
  setIsLoading(true);
  try {
    await extendSession();
  } catch (err) {
    console.error("Failed to extend session:", err);
  } finally {
    setIsLoading(false);
  }
};
```

### Styling
```tsx
// Modal container
className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"

// Header
className="bg-red-900/40 border-b border-red-700"

// Buttons
className="bg-green-700 hover:bg-green-800 disabled:bg-green-900"
className="border border-gray-600 hover:border-gray-500"
```

## Integration in Root Layout

### Imports
```typescript
import { SessionWarningToast } from "@/src/components/SessionWarningToast";
import { SessionTimeoutModal } from "@/src/components/SessionTimeoutModal";
```

### Component Placement
```tsx
<ContractVersionProvider>
  {/* ... other components ... */}
  <SessionWarningToast />
  <SessionTimeoutModal />
</ContractVersionProvider>
```

## Constants

```typescript
/** Session timeout in milliseconds (15 minutes default from Freighter). */
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

/** Warning at 5 minutes before session expiry. */
const SESSION_WARNING_5MIN_MS = 5 * 60 * 1000;

/** Blocking modal at 1 minute before session expiry. */
const SESSION_WARNING_1MIN_MS = 1 * 60 * 1000;

/** Interval for checking session expiry. */
const SESSION_CHECK_INTERVAL_MS = 10 * 1000;
```

## Computed Values

### sessionTimeRemaining
Calculated on every render from `sessionExpiresAt`.
```typescript
const sessionTimeRemaining = sessionExpiresAt
  ? Math.max(0, sessionExpiresAt - Date.now())
  : null;
```

## Error Handling

### In extendSession()
```typescript
try {
  const adapter = await getFreighterAdapter();
  const connected = await adapter.isConnected();
  if (connected) {
    // Reset timers
  }
} catch (err) {
  console.error("Failed to extend session:", err);
  // Modal stays open, user can try again or disconnect
}
```

### In disconnect()
All cleanup happens regardless of state:
- Timeouts cleared safely (check for null before clearing)
- States reset to null/false
- No errors propagate

## Testing

### Unit Tests
```typescript
// Test startSessionTracking sets correct expiry time
expect(sessionExpiresAt).toBe(Date.now() + SESSION_TIMEOUT_MS);

// Test sessionTimeRemaining computation
expect(sessionTimeRemaining).toBeCloseTo(SESSION_TIMEOUT_MS, -3);

// Test warning scheduling (check setTimeout calls)
expect(warning5MinTimeoutRef.current).not.toBeNull();
```

### Integration Tests
- Connect wallet → verify timers start
- Wait 10+ minutes → verify toast appears
- Click extend → verify modal closes, timer resets
- Disconnect → verify timers cleared

### Manual Testing
1. Connect wallet
2. Open DevTools → Application → Session Storage
3. Wait 10 minutes (or modify constants for faster testing)
4. Observe toast at 5 minutes
5. Observe modal at 1 minute
6. Test extend and disconnect buttons

## Performance Considerations

### Memory Usage
- 3 timeout refs (minimal)
- 3 state booleans (minimal)
- 1 number (sessionExpiresAt)
- **Per-user impact: < 1 KB**

### CPU Impact
- No polling (setTimeout only)
- One computed value (sessionTimeRemaining)
- Components only render on warning state changes
- **Negligible CPU impact**

### Network Impact
- **0 additional requests** for session tracking
- Extend Session: 1 request (getFreighterAdapter call)
- No polling or periodic requests

## Customization

### Change Session Timeout
```typescript
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
```

### Change Warning Times
```typescript
const SESSION_WARNING_5MIN_MS = 10 * 60 * 1000; // 10 minutes before
const SESSION_WARNING_1MIN_MS = 2 * 60 * 1000; // 2 minutes before
```

### Customize Toast Styling
Edit `SessionWarningToast.tsx` - use Tailwind classes:
```tsx
className="fixed top-6 right-6"  // Position
className="bg-amber-900/80"      // Color
className="animate-slide-in-right" // Animation
```

### Customize Modal Styling
Edit `SessionTimeoutModal.tsx` - same process.

## Future Enhancements

1. **Sync with Freighter's actual timeout**
   - Query Freighter for actual session expiry time
   - More accurate warnings

2. **Persistent session tracking**
   - Store session timestamps in localStorage
   - Detect when tab has been backgrounded

3. **Analytics**
   - Track extend vs. expiry rates
   - User behavior insights

4. **UI Status Indicator**
   - Show session time in header
   - Countdown timer always visible

5. **Session history**
   - Track how many times extended
   - Provide insights to user

## Troubleshooting

### Warnings don't appear
1. Check `showSessionWarning5Min` / `showSessionWarning1Min` in React DevTools
2. Verify `sessionExpiresAt` is set (not null)
3. Check browser console for errors
4. Verify components are in layout

### Memory leaks
1. Verify `clearSessionWarnings()` is called on unmount
2. Check all refs are set to null after clearing
3. Use DevTools to check for detached DOM nodes

### Incorrect timing
1. Check browser clock (use console to verify `Date.now()`)
2. Verify `SESSION_TIMEOUT_MS` constant
3. Check calculation: `expiryTime - Date.now() - SESSION_WARNING_5MIN_MS`

## API Reference

### useWallet() returns
```typescript
{
  // ... existing fields
  sessionExpiresAt: number | null;        // Unix timestamp
  sessionTimeRemaining: number | null;    // Milliseconds
  showSessionWarning5Min: boolean;        // Show toast
  showSessionWarning1Min: boolean;        // Show modal
  extendSession: () => Promise<void>;     // Refresh session
}
```

## Related Files

- `src/context/WalletContext.tsx` - Core session logic
- `src/components/SessionWarningToast.tsx` - Warning toast
- `src/components/SessionTimeoutModal.tsx` - Blocking modal
- `src/app/layout.tsx` - Component integration
- `src/lib/freighter.ts` - Wallet adapter (uses getFreighterAdapter)

## Dependencies

- React 18+ (hooks)
- Freighter adapter (getFreighterAdapter, isConnected)
- Tailwind CSS (styling)
- No external libraries required

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)
