# Bulk Stream Cancellation - User & Developer Guide

## Overview

The bulk stream cancellation feature enables users managing payroll or grant disbursements to efficiently cancel multiple streams at once, rather than canceling them individually. This is critical for high-volume use cases like payroll administration or grant program distribution.

## User Guide

### Enabling Multi-Select Mode

1. Go to the Dashboard page
2. Click the **"Select Multiple"** button in the top-right corner
3. The button will highlight in blue with a checkmark (✓) when active
4. Checkboxes will appear on all stream cards

### Selecting Streams

**Selecting Individual Streams:**
- Click the checkbox on any stream card
- Or click a row to toggle its checkbox

**Select All:**
- Use the "Select all visible streams" checkbox in the bulk actions bar
- This selects all streams matching your current filters
- Useful for canceling all streams in a particular status or token

**Keyboard Navigation:**
- Tab to move between checkboxes
- Space to toggle selection

### Bulk Cancellation

1. After selecting streams, you'll see a bulk actions bar appear
2. Look for the **"Cancel All"** button (red, shows selected count)
3. Click **"Cancel All"** to open the confirmation modal
4. Review the streams being cancelled:
   - Shows count: "Cancel N streams?"
   - Lists up to 10 streams with recipient info
   - Shows "N streams selected" if > 10
5. Click **"Yes, Cancel All"** to confirm, or **"Keep Streams"** to go back
6. Spinner shows progress during cancellation
7. Success toast confirms cancellation

### Other Bulk Actions

**Export CSV:**
- Select streams
- Click **"Export CSV"** button
- Downloads transaction history for all selected streams

**Top-up All:**
- Select streams
- Click **"Top-up All"** button
- Tops up all selected streams in one operation

**Clear Selection:**
- Click the **"✕"** button to deselect all streams
- Or click **"Select Multiple"** again to exit multi-select mode

### Example Workflow: Cancel Payroll Cohort

```
1. Go to Dashboard
2. Click "Select Multiple" button
3. Filter by Status = "Active" (if needed)
4. Click "Select all visible streams" checkbox
5. Review selected count
6. Click "Cancel All"
7. Confirm in modal
8. Wait for success notification
```

## Developer Guide

### Architecture

The bulk operations system is integrated into the dashboard with:
- **Multi-select state:** `multiSelectMode` boolean
- **Selection state:** `selectedIds` Set<string>
- **Confirmation state:** `showBulkCancelConfirm` boolean

### Components Involved

1. **Dashboard Header**
   - "Select Multiple" toggle button
   - Visual feedback (blue background when active)

2. **StreamCard**
   - Conditional checkbox rendering
   - Receives `selected` and `onToggle` props
   - Checkbox only shows when `onToggle` is defined

3. **StreamVirtualList**
   - Passes `selectedIds` and `onToggleSelect` to cards
   - Only when multi-select mode is active

4. **Bulk Actions Bar**
   - Shows when `selectedIds.size > 0`
   - Displays selection count
   - Provides action buttons: Export, Top-up, Cancel

5. **Bulk Cancel Confirmation Modal**
   - Shows selected stream count
   - Lists individual streams (limited to 10)
   - Requires explicit confirmation

### Key Functions

**toggleSelect(id: string)**
```typescript
const toggleSelect = useCallback((id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}, []);
```

**toggleSelectAll()**
```typescript
const toggleSelectAll = useCallback(() => {
  if (allFilteredSelected) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(filtered.map((s) => s.id)));
  }
}, [allFilteredSelected, filtered]);
```

**handleBulkCancel()**
```typescript
const handleBulkCancel = useCallback(async () => {
  const ids = Array.from(selectedIds);
  if (ids.length === 0) return;
  setBulkLoading(true);
  try {
    await Promise.all(ids.map((id) => sorostream.cancelStream(id)));
    addToast(`Cancelled ${ids.length} stream(s) successfully.`, "success");
    const data = await rpcFetch(() => Promise.resolve(getStreamsForWallet(address)));
    setStreams(data);
    clearSelection();
    setShowBulkCancelConfirm(false);
  } catch (err) {
    addToast("Bulk cancel failed. Please try again.", "error");
  } finally {
    setBulkLoading(false);
  }
}, [selectedIds, addToast, rpcFetch, clearSelection, address]);
```

### State Management

```typescript
// Multi-select mode toggle
const [multiSelectMode, setMultiSelectMode] = useState(false);

// Selection tracking
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Confirmation modal
const [showBulkCancelConfirm, setShowBulkCancelConfirm] = useState(false);

// Loading state during operations
const [bulkLoading, setBulkLoading] = useState(false);
```

### Conditional Rendering Logic

Checkboxes only show when:
```typescript
<StreamVirtualList
  streams={sortedFiltered}
  selectedIds={multiSelectMode ? selectedIds : undefined}
  onToggleSelect={multiSelectMode ? toggleSelect : undefined}
/>
```

The bulk actions bar only renders when:
```typescript
{selectedIds.size > 0 && (
  <div className="mb-4 flex flex-wrap items-center gap-3 ...">
    {/* Bulk actions */}
  </div>
)}
```

### API Integration

Each bulk operation calls the SDK method for each stream:

```typescript
// Cancel operation
await Promise.all(ids.map((id) => sorostream.cancelStream(id)));

// Top-up operation
await Promise.all(ids.map((id) => sorostream.topUp(id)));

// Export operation (no API call, just CSV generation)
const allEntries = ids.flatMap((id) => getMockStreamHistory(id));
downloadCSV(allEntries, `bulk-${ids.length}-streams`);
```

### Confirmation Modal Details

The modal shows:
- **Header:** "Cancel N Stream(s)?" with warning
- **Body:** List of streams being cancelled (up to 10)
- **Footer:** Two buttons - "Keep Streams" or "Yes, Cancel All"
- **Loading State:** Shows spinner during operation

For > 10 streams, shows a summary count instead of listing all.

## Features

✅ **Efficient Bulk Operations**
- Cancel dozens of streams in one click
- No need to go to each stream individually

✅ **Safety**
- Confirmation modal prevents accidental cancellations
- Shows which streams will be cancelled
- Clear error messages if operation fails

✅ **Filter Integration**
- Select All respects active filters (status, token, search, bookmarks)
- Excellent for targeting specific cohorts

✅ **Visual Feedback**
- "Select Multiple" button highlights when active
- Checkboxes appear only in multi-select mode
- Bulk actions bar shows selection count
- Loading spinner during cancellation

✅ **Keyboard Accessible**
- Tab between checkboxes
- Space to toggle selection
- Enter to confirm actions
- Proper ARIA labels

✅ **High-Volume Friendly**
- Virtual list maintains performance even with hundreds of streams
- Bulk operations batched via Promise.all()
- Single request to refresh data after operation

## Use Cases

### Payroll Administration
1. Filter by Status = "Active" and current pay period
2. Select all streams for the cohort
3. Cancel all at once when payroll cycle ends
4. No per-stream confirmation needed after bulk confirmation

### Grant Disbursement
1. Create multiple streams for grant recipients
2. If criteria change, filter and cancel entire cohort
3. Regenerate with new terms
4. All handled in one workflow

### Token Migration
1. Filter by Token = "OldToken"
2. Select all
3. Cancel all at once
4. Recreate with new token

## Performance Considerations

- **Virtual List:** Handles thousands of streams smoothly
- **Promise.all():** Parallel cancellations (not sequential)
- **Batch Refresh:** Single API call to refresh all streams after operation
- **Memory:** Selection stored as Set<string>, minimal overhead
- **UI Updates:** Only re-render when necessary (state changes)

## Accessibility

- ✅ Keyboard navigation fully supported
- ✅ Screen reader compatible (ARIA labels)
- ✅ Proper focus management
- ✅ Color + icon differentiation (not color-only)
- ✅ Confirmation prevents accidental actions

## Future Enhancements

1. **Scheduled Bulk Operations**
   - Schedule bulk cancellations for a specific time
   - Useful for payroll cycles that recur

2. **Bulk Edit**
   - Modify streams in bulk (e.g., change recipient if address changed)

3. **Dry Run**
   - Preview what would happen without applying
   - Useful for large operations

4. **Undo Bulk Operations**
   - Brief window to undo (like single stream cancel)
   - Recreates cancelled streams

5. **Templates for Bulk Creation**
   - Create multiple streams from template in one click
   - Inverse of bulk cancel

## Troubleshooting

**Selection not showing up?**
- Click "Select Multiple" button to enable multi-select mode
- Checkboxes should appear on all cards

**Why are only some streams selectable?**
- Active filters may be hiding some streams
- Check Status, Token, and Search filters
- Click "Clear All" to see all streams

**Cancellation failed**
- Check network connection
- Some streams may have already been cancelled
- Try again or check individual stream status

**Can't exit multi-select mode?**
- Click "Select Multiple" button again to toggle it off
- Selection will be cleared automatically
