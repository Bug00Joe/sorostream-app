export type WalletType = "freighter" | "ledger" | "server-keypair";

export interface WalletAdapter {
  type: WalletType;
  isAvailable(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string): Promise<string>;
  disconnect(): void;
}

// ── Freighter ──────────────────────────────────────────────────────────────
export const freighterAdapter: WalletAdapter = {
  type: "freighter",
  async isAvailable() {
    if (typeof window === "undefined") return false;
    return !!(window as any).freighter;
  },
  async getPublicKey() {
    return (window as any).freighter.getPublicKey();
  },
  async signTransaction(xdr) {
    return (window as any).freighter.signTransaction(xdr);
  },
  disconnect() {},
};

// ── Ledger (stub — real transport requires @ledgerhq/hw-transport-webusb) ──
export const ledgerAdapter: WalletAdapter = {
  type: "ledger",
  async isAvailable() {
    return typeof window !== "undefined" && "usb" in navigator;
  },
  async getPublicKey() {
    // TODO: replace with real Ledger Stellar app transport call
    throw new Error("Ledger transport not yet integrated");
  },
  async signTransaction(_xdr) {
    throw new Error("Ledger transport not yet integrated");
  },
  disconnect() {},
};

// ── Server Keypair (insecure — for testing / server-side use only) ─────────
export class ServerKeypairAdapter implements WalletAdapter {
  type: WalletType = "server-keypair";
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  async isAvailable() {
    return !!this.secret;
  }

  async getPublicKey() {
    const { Keypair } = await import("@stellar/stellar-sdk");
    return Keypair.fromSecret(this.secret).publicKey();
  }

  async signTransaction(xdr: string) {
    const { Keypair, Transaction, Networks } = await import("@stellar/stellar-sdk");
    const kp = Keypair.fromSecret(this.secret);
    const network =
      process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
        ? Networks.PUBLIC
        : Networks.TESTNET;
    const tx = new Transaction(xdr, network);
    tx.sign(kp);
    return tx.toEnvelope().toXDR("base64");
  }

  disconnect() {
    this.secret = "";
  }
}

export const WALLET_LABELS: Record<WalletType, string> = {
  freighter: "Freighter",
  ledger: "Ledger",
  "server-keypair": "Server Keypair",
};
