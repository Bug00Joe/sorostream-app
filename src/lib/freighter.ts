"use client";

import {
  getAddress,
  getNetwork,
  signTransaction as freighterSignTransaction,
  WatchWalletChanges,
} from "@stellar/freighter-api";

export type { WatchWalletChanges };

export const APP_NETWORK = (
  process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet"
).toLowerCase();

export function createWatchWalletChanges(timeout?: number) {
  return new WatchWalletChanges(timeout);
}

/**
 * Fetch the network the Freighter wallet is currently set to.
 * Returns `null` when Freighter is unavailable or not yet allowed.
 */
export async function getWalletNetwork(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const result = await getNetwork();
    if (result.error || !result.network) return null;
    return result.network.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Returns `true` when the wallet's active network matches the app's configured
 * network (`NEXT_PUBLIC_STELLAR_NETWORK`). Returns `null` when the network
 * cannot be determined (Freighter not installed / not yet connected).
 */
export async function checkNetworkMatch(): Promise<boolean | null> {
  const walletNetwork = await getWalletNetwork();
  if (walletNetwork === null) return null;
  return walletNetwork === APP_NETWORK;
}

/**
 * Fetch the currently selected account address from Freighter.
 * Returns an empty string when Freighter is unavailable.
 */
export async function getActiveAddress(): Promise<string> {
  if (typeof window === "undefined") return "";
  try {
    const result = await getAddress();
    if (!result.error && result.address) return result.address;
  } catch {
    // fall through to legacy path
  }
  try {
    const freighter = (window as { freighter?: { getPublicKey: () => Promise<string> } }).freighter;
    if (!freighter) return "";
    return (await freighter.getPublicKey()) ?? "";
  } catch {
    return "";
  }
}

export async function signTransaction(xdr: string): Promise<string> {
  if (typeof window === "undefined") return xdr;
  try {
    const result = await freighterSignTransaction(xdr);
    if (result.error) return xdr;
    return result.signedTxXdr ?? xdr;
  } catch {
    return xdr;
  }
}

export async function getFreighterAdapter() {
  return {
    isConnected: async () => {
      if (typeof window === "undefined") return false;
      return !!(window as { freighter?: unknown }).freighter;
    },
    getPublicKey: getActiveAddress,
    signTransaction,
  };
}

export async function connectWallet(): Promise<string> {
  return getActiveAddress();
}

export async function getPublicKey(): Promise<string> {
  return getActiveAddress();
}

export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return !!(window as { freighter?: unknown }).freighter;
}
