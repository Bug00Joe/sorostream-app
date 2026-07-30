"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  APP_NETWORK,
  checkNetworkMatch,
  createWatchWalletChanges,
  getActiveAddress,
  getFreighterAdapter,
} from "@/src/lib/freighter";

interface WalletContextValue {
  address: string | null;
  publicKey: string | null;
  isConnecting: boolean;
  error: string | null;
  /** True when Freighter's active network differs from NEXT_PUBLIC_STELLAR_NETWORK. */
  networkMismatch: boolean;
  /** The expected network name derived from NEXT_PUBLIC_STELLAR_NETWORK. */
  expectedNetwork: string;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  /**
   * Bumps a counter that signals consumers (e.g. NavHeader balance display)
   * to immediately re-fetch wallet data instead of waiting for the next
   * polling interval.
   */
  balanceRefreshTrigger: number;
  refetchBalance: () => void;
  /** Timestamp when session will expire, or null if not set. */
  sessionExpiresAt: number | null;
  /** Time until session expires in milliseconds, or null if not set. */
  sessionTimeRemaining: number | null;
  /** Show 5-minute warning toast. */
  showSessionWarning5Min: boolean;
  /** Show 1-minute blocking modal. */
  showSessionWarning1Min: boolean;
  /** Extend the current session (refresh). */
  extendSession: () => Promise<void>;
  /**
   * Bumps a counter that signals consumers (e.g. dashboard stream list)
   * to immediately re-fetch stream data instead of showing stale cached state.
   */
  streamRefreshTrigger: number;
  triggerStreamRefresh: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

/** Polling interval (ms) used by WatchWalletChanges. */
const WATCH_INTERVAL = 2000;

/** Timeout for watch wallet changes operations. */
const WATCH_WALLET_CHANGES_TIMEOUT = 30000;

/** Session timeout in milliseconds (15 minutes default from Freighter). */
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

/** Warning at 5 minutes before session expiry. */
const SESSION_WARNING_5MIN_MS = 5 * 60 * 1000;

/** Blocking modal at 1 minute before session expiry. */
const SESSION_WARNING_1MIN_MS = 1 * 60 * 1000;

/** Interval for checking session expiry. */
const SESSION_CHECK_INTERVAL_MS = 10 * 1000;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);
  const [streamRefreshTrigger, setStreamRefreshTrigger] = useState(0);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [showSessionWarning5Min, setShowSessionWarning5Min] = useState(false);
  const [showSessionWarning1Min, setShowSessionWarning1Min] = useState(false);
  const watcherRef = useRef<ReturnType<typeof createWatchWalletChanges> | null>(
    null,
  );
  const sessionCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warning5MinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warning1MinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Check the wallet network and update mismatch state. */
  const verifyNetwork = useCallback(async () => {
    const matches = await checkNetworkMatch();
    // null means Freighter isn't connected/available — clear any stale warning
    setNetworkMismatch(matches === false);
  }, []);

  const stopWatcher = useCallback(() => {
    watcherRef.current?.stop();
    watcherRef.current = null;
  }, []);

  /** Clear all session warning timeouts and stop checking. */
  const clearSessionWarnings = useCallback(() => {
    if (warning5MinTimeoutRef.current) {
      clearTimeout(warning5MinTimeoutRef.current);
      warning5MinTimeoutRef.current = null;
    }
    if (warning1MinTimeoutRef.current) {
      clearTimeout(warning1MinTimeoutRef.current);
      warning1MinTimeoutRef.current = null;
    }
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
    setShowSessionWarning5Min(false);
    setShowSessionWarning1Min(false);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
    setNetworkMismatch(false);
    setSessionExpiresAt(null);
    clearSessionWarnings();
    // Don't stop the watcher on disconnect — keep polling so we notice when
    // the user switches back or reconnects from within Freighter.
  }, [clearSessionWarnings]);

  /** Start session timeout tracking. Called when wallet connects. */
  const startSessionTracking = useCallback(() => {
    clearSessionWarnings();
    const expiryTime = Date.now() + SESSION_TIMEOUT_MS;
    setSessionExpiresAt(expiryTime);

    // Schedule 5-minute warning
    const timeUntil5Min = expiryTime - Date.now() - SESSION_WARNING_5MIN_MS;
    if (timeUntil5Min > 0) {
      warning5MinTimeoutRef.current = setTimeout(() => {
        setShowSessionWarning5Min(true);
      }, timeUntil5Min);
    }

    // Schedule 1-minute warning
    const timeUntil1Min = expiryTime - Date.now() - SESSION_WARNING_1MIN_MS;
    if (timeUntil1Min > 0) {
      warning1MinTimeoutRef.current = setTimeout(() => {
        setShowSessionWarning1Min(true);
      }, timeUntil1Min);
    }
  }, [clearSessionWarnings]);

  /** Extend the current session by refreshing the timeout. */
  const extendSession = useCallback(async () => {
    try {
      // Refresh connection to extend session
      const adapter = await getFreighterAdapter();
      const connected = await adapter.isConnected();
      if (connected) {
        // Reset session tracking
        startSessionTracking();
        setShowSessionWarning5Min(false);
        setShowSessionWarning1Min(false);
      }
    } catch (err) {
      console.error("Failed to extend session:", err);
    }
  }, [startSessionTracking]);

  const triggerStreamRefresh = useCallback(() => {
    setStreamRefreshTrigger((n) => n + 1);
  }, []);

  const refetchBalance = useCallback(() => {
    setBalanceRefreshTrigger((n) => n + 1);
  }, []);

  const handleConnectionTimeout = useCallback(() => {
    setError("Connection timed out. Please check that Freighter is unlocked and try again.");
    stopWatcher();
    disconnect();
  }, [stopWatcher, disconnect]);

  /**
   * Start polling for wallet/network changes.
   * The WatchWalletChanges callback receives { publicKey, network } on every
   * poll tick — we update both address and network mismatch from it so the UI
   * stays in sync when the user switches accounts inside Freighter.
   */
  const startWatcher = useCallback(() => {
    if (watcherRef.current) return; // already watching
    const watcher = createWatchWalletChanges(WATCH_WALLET_CHANGES_TIMEOUT);
    watcherRef.current = watcher;
    watcher.watch(({ address: watchAddress, network }) => {
      // --- account change detection ---
      // Only update when address is explicitly provided; network-only ticks leave address unchanged
      if (watchAddress !== undefined) {
        setAddress((prev) => {
          if (prev !== null && prev !== watchAddress) {
            setError(null);
          }
          return watchAddress;
        });
      }

      // --- network mismatch detection ---
      if (network) {
        setNetworkMismatch(network.toLowerCase() !== APP_NETWORK);
      }
    });
  }, []);

  /**
   * On mount, start the watcher unconditionally so we detect account/network
   * changes even before the user explicitly clicks "Connect".
   * If Freighter is already connected (e.g. auto-reconnect from localStorage),
   * the first tick will pick up the current address.
   */
  useEffect(() => {
    startWatcher();
    return () => stopWatcher();
  }, [startWatcher, stopWatcher]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const adapter = await getFreighterAdapter();
      const connected = await adapter.isConnected();

      if (!connected) {
        setError("Freighter extension not found. Please install it.");
        return null;
      }

      const publicKey = await getActiveAddress();
      setAddress(publicKey || null);

      // Start session timeout tracking
      if (publicKey) {
        startSessionTracking();
      }

      // Check network immediately after connecting; watcher keeps it live
      await verifyNetwork();
      // Watcher is already running from the mount effect; startWatcher() is
      // idempotent so calling it here is a safe no-op.
      startWatcher();

      return publicKey || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      // Check if it's a timeout error
      if (message.includes("timeout") || message.includes("Timeout")) {
        setError("Connection timed out. Please check that Freighter is unlocked and try again.");
      } else {
        setError(message);
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [verifyNetwork, startWatcher]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSessionWarnings();
    };
  }, [clearSessionWarnings]);

  // Compute sessionTimeRemaining
  const sessionTimeRemaining = sessionExpiresAt
    ? Math.max(0, sessionExpiresAt - Date.now())
    : null;

  const value = useMemo(
    () => ({
      address,
      publicKey: address,
      isConnecting,
      error,
      networkMismatch,
      expectedNetwork: APP_NETWORK,
      connect,
      disconnect,
      balanceRefreshTrigger,
      refetchBalance,
      sessionExpiresAt,
      sessionTimeRemaining,
      showSessionWarning5Min,
      showSessionWarning1Min,
      extendSession,
      streamRefreshTrigger,
      triggerStreamRefresh,
    }),
    [
      address,
      connect,
      disconnect,
      error,
      isConnecting,
      networkMismatch,
      balanceRefreshTrigger,
      refetchBalance,
      sessionExpiresAt,
      sessionTimeRemaining,
      showSessionWarning5Min,
      showSessionWarning1Min,
      extendSession,
      streamRefreshTrigger,
      triggerStreamRefresh,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return context;
}