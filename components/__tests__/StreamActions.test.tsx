import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import StreamActions from '../StreamActions';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/sorostream', () => ({
  sorostream: {
    withdraw: vi.fn(),
    cancelStream: vi.fn(),
  },
  claimableNow: vi.fn(() => '0'),
  getMockStream: vi.fn(() => null),
}));

// Capture toast calls so we can assert on them
const mockAddToast = vi.fn();
const mockUpsertPersistentToast = vi.fn(() => 1);
const mockRemoveToast = vi.fn();

vi.mock('@/src/lib/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    upsertPersistentToast: mockUpsertPersistentToast,
    removeToast: mockRemoveToast,
  }),
}));

vi.mock('@/src/context/SettingsContext', () => ({
  useSettings: () => ({ withdrawThreshold: 1000 }),
}));

vi.mock('@/src/context/WalletContext', () => ({
  useWallet: () => ({ refetchBalance: vi.fn() }),
  useWallet: () => ({ refetchBalance: vi.fn(), address: 'GBKLYONWFBQFBFZK6HMTXQZJNBKQEXZ3PJOVXNKZXVTV4FQXVMKLKHA' }),
}));

// LiveCounter doesn't matter for these tests
vi.mock('@/components/LiveCounter', () => ({
  default: () => <span data-testid="live-counter">0.00</span>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { sorostream } from '@/src/lib/sorostream';

const defaultProps = {
  streamId: '42',
  flowRate: 1_000_000,
  lastWithdrawTime: new Date().toISOString(),
};

function renderActions() {
  return render(<StreamActions {...defaultProps} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StreamActions — cancel grace period', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    (sorostream.cancelStream as ReturnType<typeof vi.fn>).mockResolvedValue({
      txHash: 'mock-tx-hash',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a countdown toast immediately when Cancel is clicked', () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockUpsertPersistentToast).toHaveBeenCalledWith(
      'cancel-grace-42',
      'Cancelling stream #42 in 5s…',
      'warning',
      expect.objectContaining({ label: 'Undo' }),
    );
  });

  it('counts down each second in the toast', () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    act(() => { vi.advanceTimersByTime(1000); });
    expect(mockUpsertPersistentToast).toHaveBeenCalledWith(
      'cancel-grace-42',
      'Cancelling stream #42 in 4s…',
      'warning',
      expect.objectContaining({ label: 'Undo' }),
    );

    act(() => { vi.advanceTimersByTime(1000); });
    expect(mockUpsertPersistentToast).toHaveBeenCalledWith(
      'cancel-grace-42',
      'Cancelling stream #42 in 3s…',
      'warning',
      expect.objectContaining({ label: 'Undo' }),
    );
  });

  it('submits the transaction after 5 seconds', async () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await act(async () => { vi.advanceTimersByTime(5000); });

    expect(sorostream.cancelStream).toHaveBeenCalledTimes(1);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Stream #42 cancelled',
      'success',
    );
  });

  it('does NOT submit the transaction before 5 seconds', () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    act(() => { vi.advanceTimersByTime(4999); });

    expect(sorostream.cancelStream).not.toHaveBeenCalled();
  });

  it('button changes to "Undo Cancel" while grace period is active', () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('button', { name: /undo cancel/i })).toBeInTheDocument();
  });

  it('clicking Undo Cancel aborts the transaction', async () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Click the button-level undo
    fireEvent.click(screen.getByRole('button', { name: /undo cancel/i }));

    // Advance past the 5-second mark
    await act(async () => { vi.advanceTimersByTime(6000); });

    expect(sorostream.cancelStream).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('Cancellation undone.', 'info');
  });

  it('clicking Undo Cancel dismisses the countdown toast', () => {
    // upsertPersistentToast returns id 1
    mockUpsertPersistentToast.mockReturnValue(1);

    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /undo cancel/i }));

    expect(mockRemoveToast).toHaveBeenCalledWith(1);
  });

  it('restores the Cancel button after Undo', () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /undo cancel/i }));

    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
  });

  it('dismisses the countdown toast before submitting on-chain', async () => {
    mockUpsertPersistentToast.mockReturnValue(99);

    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await act(async () => { vi.advanceTimersByTime(5000); });

    expect(mockRemoveToast).toHaveBeenCalledWith(99);
  });

  it('shows an error toast if cancelStream throws', async () => {
    (sorostream.cancelStream as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network error'),
    );

    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await act(async () => { vi.advanceTimersByTime(5000); });

    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to cancel stream. Please try again.',
      'error',
    );
  });

  it('calling Undo via the toast action callback also aborts', async () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Grab the action.onClick that was passed to upsertPersistentToast
    const { onClick: action } = (mockUpsertPersistentToast.mock.calls[0] as any)[3] as {
      label: string;
      onClick: () => void;
    };

    act(() => { action(); });

    await act(async () => { vi.advanceTimersByTime(6000); });

    expect(sorostream.cancelStream).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('Cancellation undone.', 'info');
  });
});

describe('StreamActions — withdraw (unchanged behaviour)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sorostream.withdraw as ReturnType<typeof vi.fn>).mockResolvedValue({
      txHash: 'mock-tx',
      amount: '5.00',
    });
  });

  it('shows success toast after withdrawal', async () => {
    renderActions();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Withdrawn'),
      'success',
    );
  });

  it('shows error toast if withdraw fails', async () => {
    (sorostream.withdraw as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('tx failed'),
    );

    renderActions();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      'Withdrawal failed. Please try again.',
      'error',
    );
  });
});
