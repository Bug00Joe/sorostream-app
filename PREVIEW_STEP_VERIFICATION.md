# Preview Step Implementation - Verification

## Overview
The preview step has been successfully added to the create-stream form flow. Users will now see a preview of their stream parameters before signing with their wallet.

## Implementation Details

### Step Flow
The form now has 4 steps instead of 3:
1. **Recipient** - Select payment recipient
2. **Amount & Duration** - Set stream amount and duration
3. **Preview** (NEW) - View expected stream parameters
4. **Review & Confirm** - Final review and wallet signing

### Preview Step Features

#### Displayed Information
- **Flow rate per day** - Calculated from total amount ÷ duration
- **Total amount** - The total USDC/token being streamed
- **Stream ends** - The date/time when the stream will complete
- **Estimated protocol fee** - Fee calculated from feeBasisPoints
- **Recipient and Sender Summary** - Shows both parties' addresses

#### User Actions
- **Back Button** - Returns to Amount & Duration step to edit parameters
- **Confirm Button** - Proceeds to Review & Confirm step for wallet signing

### Calculation Formulas

#### Flow Rate Per Day
```
flowRatePerDay = (amount * 86400) / durationSeconds
```
- Takes total amount over stream duration
- Converts to daily rate (86400 seconds = 1 day)
- Displayed with 7 decimal places, trailing zeros removed

#### End Date
```
endDate = now() + (durationSeconds * 1000)
```
- Current time plus duration
- Formatted as: "MMM D, YYYY HH:MM"

#### Protocol Fee
```
feeStroops = floor((amountStroops * basisPoints) / 10000)
```
- Uses protocol fee configuration (default 50 bps = 0.5%)
- Converted to display currency from stroops (÷ 10,000,000)
- Displayed with 7 decimal places, trailing zeros removed

## Code Changes

### Files Modified
- `/src/app/stream/new/page.tsx` - Main form component

### Key Changes

#### 1. Step Type Update
```typescript
type Step = "recipient" | "amount" | "preview" | "review";

const stepLabels: Record<Step, { title: string; number: number }> = {
  recipient: { title: "Recipient", number: 1 },
  amount: { title: "Amount & Duration", number: 2 },
  preview: { title: "Preview", number: 3 },
  review: { title: "Review & Confirm", number: 4 },
};

const STEPS: Step[] = ["recipient", "amount", "preview", "review"];
```

#### 2. Navigation Logic
- `goNext()` - From amount step, now goes to preview (was: review)
- `goBack()` - Already supports all steps via STEPS array
- `goConfirmPreview()` - New function to move from preview to review

#### 3. Preview State Management
```typescript
const [previewLoading, setPreviewLoading] = useState(false);
```
Tracks when preview is being computed (for future async operations).

#### 4. Calculation Utilities
Three new helper functions:
- `calculateFlowRatePerDay(durationSeconds, amountUSDC)` - Returns flow rate/day
- `calculateEndDate(durationSeconds)` - Returns Date object for stream end
- `formatFlowRate(flowRatePerDay)` - Formats with 7 decimals, removes trailing zeros

#### 5. Preview UI
Located between amount and review steps, displays:
- Main info box showing 4 key parameters
- Info box explaining next steps
- Recipient and sender addresses
- Back and Confirm buttons

#### 6. Navigation Buttons
Updated to:
- Show "Confirm" button on preview step
- Show "Next" button on recipient and amount steps
- Show "Sign" button on review step

#### 7. Progress Indicator
Already updated automatically since it uses the STEPS array:
- Now shows 4 circles (1, 2, 3, 4) instead of 3
- Automatically highlights current step
- Shows completed steps with checkmarks

## Testing Checklist

### Basic Flow
- [ ] Form loads with Recipient step (step 1/4)
- [ ] Entering recipient shows "Next" button
- [ ] Clicking Next goes to Amount & Duration (step 2/4)
- [ ] Entering amount and duration shows "Next" button
- [ ] Clicking Next goes to Preview (step 3/4)
- [ ] Preview displays all 4 key parameters
- [ ] Clicking "Confirm" goes to Review (step 4/4)
- [ ] Clicking "Back" on Preview returns to Amount & Duration

### Calculations
- [ ] Flow rate calculation is correct (test: 100 USDC over 1 day = 100/day)
- [ ] Flow rate calculation handles fractions correctly
- [ ] End date is correct (within 1 minute of expected time)
- [ ] End date formats correctly as "MMM D, YYYY HH:MM"
- [ ] Protocol fee calculation uses current feeBasisPoints
- [ ] Fee is displayed with correct decimal places

### Display
- [ ] Preview title shows "Preview" in progress indicator
- [ ] All 4 steps visible in progress indicator
- [ ] Completed steps show checkmarks
- [ ] Current step is highlighted in green
- [ ] Flow rate displays with proper unit (USDC/day, XLM/day, etc.)
- [ ] Long addresses are truncated with proper styling
- [ ] Info box explains wallet signing on next step

### Navigation
- [ ] Back button on Preview returns to Amount & Duration
- [ ] Back button disabled on Recipient
- [ ] Confirm button on Preview proceeds to Review
- [ ] Can edit amount/duration, go back to Preview, see updated calculations
- [ ] Form state persists when navigating back and forth

### Edge Cases
- [ ] Very small amounts (< 1 token) display correctly
- [ ] Very large amounts (> 1000000 tokens) don't break layout
- [ ] Fractional amounts show proper decimals
- [ ] Duration of 1 hour shows correct flow rate
- [ ] Duration of 1 second shows extreme flow rate correctly
- [ ] Zero duration doesn't cause division errors (shouldn't reach preview)
- [ ] Custom tokens display correct unit in flow rate

### Accessibility
- [ ] Tab navigation works through all form elements
- [ ] Back and Confirm buttons are keyboard accessible
- [ ] No console errors during navigation
- [ ] Screen reader can read all preview information

## Example Scenarios

### Scenario 1: Standard Stream
- Recipient: G...ABC (valid)
- Amount: 100 USDC
- Duration: 7 days (604,800 seconds)
- Expected Flow Rate: 100 ÷ 7 ≈ 14.2857 USDC/day
- Expected End Date: 7 days from now
- Expected Fee: 100 * 0.005 = 0.5 USDC (at 50 bps)

### Scenario 2: Short Duration
- Recipient: G...XYZ (valid)
- Amount: 10 XLM
- Duration: 1 hour (3,600 seconds)
- Expected Flow Rate: 10 * 86400 ÷ 3600 = 240 XLM/day
- Expected End Date: 1 hour from now
- Expected Fee: 10 * 0.005 = 0.05 XLM

### Scenario 3: Very Precise Amount
- Recipient: G...DEF (valid)
- Amount: 123.456789 USDC
- Duration: 30 days (2,592,000 seconds)
- Expected Flow Rate: 123.456789 ÷ 30 ≈ 4.115226 USDC/day
- All 7 decimal places preserved

## Future Enhancements

Potential improvements for future iterations:

1. **Async Fee Fetching**
   - Currently fees are fetched when reaching review step
   - Could be fetched earlier on preview step
   - Show loading state while fetching

2. **Additional Metrics**
   - Total cost including fee
   - Net amount recipient receives
   - Seconds per token rate for technical users

3. **Metadata Display**
   - Show metadata URI if set
   - Display any other advanced settings

4. **Customization**
   - Allow user to configure what's shown in preview
   - Dark mode preview vs light mode

5. **Comparison**
   - Compare with previous stream if cloning
   - Show what will change if editing

## Known Limitations

1. **Fee Calculation**
   - Fee is calculated client-side, actual on-chain fee may vary
   - Uses cached feeBasisPoints, real value fetched on review step

2. **End Date Display**
   - Displayed time assumes client timezone is correct
   - May differ if client time is off

3. **Token Precision**
   - Calculations use JavaScript number type (64-bit float)
   - Very large numbers may lose precision
   - Acceptable for typical USDC/XLM streaming amounts

## Rollback Plan

If issues are found, the preview step can be removed by:

1. Changing Step type back: `type Step = "recipient" | "amount" | "review";`
2. Updating STEPS array: `["recipient", "amount", "review"]`
3. In goNext(), change `setStep("preview")` to `setStep("review")`
4. Remove preview step render block

These changes would restore the 3-step form without the preview step.
