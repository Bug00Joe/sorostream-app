/**
 * WalletContext — account-change detection tests
 *
 * Verifies that the context watcher reacts to publicKey changes emitted by
 * WatchWalletChanges and updates the exposed `address` accordingly, so that
 * NavHeader (and any other consumer) always shows the current account without
 * requiring a page reload.
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import { useWallet, WalletProvider } from '../WalletContext';

// ---------------------------------------------------------------------------
// Mock @stellar/freighter-api
// ---------------------------------------------------------------------------

type WatchCallback = (payload: { address?: string; publicKey?: string; network?: string }) => void;

class MockWatchWalletChanges {
  private cb: WatchCallback | null = null;
  private intervalMs: number;

  constructor(intervalMs = 3000) {
    this.intervalMs = intervalMs;
  }

  watch(cb: WatchCallback) {
    this.cb = cb;
  }

  stop() {
    this.cb = null;
  }

  /** Test helper — fire one watcher tick with given payload. */
  emit(payload: { address?: string; publicKey?: string; network?: string }) {
    this.cb?.({
      address: payload.address || payload.publicKey,
      publicKey: payload.publicKey || payload.address,
      network: payload.network,
    });
  }
}

// The singleton instance exposed to tests via `getLastWatcher()`
let lastWatcher: MockWatchWalletChanges | null = null;

vi.mock('@/src/lib/freighter', () => {
  const APP_NETWORK = 'testnet';

  return {
    APP_NETWORK,
    getActiveAddress: vi.fn(() => Promise.resolve('GAAAA_INITIAL')),
    checkNetworkMatch: vi.fn(() => Promise.resolve(true)),
    getFreighterAdapter: vi.fn(() =>
      Promise.resolve({
        isConnected: vi.fn(() => Promise.resolve(true)),
        getPublicKey: vi.fn(() => Promise.resolve('GAAAA_INITIAL')),
        signTransaction: vi.fn(),
      })
    ),
    createWatchWalletChanges: vi.fn((interval?: number) => {
      lastWatcher = new MockWatchWalletChanges(interval);
      return lastWatcher;
    }),
  };
});

// ---------------------------------------------------------------------------
// Helper to get the watcher instance created by the provider
// ---------------------------------------------------------------------------
function getLastWatcher(): MockWatchWalletChanges {
  if (!lastWatcher) throw new Error('No watcher instance created yet');
  return lastWatcher;
}

// ---------------------------------------------------------------------------
// A simple consumer component that renders the current address
// ---------------------------------------------------------------------------
function AddressDisplay() {
  const { address, connect } = useWallet();
  return (
    <div>
      <span data-testid="address">{address ?? 'disconnected'}</span>
      <button onClick={connect}>connect</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <WalletProvider>
      <AddressDisplay />
    </WalletProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WalletContext — account-change detection', () => {
  beforeEach(() => {
    lastWatcher = null;
    vi.clearAllMocks();
  });

  it('starts the watcher on mount without requiring an explicit connect()', () => {
    const { unmount } = renderWithProvider();
    expect(lastWatcher).not.toBeNull();
    unmount();
  });

  it('updates address when watcher emits a new publicKey', async () => {
    renderWithProvider();
    const watcher = getLastWatcher();

    await act(async () => {
      watcher.emit({ publicKey: 'GBBBBB_NEW_ACCOUNT', network: 'testnet' });
    });

    expect(screen.getByTestId('address').textContent).toBe('GBBBBB_NEW_ACCOUNT');
  });

  it('updates address again on a subsequent account switch', async () => {
    renderWithProvider();
    const watcher = getLastWatcher();

    await act(async () => {
      watcher.emit({ publicKey: 'GBBBBB_ACCOUNT_B', network: 'testnet' });
    });
    expect(screen.getByTestId('address').textContent).toBe('GBBBBB_ACCOUNT_B');

    await act(async () => {
      watcher.emit({ publicKey: 'GCCCCC_ACCOUNT_C', network: 'testnet' });
    });
    expect(screen.getByTestId('address').textContent).toBe('GCCCCC_ACCOUNT_C');
  });

  it('does not reset address when watcher emits only a network update', async () => {
    renderWithProvider();
    const watcher = getLastWatcher();

    // First establish a known address
    await act(async () => {
      watcher.emit({ publicKey: 'GBBBBB_ACCOUNT_B', network: 'testnet' });
    });
    expect(screen.getByTestId('address').textContent).toBe('GBBBBB_ACCOUNT_B');

    // Network-only tick — address must stay the same
    await act(async () => {
      watcher.emit({ network: 'testnet' });
    });
    expect(screen.getByTestId('address').textContent).toBe('GBBBBB_ACCOUNT_B');
  });

  it('sets address from getActiveAddress when connect() is called', async () => {
    const { getActiveAddress } = await import('@/src/lib/freighter');
    (getActiveAddress as ReturnType<typeof vi.fn>).mockResolvedValueOnce('GDDDD_CONNECTED');

    renderWithProvider();

    await act(async () => {
      screen.getByRole('button', { name: /connect/i }).click();
      await new Promise(r => setTimeout(r, 20));
    });

    await waitFor(() =>
      expect(screen.getByTestId('address').textContent).toBe('GDDDD_CONNECTED')
    );
  });

  it('watcher keeps running after disconnect so next account switch is still detected', async () => {
    function Consumer() {
      const { address, disconnect } = useWallet();
      return (
        <div>
          <span data-testid="address">{address ?? 'disconnected'}</span>
          <button onClick={disconnect}>disconnect</button>
        </div>
      );
    }

    render(
      <WalletProvider>
        <Consumer />
      </WalletProvider>
    );

    const watcher = getLastWatcher();

    // Establish an address
    await act(async () => {
      watcher.emit({ publicKey: 'GBBBBB_ACCOUNT_B' });
    });
    expect(screen.getByTestId('address').textContent).toBe('GBBBBB_ACCOUNT_B');

    // Disconnect clears the address in context
    await act(async () => {
      screen.getByRole('button', { name: /disconnect/i }).click();
    });
    expect(screen.getByTestId('address').textContent).toBe('disconnected');

    // Watcher still fires — new account switch is detected
    await act(async () => {
      watcher.emit({ publicKey: 'GCCCCC_AFTER_DISCONNECT' });
    });
    expect(screen.getByTestId('address').textContent).toBe('GCCCCC_AFTER_DISCONNECT');
  });
});
