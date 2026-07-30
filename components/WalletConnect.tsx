"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WalletType,
  WalletAdapter,
  WALLET_LABELS,
  freighterAdapter,
  ledgerAdapter,
  ServerKeypairAdapter,
} from "@/src/lib/wallets";
import { useTranslations } from "@/src/lib/i18n";
import CopyButton from "@/components/CopyButton";
import { trackEvent } from "@/src/lib/analytics";
import { useWallet } from "@/src/context/WalletContext";
import FreighterInstallPrompt from "@/components/FreighterInstallPrompt";
import { isFreighterInstalled } from "@/src/lib/freighter";

interface WalletConnectProps {
  onConnect?: (publicKey: string, walletType: WalletType) => void;
  /** When true, the disconnected state renders as a compact dropdown button (for use in the nav header). */
  compact?: boolean;
}

const WALLET_TYPES: WalletType[] = ["freighter", "ledger", "server-keypair"];

/**
 * Multi-wallet connect button.
 * Supports Freighter, Ledger, and Server Keypair adapters.
 *
 * The displayed address is driven by WalletContext so it automatically updates
 * when the user switches accounts inside Freighter (handled by the context
 * watcher) — no page reload required.
 */
export default function WalletConnect({ onConnect, compact = false }: WalletConnectProps) {
  const t = useTranslations("wallet");
  const { address: contextAddress, connect: contextConnect, disconnect: contextDisconnect } = useWallet();

  const [walletType, setWalletType] = useState<WalletType>("freighter");
  const [secretInput, setSecretInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adapter, setAdapter] = useState<WalletAdapter | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Freighter extension detection ──────────────────────────────────────
  // Start as `null` (unknown) so we don't flash the install prompt during SSR
  // or before the first check completes. Once determined, it stays stable
  // unless the user installs the extension while the page is open (we poll
  // every 2 s for that case).
  const [freighterPresent, setFreighterPresent] = useState<boolean | null>(null);
  const freighterCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const present = await isFreighterInstalled();
      if (!cancelled) {
        setFreighterPresent(present);
        // Once installed, stop polling — no need to keep checking.
        if (present && freighterCheckRef.current !== null) {
          clearInterval(freighterCheckRef.current);
          freighterCheckRef.current = null;
        }
      }
    }

    // Run immediately, then poll every 2 s so the CTA swaps as soon as the
    // user finishes the extension install without requiring a manual refresh.
    check();
    freighterCheckRef.current = setInterval(check, 2000);

    return () => {
      cancelled = true;
      if (freighterCheckRef.current !== null) {
        clearInterval(freighterCheckRef.current);
        freighterCheckRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  /**
   * Keep local adapter state aligned with the context address.
   * When the context detects an account switch (via WatchWalletChanges) and
   * contextAddress changes, this fires onConnect so consumers stay in sync.
   */
  useEffect(() => {
    if (contextAddress && adapter) {
      onConnect?.(contextAddress, walletType);
    }
  // We intentionally only react to contextAddress changes here, not every
  // render of the other deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextAddress]);

  const handleDisconnect = useCallback(() => {
    adapter?.disconnect();
    setAdapter(null);
    setSecretInput("");
    contextDisconnect();
    localStorage.removeItem("sorostream_wallet_connected");
    localStorage.removeItem("sorostream_wallet_type");
    localStorage.removeItem("sorostream_wallet_secret");
  }, [adapter, contextDisconnect]);

  useEffect(() => {
    async function autoReconnect() {
      const isConnected = localStorage.getItem("sorostream_wallet_connected");
      if (isConnected !== "true") return;

      const storedType = localStorage.getItem("sorostream_wallet_type") as WalletType;
      if (!storedType) return;

      try {
        let selected: WalletAdapter;
        if (storedType === "freighter") {
          selected = freighterAdapter;
        } else if (storedType === "ledger") {
          selected = ledgerAdapter;
        } else if (storedType === "server-keypair") {
          const secret = localStorage.getItem("sorostream_wallet_secret") || "";
          selected = new ServerKeypairAdapter(secret);
          setSecretInput(secret);
        } else {
          return;
        }

        const available = await selected.isAvailable();
        if (!available) {
          handleDisconnect();
          return;
        }

        const key = await selected.getPublicKey();
        if (key) {
          setWalletType(storedType);
          setAdapter(selected);
          // Sync to context so the watcher takes over from here
          await contextConnect();
          onConnect?.(key, storedType);
        } else {
          handleDisconnect();
        }
      } catch (err) {
        console.error("Auto-reconnect failed:", err);
        handleDisconnect();
      }
    }

    autoReconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      let selected: WalletAdapter;
      if (walletType === "freighter") selected = freighterAdapter;
      else if (walletType === "ledger") selected = ledgerAdapter;
      else selected = new ServerKeypairAdapter(secretInput);

      const available = await selected.isAvailable();
      if (!available) {
        setError(
          walletType === "freighter"
            ? t("error_freighter")
            : walletType === "ledger"
            ? t("error_ledger")
            : t("error_server_keypair")
        );
        return;
      }

      setAdapter(selected);

      // Delegate the actual address retrieval + context update to WalletContext
      const key = await contextConnect();

      if (key) {
        localStorage.setItem("sorostream_wallet_connected", "true");
        localStorage.setItem("sorostream_wallet_type", walletType);
        if (walletType === "server-keypair") {
          localStorage.setItem("sorostream_wallet_secret", secretInput);
        } else {
          localStorage.removeItem("sorostream_wallet_secret");
        }
        onConnect?.(key, walletType);
        trackEvent({ type: "wallet_connect", success: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      trackEvent({ type: "wallet_connect", success: false });
    } finally {
      setLoading(false);
    }
  }

  // Derive displayed key from context (stays current after account switches)
  const publicKey = contextAddress;

  // Compact mode: disconnected state renders as a dropdown button for use in the nav header
  if (compact && !publicKey) {
    // Show install prompt while we know Freighter is absent.
    // While still checking (null) we render the normal Connect button so there
    // is no flash of the install prompt on first paint.
    if (freighterPresent === false) {
      return (
        <FreighterInstallPrompt compact />
      );
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="rounded-lg bg-sky-600 dark:bg-sky-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label="Connect wallet"
        >
          Connect
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 z-50 shadow-xl">
            <div className="space-y-2">
              <div className="flex gap-2">
                {WALLET_TYPES.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWalletType(w)}
                    aria-pressed={walletType === w}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900 ${
                      walletType === w
                        ? "bg-sky-600 dark:bg-sky-700 text-white border-sky-600 dark:border-sky-700"
                        : "border-gray-300 dark:border-slate-500 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {WALLET_LABELS[w]}
                  </button>
                ))}
              </div>
              {walletType === "server-keypair" && (
                <input
                  type="password"
                  placeholder={t("secret_placeholder")}
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-500 bg-gray-100 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900"
                  aria-label="Server keypair secret key"
                />
              )}
              <button
                onClick={async () => { await handleConnect(); setDropdownOpen(false); }}
                disabled={loading}
                className="w-full rounded-lg bg-sky-600 dark:bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label={`Connect ${WALLET_LABELS[walletType]} wallet`}
              >
                {loading ? t("connecting") : t("connect", { wallet: WALLET_LABELS[walletType] })}
              </button>
              {error && (
                <p className="text-xs text-red-400" role="alert">{error}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (publicKey) {
    return (
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <span
          className="text-sm text-slate-300 font-mono flex items-center min-w-0"
          aria-label={`Connected wallet: ${publicKey}`}
        >
          {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
          <CopyButton value={publicKey} label="Copy wallet address" />
        </span>
        <button
          onClick={handleDisconnect}
          className="shrink-0 rounded-lg border border-slate-500 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          aria-label="Disconnect wallet"
        >
          {t("disconnect")}
        </button>
      </div>
    );
  }

  // Full (non-compact) disconnected state — show install prompt when Freighter is absent.
  if (freighterPresent === false) {
    return <FreighterInstallPrompt />;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {WALLET_TYPES.map((w) => (
          <button
            key={w}
            onClick={() => setWalletType(w)}
            aria-pressed={walletType === w}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
              walletType === w
                ? "bg-sky-700 text-white border-sky-700"
                : "border-slate-500 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {WALLET_LABELS[w]}
          </button>
        ))}
      </div>

      {walletType === "server-keypair" && (
        <input
          type="password"
          placeholder={t("secret_placeholder")}
          value={secretInput}
          onChange={(e) => setSecretInput(e.target.value)}
          className="w-full rounded-lg border border-slate-500 bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          aria-label="Server keypair secret key"
        />
      )}

      <button
        onClick={handleConnect}
        disabled={loading}
        className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        aria-label={`Connect ${WALLET_LABELS[walletType]} wallet`}
      >
        {loading ? t("connecting") : t("connect", { wallet: WALLET_LABELS[walletType] })}
      </button>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
