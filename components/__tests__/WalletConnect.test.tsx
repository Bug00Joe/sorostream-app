import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import WalletConnect from '../WalletConnect';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Wallet adapters
vi.mock('@/src/lib/wallets', () => {
  const mockFreighterAdapter = {
    type: 'freighter',
    isAvailable: vi.fn(() => Promise.resolve(true)),
    getPublicKey: vi.fn(() => Promise.resolve('GB7TJKR6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5')),
    signTransaction: vi.fn(() => Promise.resolve('signed_xdr')),
    disconnect: vi.fn(),
  };

  const mockLedgerAdapter = {
    type: 'ledger',
    isAvailable: vi.fn(() => Promise.resolve(false)),
    getPublicKey: vi.fn(() => Promise.reject(new Error('Ledger transport not yet integrated'))),
    signTransaction: vi.fn(),
    disconnect: vi.fn(),
  };

  class MockServerKeypairAdapter {
    type = 'server-keypair';
    private secret: string;
    constructor(secret: string) { this.secret = secret; }
    isAvailable = vi.fn(() => Promise.resolve(true));
    getPublicKey = vi.fn(() => Promise.resolve('GCZEAELPDHRCOS7XZAFAQ7TMURYCMDH5GB6MLCO4KDYK3AS3HFEIY2EZ'));
    signTransaction = vi.fn();
    disconnect = vi.fn();
  }

  return {
    freighterAdapter: mockFreighterAdapter,
    ledgerAdapter: mockLedgerAdapter,
    ServerKeypairAdapter: MockServerKeypairAdapter,
    WALLET_LABELS: { freighter: 'Freighter', ledger: 'Ledger', 'server-keypair': 'Server Keypair' },
  };
});

// ---------------------------------------------------------------------------
// WalletContext mock — lets us control the context state per-test
// ---------------------------------------------------------------------------

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
let mockContextAddress: string | null = null;

vi.mock('@/src/context/WalletContext', () => ({
  useWallet: () => ({
    address: mockContextAddress,
    publicKey: mockContextAddress,
    isConnecting: false,
    error: null,
    networkMismatch: false,
    expectedNetwork: 'testnet',
    connect: mockConnect,
    disconnect: mockDisconnect,
  }),
}));

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WalletConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // Reset to "no wallet connected" state by default
    mockContextAddress = null;
  });

  it('renders connect button when not connected', () => {
    render(<WalletConnect />);
    expect(screen.getByRole('button', { name: /connect freighter wallet/i })).toBeInTheDocument();
  });

  it('calls onConnect callback and saves to localStorage when wallet connects', async () => {
    const KEY = 'GB7TJKR6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5';
    mockConnect.mockResolvedValueOnce(KEY);

    const onConnect = vi.fn();
    render(<WalletConnect onConnect={onConnect} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /connect freighter wallet/i }));
    });

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
      expect(onConnect).toHaveBeenCalledWith(KEY, 'freighter');
      expect(window.localStorage.getItem('sorostream_wallet_connected')).toBe('true');
      expect(window.localStorage.getItem('sorostream_wallet_type')).toBe('freighter');
    }, { timeout: 2000 });
  });

  it('disables button while connecting', async () => {
    // connect hangs long enough that we can catch the disabled state
    mockConnect.mockReturnValue(new Promise(() => {}));

    render(<WalletConnect />);
    const button = screen.getByRole('button', { name: /connect freighter wallet/i });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(button).toBeDisabled();
  });

  it('shows connected address and disconnect button when context has an address', () => {
    mockContextAddress = 'GB7TJKR6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5';
    render(<WalletConnect />);

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    // Abbreviated form: first 4 + last 4 chars
    expect(screen.getByText(/GB7T…JQJ5/i)).toBeInTheDocument();
  });

  it('updates displayed address automatically when context address changes (account switch)', async () => {
    // Start connected with account A
    mockContextAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const { rerender } = render(<WalletConnect />);
    expect(screen.getByText(/GAAA…AWHF/i)).toBeInTheDocument();

    // Simulate Freighter account switch — context pushes the new address
    mockContextAddress = 'GB7TJKR6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5';
    await act(async () => {
      rerender(<WalletConnect />);
    });

    expect(screen.getByText(/GB7T…JQJ5/i)).toBeInTheDocument();
    expect(screen.queryByText(/GAAA…AWHF/i)).not.toBeInTheDocument();
  });

  it('clears localStorage and calls context disconnect when user clicks disconnect', async () => {
    mockContextAddress = 'GB7TJKR6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5';
    window.localStorage.setItem('sorostream_wallet_connected', 'true');
    window.localStorage.setItem('sorostream_wallet_type', 'freighter');

    render(<WalletConnect />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(window.localStorage.getItem('sorostream_wallet_connected')).toBeNull();
    expect(window.localStorage.getItem('sorostream_wallet_type')).toBeNull();
  });

  it('auto-reconnects from localStorage on mount and calls contextConnect', async () => {
    const KEY = 'GB7TJKR6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5';
    window.localStorage.setItem('sorostream_wallet_connected', 'true');
    window.localStorage.setItem('sorostream_wallet_type', 'freighter');

    // contextConnect resolves with the key and the context address gets set
    mockConnect.mockResolvedValueOnce(KEY);
    const onConnect = vi.fn();

    render(<WalletConnect onConnect={onConnect} />);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
      expect(onConnect).toHaveBeenCalledWith(KEY, 'freighter');
    }, { timeout: 2000 });
  });

  it('restores server keypair wallet from localStorage on mount', async () => {
    const validSecret = 'SAQNO2S56BLRFHBBXE7PZ35IVYWMBU3HWZ2UUBU7M7EQNVGLKTWTVGRG';
    const expectedPublicKey = 'GCZEAELPDHRCOS7XZAFAQ7TMURYCMDH5GB6MLCO4KDYK3AS3HFEIY2EZ';
    window.localStorage.setItem('sorostream_wallet_connected', 'true');
    window.localStorage.setItem('sorostream_wallet_type', 'server-keypair');
    window.localStorage.setItem('sorostream_wallet_secret', validSecret);

    mockConnect.mockResolvedValueOnce(expectedPublicKey);
    const onConnect = vi.fn();

    render(<WalletConnect onConnect={onConnect} />);

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith(expectedPublicKey, 'server-keypair');
    }, { timeout: 2000 });
  });
});
