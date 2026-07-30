"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Network = "testnet" | "mainnet";

interface NetworkContextType {
  network: Network;
  rpcUrl: string;
  setNetwork: (network: Network) => void;
}

export const NETWORK_CONFIG: Record<Network, { rpcUrl: string; label: string }> = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    label: "Testnet",
  },
  mainnet: {
    rpcUrl: "https://soroban-mainnet.stellar.org",
    label: "Mainnet",
  },
};

const NetworkContext = createContext<NetworkContextType | null>(null);

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<Network>("testnet");

  useEffect(() => {
    const saved = localStorage.getItem("sorostream-network") as Network | null;
    if (saved === "testnet" || saved === "mainnet") {
      setNetworkState(saved);
    } else {
      const env = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      if (env === "testnet" || env === "mainnet") setNetworkState(env);
    }
  }, []);

  const setNetwork = (n: Network) => {
    setNetworkState(n);
    localStorage.setItem("sorostream-network", n);
  };

  return (
    <NetworkContext.Provider value={{ network, rpcUrl: NETWORK_CONFIG[network].rpcUrl, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}
