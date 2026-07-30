import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LiveCounter from '../LiveCounter';
import { sorostream } from '@/src/lib/sorostream';

const mockRpcFetch = vi.fn((fn: any) => fn());
vi.mock('@/src/lib/useRpcFetch', () => ({
  useRpcFetch: () => mockRpcFetch,
}));

vi.mock('@/components/FiatDisplay', () => ({
  default: () => null,
}));

describe('LiveCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-25T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('keeps local interpolation running between reconciliation checks', () => {
    render(
      <LiveCounter
        flowRate={10_000_000}
        lastWithdrawTime={new Date('2026-06-24T23:59:59.000Z')}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Claimable: 2.0000000 USDC')).toBeInTheDocument();
  });

  it('reconciles against the on-chain claimable balance for the stream', async () => {
    vi.spyOn(sorostream, 'getClaimable').mockResolvedValue('50000000');

    render(
      <LiveCounter
        streamId="stream-38"
        flowRate={10_000_000}
        lastWithdrawTime={new Date('2026-06-24T23:59:50.000Z')}
        reconcileIntervalMs={60_000}
      />
    );

    await act(async () => {});

    expect(sorostream.getClaimable).toHaveBeenCalledWith('stream-38');
    expect(screen.getByLabelText('Claimable: 5.0000000 USDC')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Claimable: 6.0000000 USDC')).toBeInTheDocument();
  });
});
