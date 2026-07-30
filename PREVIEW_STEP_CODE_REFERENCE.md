# Preview Step - Code Reference Guide

## Quick Reference

### Step Type Definition
```typescript
type Step = "recipient" | "amount" | "preview" | "review";
```

### STEPS Array
```typescript
const STEPS: Step[] = ["recipient", "amount", "preview", "review"];
```

### Step Labels
```typescript
const stepLabels: Record<Step, { title: string; number: number }> = {
  recipient: { title: "Recipient", number: 1 },
  amount: { title: "Amount & Duration", number: 2 },
  preview: { title: "Preview", number: 3 },
  review: { title: "Review & Confirm", number: 4 },
};
```

## State Variables

### Preview State
```typescript
const [previewLoading, setPreviewLoading] = useState(false);
```

Used to track when preview data is being calculated (for future async operations).

## Navigation Functions

### goNext - Navigate Forward
```typescript
function goNext() {
  if (step === "recipient") {
    const err = validateRecipient(recipient);
    if (err) {
      setErrors((prev) => ({ ...prev, recipient: err }));
      setTouched((prev) => ({ ...prev, recipient: true }));
      return;
    }
    setStep("amount");
  } else if (step === "amount") {
    const aErr = validateAmount(amount);
    const dErr = validateDuration(duration);
    const eErr = validateEndDate(endDate);
    const cErr = validateCliffDate(cliffDate, endDate);
    const sErr = schedulingEnabled ? validateScheduledStart(scheduledStart) : "";
    if (aErr || dErr || eErr || cErr || sErr) {
      setErrors({ ...errors, amount: aErr, duration: dErr, endDate: eErr, cliffDate: cErr, scheduledStart: sErr });
      return;
    }
    setStep("preview");  // ← Changed from "review" to "preview"
  }
}
```

### goBack - Navigate Backward
```typescript
function goBack() {
  const idx = STEPS.indexOf(step);
  if (idx > 0) setStep(STEPS[idx - 1]);
}
```

### goConfirmPreview - From Preview to Review
```typescript
function goConfirmPreview() {
  // From preview step, go to review step
  setStep("review");
}
```

## Calculation Utilities

### Calculate Flow Rate Per Day
```typescript
function calculateFlowRatePerDay(durationSeconds: number, amountUSDC: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  const secondsPerDay = 86400;
  return (amountUSDC * secondsPerDay) / durationSeconds;
}
```

**Formula:** `(amount × 86400) / duration_seconds`

**Examples:**
- 100 USDC over 86400 seconds (1 day) = 100 USDC/day
- 100 USDC over 604800 seconds (7 days) = 14.2857 USDC/day
- 10 XLM over 3600 seconds (1 hour) = 240 XLM/day

### Calculate End Date
```typescript
function calculateEndDate(durationSeconds: number): Date {
  return new Date(Date.now() + durationSeconds * 1000);
}
```

**Returns:** JavaScript Date object for stream end time

**Conversion:** Duration is in seconds, JavaScript Date needs milliseconds (×1000)

### Format Flow Rate
```typescript
function formatFlowRate(flowRatePerDay: number): string {
  return flowRatePerDay.toFixed(7).replace(/\.?0+$/, "") || "0";
}
```

**Features:**
- Pads to 7 decimal places
- Removes trailing zeros
- Returns "0" for falsy values

**Examples:**
- 14.285714285... → "14.2857143"
- 10.5 → "10.5"
- 0.0001 → "0.0001"

## Preview UI Component

### Main Preview Container
```typescript
{step === "preview" && (
  <div className="space-y-6">
    {/* Content goes here */}
  </div>
)}
```

### Flow Rate Section
```tsx
<div>
  <span className="text-gray-400 text-sm">Flow rate per day</span>
  <div className="text-2xl font-bold text-green-400 mt-1 font-mono">
    {formatFlowRate(calculateFlowRatePerDay(duration, parseFloat(amount) || 0))} {selectedToken === CUSTOM_TOKEN_VALUE ? "tokens" : selectedToken}/day
  </div>
</div>
```

### Total Amount Section
```tsx
<div className="border-t border-gray-700 pt-4">
  <span className="text-gray-400 text-sm">Total amount</span>
  <div className="text-lg font-semibold text-white mt-1">
    {amount} {selectedToken === CUSTOM_TOKEN_VALUE ? "tokens" : selectedToken}
  </div>
</div>
```

### Stream End Date Section
```tsx
<div className="border-t border-gray-700 pt-4">
  <span className="text-gray-400 text-sm">Stream ends</span>
  <div className="text-lg font-semibold text-white mt-1">
    {calculateEndDate(duration).toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    })}
  </div>
</div>
```

### Protocol Fee Section
```tsx
<div className="border-t border-gray-700 pt-4">
  <span className="text-gray-400 text-sm">Estimated protocol fee</span>
  <div className="text-lg font-semibold text-yellow-400 mt-1">
    {feeLoading ? (
      <span className="text-gray-400 text-sm">Loading...</span>
    ) : (
      (() => {
        const amountNum = parseFloat(amount) || 0;
        const amountStroops = Math.round(amountNum * 10_000_000);
        const { fee } = calcWithdrawBreakdown(amountStroops, feeBasisPoints);
        const feeDisplay = (fee / 10_000_000).toFixed(7).replace(/\.?0+$/, "") || "0";
        const tokenLabel = selectedToken === CUSTOM_TOKEN_VALUE ? "tokens" : selectedToken;
        return `${feeDisplay} ${tokenLabel}`;
      })()
    )}
  </div>
</div>
```

### Summary Section (Recipient & Sender)
```tsx
<div className="border-t border-gray-700 pt-4 space-y-3">
  <div className="flex justify-between items-start text-sm">
    <span className="text-gray-400">To</span>
    <span className="text-white font-mono text-xs text-right max-w-[60%] break-all">
      {recipient}
    </span>
  </div>
  <div className="flex justify-between items-start text-sm">
    <span className="text-gray-400">From</span>
    <span className="text-white font-mono text-xs text-right max-w-[60%] break-all">
      {address ?? "—"}
    </span>
  </div>
</div>
```

### Info Box (Explanation)
```tsx
<div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
  <p className="text-blue-300 text-sm">
    Review the details above. Click "Confirm" to proceed to sign this transaction with your wallet, or "Back" to edit the stream parameters.
  </p>
</div>
```

## Navigation Buttons

### Updated Button Logic
```typescript
{step === "preview" ? (
  <button
    type="button"
    onClick={goConfirmPreview}
    disabled={loading}
    className="flex-1 bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
  >
    Confirm
  </button>
) : step !== "review" ? (
  <button
    type="button"
    onClick={goNext}
    disabled={!canGoNext}
    className="flex-1 bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
  >
    Next
  </button>
) : (
  <button
    type="button"
    onClick={handleCreateStream}
    disabled={loading}
    aria-label="Confirm and sign transaction"
    className="flex-1 bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
  >
    {/* Sign button content */}
  </button>
)}
```

## Styling Classes

### Containers
- Main box: `bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-700`
- Info box: `bg-blue-900/20 border border-blue-700/50 rounded-lg p-4`
- Section divider: `border-t border-gray-700 pt-4`

### Text
- Label: `text-gray-400 text-sm`
- Title: `text-lg font-semibold text-white`
- Emphasis: `text-2xl font-bold text-green-400`
- Mono (addresses): `font-mono text-xs text-right max-w-[60%] break-all`
- Info text: `text-blue-300 text-sm`
- Fee text: `text-yellow-400`

### Buttons
- Primary: `bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800`
- Secondary: `border border-gray-600 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700`
- Disabled: `disabled:opacity-50`

## Progress Indicator

The progress indicator automatically includes preview since it uses STEPS array:

```typescript
{STEPS.map((s, i) => (
  <div key={s} className="flex items-center gap-2">
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
        step === s
          ? "bg-green-700 text-white"           // Current step
          : STEPS.indexOf(step) > i
          ? "bg-green-800 text-green-300"       // Completed steps
          : "bg-gray-700 text-gray-400"         // Future steps
      }`}
    >
      {STEPS.indexOf(step) > i ? "✓" : i + 1}
    </div>
    <span className={`text-xs hidden sm:inline ${step === s ? "text-white" : "text-gray-400"}`}>
      {stepLabels[s].title}
    </span>
    {i < STEPS.length - 1 && (
      <div className={`w-8 h-px ${STEPS.indexOf(step) > i ? "bg-green-600" : "bg-gray-700"}`} />
    )}
  </div>
))}
```

## Integration Points

### Fee Configuration
The preview uses the fee configuration fetched on the review step:
```typescript
// On review step entry, this loads:
const { basisPoints } = await getFeeConfig();
```

Uses in preview:
```typescript
const { fee } = calcWithdrawBreakdown(amountStroops, feeBasisPoints);
```

### Form State Dependencies
Preview reads from existing form state:
- `duration` - Stream duration in seconds
- `amount` - USDC/token amount as string
- `selectedToken` - Token symbol or custom flag
- `recipient` - Recipient address
- `address` - Sender address from wallet

### Persistence
Preview state is not persisted separately. It's recalculated from amount and duration.

## Error Handling

### Division by Zero
```typescript
if (!durationSeconds || durationSeconds <= 0) return 0;
```

### Invalid Amount
```typescript
parseFloat(amount) || 0  // Returns 0 if amount is invalid
```

### Missing Address
```typescript
{address ?? "—"}  // Shows dash if address not set
```

## Performance Considerations

- All calculations are synchronous and fast (< 1ms)
- No network requests on preview step
- No additional re-renders on navigation
- Date formatting is done once on render

## Testing Examples

### Test Flow Rate Calculation
```typescript
const flowRate = calculateFlowRatePerDay(604800, 100);
expect(flowRate).toBeCloseTo(14.2857, 4);  // 100 USDC / 7 days
```

### Test End Date Calculation
```typescript
const endDate = calculateEndDate(86400);  // 1 day
expect(endDate.getTime()).toBeGreaterThan(Date.now());
```

### Test Format Flow Rate
```typescript
expect(formatFlowRate(14.285714285)).toBe("14.2857143");
expect(formatFlowRate(10.5)).toBe("10.5");
expect(formatFlowRate(0)).toBe("0");
```
