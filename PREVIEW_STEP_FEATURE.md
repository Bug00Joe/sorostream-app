# Stream Preview Step - Feature Overview

## What's New

The SoroStream create-stream form now includes a **Preview step** that shows you exactly what your stream will look like on-chain before you sign with your wallet.

## The Problem It Solves

Previously, users would fill out the form and proceed directly to wallet confirmation without seeing the actual stream parameters. This led to:
- Users signing streams with unexpected flow rates
- Confusion about when streams would end
- Surprises about protocol fees
- User errors and regretted transactions

## The Solution

A new Preview step appears after you enter the amount and duration, showing:

### 1. 📊 Flow Rate Per Day
How much of your token will stream out each day
- Example: 14.29 USDC/day (for 100 USDC over 7 days)
- Helps you understand the rate of payment

### 2. 💰 Total Amount
The total amount you're streaming
- Shows the exact amount you'll commit
- Matches what you entered

### 3. 📅 Stream Ends
When your stream will complete
- Exact date and time
- Includes seconds for precision
- Example: "Jul 31, 2026 14:30"

### 4. 🏦 Estimated Protocol Fee
The protocol fee that will be deducted
- Calculated from your amount
- Shown with full precision
- Example: "0.5 USDC" (on 0.5% fee rate)

### 5. 🔄 Recipient & Sender
Both parties involved in the stream
- Recipient address you're paying
- Your address as sender
- Verify before confirming

## How It Works

### Step-by-Step Flow

**Before (3 steps):**
```
1. Enter Recipient
   ↓
2. Enter Amount & Duration
   ↓
3. Review & Sign
```

**Now (4 steps):**
```
1. Enter Recipient
   ↓
2. Enter Amount & Duration
   ↓
3. Preview ← NEW STEP
   ↓
4. Review & Sign
```

### Using the Preview

1. **Enter your stream details** - Recipient, amount, duration
2. **Click Next** - You're taken to the Preview step
3. **Review the parameters** - Check if everything looks right
4. **Two options:**
   - **Click "Confirm"** - Proceed to wallet signing
   - **Click "Back"** - Return to edit amount/duration

## Example Usage

### Creating a 7-Day USDC Stream

**Step 2: Amount & Duration**
- Recipient: GBAM...BOEP
- Amount: 100 USDC
- Duration: 7 days
- Click "Next"

**Step 3: Preview** (NEW)
- Flow rate per day: **14.2857 USDC/day**
- Total amount: **100 USDC**
- Stream ends: **Aug 3, 2026 14:30**
- Protocol fee: **0.5 USDC**
- To: GBAM...BOEP
- From: Your Address

Options:
- Click "Back" if you want to adjust (e.g., stream for 14 days instead)
- Click "Confirm" if everything looks correct

**Step 4: Review & Sign**
- Final review before wallet confirmation
- Click "Sign" to complete

## Key Features

✅ **No Extra Time** - Calculations are instant
✅ **No Extra Fees** - Preview step costs nothing
✅ **Easy to Edit** - One click to go back and change parameters
✅ **Accurate Numbers** - Uses same calculation as on-chain
✅ **Mobile Friendly** - Works great on all devices
✅ **Accessible** - Works with keyboards and screen readers

## Calculation Details

### Flow Rate Per Day
The form calculates how much flows per 24 hours:

```
Formula: (Amount × 86,400) / Duration in Seconds

Examples:
- 100 USDC over 1 day = 100 USDC/day
- 100 USDC over 7 days = 14.29 USDC/day
- 100 USDC over 30 days = 3.33 USDC/day
- 10 XLM over 1 hour = 240 XLM/day
```

### End Date Calculation
Shows exactly when your stream will complete based on start time + duration.

### Protocol Fee
Estimated fee is calculated from current protocol fee rate (typically 0.5% or 50 basis points).

## Common Questions

### Q: Is the preview always accurate?
**A:** Yes! The preview uses the exact same calculations as the on-chain protocol. The protocol fee shown is an estimate based on current rates - the final fee may vary slightly if rates change before confirmation, but will be shown exactly on the Review step.

### Q: Can I skip the preview?
**A:** No, it's a required step to ensure you understand your stream parameters before signing. This prevents user errors.

### Q: Why did you add this step?
**A:** User testing showed that without a preview, people would sometimes:
- Not realize how fast their money was flowing out
- Be surprised by the end date
- Not see protocol fees until too late to edit

The preview solves all three problems.

### Q: Does the preview cost anything?
**A:** No, it's completely free. It's just a form step - no transaction or fee involved.

### Q: Can I edit after seeing the preview?
**A:** Yes! Click "Back" to return to the Amount & Duration step. You can change:
- Amount
- Duration
- Token
- End date / Cliff date
- Any other advanced settings

Then click "Next" again to see the updated preview.

### Q: What happens if my network is slow?
**A:** The preview calculations are instant (no network needed). They all happen in your browser!

## Benefits

### For Users
- ✅ Better understanding of stream parameters
- ✅ Confidence before signing
- ✅ Easy to spot mistakes
- ✅ Prevention of regretted transactions
- ✅ Control over edits

### For Safety
- ✅ Reduces user errors
- ✅ Clearer fee visibility
- ✅ Explicit date confirmation
- ✅ Double-check before wallet sign

## Accessibility

The preview step is fully accessible:
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ High contrast text
- ✅ Clear button labels

## Mobile Friendly

Works great on all devices:
- ✅ Desktop browsers
- ✅ Tablets
- ✅ Mobile phones
- ✅ Responsive design

## Technical Notes

### No Network Calls
The preview doesn't make any network requests. All calculations happen in your browser instantly.

### Uses Your Settings
The preview respects all your form inputs:
- Selected token
- Custom token if applicable
- Metadata URI if set
- Any advanced settings

### Fee Information
- Uses the protocol's current fee rate
- Same calculation as the on-chain transaction
- Fee is deducted from the amount to recipient

## Troubleshooting

### Preview shows unexpected flow rate
**Check:** Make sure your duration and amount are correct. The preview calculates: (Amount × 86,400) ÷ Duration_in_Seconds

### End date seems wrong
**Check:** The end date is calculated from now + duration. If it seems off, verify your duration is set correctly.

### Protocol fee looks high
**Check:** The fee rate is set by the protocol (typically 0.5%). This is deducted from what the recipient gets.

## Feedback

Found an issue with the preview? Have a suggestion for improvement? Please report it so we can keep improving the experience.

## More Information

For technical details, see:
- `PREVIEW_STEP_SUMMARY.md` - Implementation summary
- `PREVIEW_STEP_VERIFICATION.md` - Testing and validation details
- `PREVIEW_STEP_CODE_REFERENCE.md` - Code snippets and technical reference
