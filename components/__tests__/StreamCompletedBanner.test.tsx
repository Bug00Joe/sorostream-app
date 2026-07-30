import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import StreamCompletedBanner from '../StreamCompletedBanner';

// ---------------------------------------------------------------------------
// Suppress Notification API noise in jsdom
// ---------------------------------------------------------------------------
const originalNotification = global.Notification;

beforeAll(() => {
  // jsdom doesn't support the Notification API — stub it so the component
  // does not throw when it checks window.Notification.
  Object.defineProperty(global, 'Notification', {
    value: class {
      static permission = 'denied';
      constructor() {}
    },
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(global, 'Notification', {
    value: originalNotification,
    writable: true,
    configurable: true,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StreamCompletedBanner', () => {
  it('renders the completed banner with the final amount', () => {
    render(
      <StreamCompletedBanner
        streamId="42"
        finalAmount="100.0000000"
        onClaim={vi.fn()}
      />,
    );

    expect(screen.getByTestId('stream-completed-banner')).toBeInTheDocument();
    expect(screen.getByText(/Stream Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/100.0000000 USDC/i)).toBeInTheDocument();
  });

  it('shows the "Claim Final Amount" button', () => {
    render(
      <StreamCompletedBanner
        streamId="1"
        finalAmount="50.0000000"
        onClaim={vi.fn()}
      />,
    );

    const btn = screen.getByTestId('claim-final-amount-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('calls onClaim when the CTA button is clicked', () => {
    const onClaim = vi.fn();
    render(
      <StreamCompletedBanner
        streamId="1"
        finalAmount="50.0000000"
        onClaim={onClaim}
      />,
    );

    fireEvent.click(screen.getByTestId('claim-final-amount-btn'));
    expect(onClaim).toHaveBeenCalledOnce();
  });

  it('disables the button and shows "Claiming…" while claiming is true', () => {
    render(
      <StreamCompletedBanner
        streamId="1"
        finalAmount="50.0000000"
        onClaim={vi.fn()}
        claiming={true}
      />,
    );

    const btn = screen.getByTestId('claim-final-amount-btn');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/Claiming/i);
  });

  it('shows the claimed/completion state when claimed=true', () => {
    render(
      <StreamCompletedBanner
        streamId="1"
        finalAmount="50.0000000"
        onClaim={vi.fn()}
        claimed={true}
      />,
    );

    expect(screen.getByTestId('stream-completed-claimed')).toBeInTheDocument();
    expect(screen.getByText(/All funds claimed/i)).toBeInTheDocument();
    // The CTA button should NOT be present in the claimed state
    expect(screen.queryByTestId('claim-final-amount-btn')).not.toBeInTheDocument();
  });

  it('sends a browser notification when Notification permission is granted', () => {
    const notifSpy = vi.fn();
    Object.defineProperty(global, 'Notification', {
      value: class {
        static permission = 'granted';
        constructor(title: string, opts?: NotificationOptions) {
          notifSpy(title, opts);
        }
      },
      writable: true,
      configurable: true,
    });

    render(
      <StreamCompletedBanner
        streamId="7"
        finalAmount="25.0000000"
        onClaim={vi.fn()}
      />,
    );

    expect(notifSpy).toHaveBeenCalledOnce();
    const [title, opts] = notifSpy.mock.calls[0];
    expect(title).toContain('completed');
    expect((opts as NotificationOptions).body).toContain('Stream #7');

    // Restore to denied
    Object.defineProperty(global, 'Notification', {
      value: class {
        static permission = 'denied';
        constructor() {}
      },
      writable: true,
      configurable: true,
    });
  });

  it('does NOT send a notification when permission is denied', () => {
    const notifSpy = vi.fn();
    Object.defineProperty(global, 'Notification', {
      value: class {
        static permission = 'denied';
        constructor() { notifSpy(); }
      },
      writable: true,
      configurable: true,
    });

    render(
      <StreamCompletedBanner
        streamId="8"
        finalAmount="10.0000000"
        onClaim={vi.fn()}
      />,
    );

    expect(notifSpy).not.toHaveBeenCalled();
  });
});
