# Wallet Session Timeout - User Guide

## What's Happening?

SoroStream now monitors your wallet session and alerts you before it expires. This prevents the frustrating experience of having your wallet disconnect mid-form without warning.

## How It Works

When you connect your Freighter wallet:

### Timeline
- **Connected** - Your session is active for 15 minutes
- **After 10 minutes** - Countdown timer starts
- **At 10 minutes** - 5-minute warning toast appears (dismissable)
- **At 14 minutes** - 1-minute warning modal appears (blocking)
- **At 15 minutes** - Session expires (if not extended)

## Warning Signs

### 1. 5-Minute Warning Toast (Dismissable)

At the top-right corner of your screen, you'll see an amber notification:

```
⏰ Wallet session expiring soon
Your wallet session will expire in 5 minutes. 
A modal will appear before it expires.
[X]
```

**What to do:**
- You can dismiss this by clicking the X
- You'll get a blocking modal before it actually expires
- This is just a heads-up notification

### 2. 1-Minute Warning Modal (Blocking)

One minute before expiry, a red modal dialog appears:

```
⏰ Session Expiring Soon

Your wallet session will expire in 60s

To continue using SoroStream, you can either:
• Extend Session: Refresh your wallet connection to continue
• Disconnect: Sign out and reconnect later

⚠️ Warning: If your session expires, you may lose unsaved form data and will need to reconnect.

[Extend Session] [Disconnect]
```

**What to do:**
- Click **"Extend Session"** to keep working (most common)
- OR Click **"Disconnect"** if you're done

## What Happens If...

### Session Expires
- Your wallet automatically disconnects
- Any unsaved form data is lost
- You need to reconnect to continue
- **This is preventable!** Just click Extend Session before it expires

### You Click "Extend Session"
- Your session extends by 15 more minutes
- The modal closes
- You continue working normally
- You get another 15-minute countdown

### You Click "Disconnect"
- Your wallet session ends immediately
- You're returned to the home page
- You can reconnect anytime by clicking "Connect Wallet"

### You Ignore the Modal
- The 60-second countdown continues
- At exactly 15 minutes: Session expires
- Form data is lost
- You must reconnect

## Tips to Avoid Problems

✅ **Best Practice**
- Click "Extend Session" when the modal appears
- Takes 1-2 seconds
- Prevents any data loss
- You get another 15 minutes

✅ **If You're Busy**
- The toast appears 5 minutes early
- It's dismissable - no pressure
- You still have time before the modal

✅ **Saving Your Work**
- If you have unsaved form data, complete your form BEFORE the modal appears
- Or extend your session and continue
- Don't let it expire mid-transaction

✅ **Quick Operations**
- Creating a simple stream? Takes 1-2 minutes
- You won't even see the warning
- Regular session is plenty of time

## FAQ

**Q: Can I increase the session timeout?**
A: The 15-minute timeout is set by Freighter. Each extend gives you 15 more minutes.

**Q: Do I lose my wallet connection if session expires?**
A: Yes, your session disconnects, but your wallet data (on Freighter) is safe. You just need to reconnect.

**Q: What if I'm in the middle of a form?**
A: That's exactly why we warn you! Click "Extend Session" to keep your session alive while you finish.

**Q: Can I turn off these warnings?**
A: No, they're built-in for your protection. But they're not annoying - just one toast and one modal per session.

**Q: Why 5 minutes and 1 minute warnings?**
A: 5 minutes gives you a gentle heads-up. 1 minute is your last chance to extend before it's too late.

**Q: Do I get these warnings every session?**
A: Yes, but only if your session reaches those time points. Each warning is for one session timeout event.

**Q: What if I extend multiple times?**
A: Each extension adds 15 minutes. You can extend as many times as needed. Warnings appear again at 5 and 1 minute before the new timeout.

**Q: Is my data safe if I extend?**
A: Yes! Extending just resets your session timer. All your form data stays exactly as it is.

## Keyboard Access

- Press **Tab** to navigate between buttons
- Press **Enter** to click the focused button
- ⚠️ You cannot press Escape to close the modal (it's intentionally blocking)

## Accessibility

The warnings are fully accessible:
- Screen readers announce the timeout warning
- Color alone doesn't convey information
- Buttons are keyboard navigable
- Countdown timer is readable text

## Technical Details

- Session timeout: 15 minutes from connection
- 5-minute warning: Dismissable toast
- 1-minute warning: Blocking modal
- Warning timers reset when you extend
- All warnings cleared when you disconnect

## Troubleshooting

**I don't see the warnings**
- Make sure you're logged in (check top-right corner for your address)
- Wait 10 minutes after connecting
- Check if notifications are blocked in your browser

**The modal won't go away after I click Extend**
- It may take 1-2 seconds to process
- Check your browser console for errors
- Try disconnecting and reconnecting

**Session expired but I didn't see a warning**
- If you connected less than 10 minutes ago, warnings don't show
- Check the time since you connected
- Reconnect and try again

**I lost my form data**
- Unfortunately, if session expired and you lost data, you'll need to re-enter it
- In the future, watch for the warnings or save frequently
- Click "Extend Session" when the modal appears

## Need Help?

If you experience issues:
1. Check the Troubleshooting section above
2. Try disconnecting and reconnecting
3. Refresh the page (but note: unsaved form data will be lost)
4. Contact support with the time the issue occurred
