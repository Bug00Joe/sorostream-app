"use client";
import { useNetwork } from "@/src/lib/network";

export default function NetworkSelector() {
  const { network, setNetwork } = useNetwork();
  const next = network === "testnet" ? "mainnet" : "testnet";

  return (
    <button
      onClick={() => setNetwork(next)}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900 ${
        network === "testnet"
          ? "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-600/50 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 focus-visible:ring-yellow-500"
          : "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-600/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 focus-visible:ring-green-500"
      }`}
      aria-label={`Network: ${network}. Click to switch to ${next}`}
    >
      {network === "testnet" ? "Testnet" : "Mainnet"}
    </button>
  );
}
