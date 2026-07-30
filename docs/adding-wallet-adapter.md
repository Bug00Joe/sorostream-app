# Adding a New Wallet Adapter

This guide explains how to integrate a new wallet (e.g. xBull, Albedo) into SoroStream.

---

## 1. The `WalletAdapter` Interface

Every wallet must implement `WalletAdapter` from `src/lib/wallets.ts`:

```ts
export interface WalletAdapter {
  type: WalletType;          // unique string identifier
  isAvailable(): Promise<boolean>;         // returns true when the wallet can be used
  getPublicKey(): Promise<string>;         // returns the connected Stellar public key
  signTransaction(xdr: string): Promise<string>; // signs and returns the XDR
  disconnect(): void;        // clean up any persistent state
}
```

---

## 2. Register a New Wallet Type

Open `src/lib/wallets.ts` and add your wallet type to the union:

```ts
// Before
export type WalletType = "freighter" | "ledger" | "server-keypair";

// After
export type WalletType = "freighter" | "ledger" | "server-keypair" | "xbull";
```

Then add a human-readable label to `WALLET_LABELS`:

```ts
export const WALLET_LABELS: Record<WalletType, string> = {
  freighter: "Freighter",
  ledger: "Ledger",
  "server-keypair": "Server Keypair",
  xbull: "xBull",               // ← new entry
};
```

---

## 3. Implement the Adapter

Add your adapter object (or class) in `src/lib/wallets.ts`:

```ts
export const xBullAdapter: WalletAdapter = {
  type: "xbull",

  async isAvailable() {
    return typeof window !== "undefined" && !!(window as any).xBullSDK;
  },

  async getPublicKey() {
    const sdk = (window as any).xBullSDK;
    const result = await sdk.connect();
    return result.publicKey;
  },

  async signTransaction(xdr: string) {
    const sdk = (window as any).xBullSDK;
    const result = await sdk.signXDR(xdr);
    return result.xdr;
  },

  disconnect() {
    // xBull has no explicit disconnect; clear any cached state here if needed.
  },
};
```

---

## 4. Expose the Adapter in `WalletConnect.tsx`

Open `components/WalletConnect.tsx` and:

1. Import the new adapter:
   ```ts
   import { ..., xBullAdapter } from "@/src/lib/wallets";
   ```

2. Add it to the `WALLET_TYPES` array so the UI renders a button for it:
   ```ts
   const WALLET_TYPES: WalletType[] = ["freighter", "ledger", "server-keypair", "xbull"];
   ```

3. Wire it up in `handleConnect` and `autoReconnect`:
   ```ts
   else if (walletType === "xbull") selected = xBullAdapter;
   ```

---

## 5. Minimal Skeleton (copy-paste starting point)

```ts
// src/lib/wallets.ts

export const myWalletAdapter: WalletAdapter = {
  type: "my-wallet" as WalletType,

  async isAvailable() {
    return typeof window !== "undefined" && !!(window as any).MyWallet;
  },

  async getPublicKey() {
    return (window as any).MyWallet.getPublicKey();
  },

  async signTransaction(xdr: string) {
    return (window as any).MyWallet.sign(xdr);
  },

  disconnect() {},
};
```

---

## 6. Testing Locally

1. Run the dev server: `pnpm dev`
2. Open the app and click your new wallet button in the connect modal.
3. Confirm `isAvailable()` returns `true` when the extension/SDK is present.
4. Create a stream to exercise `signTransaction`.
5. To test without the real extension, temporarily stub the global in `src/test/setup.ts`:
   ```ts
   (global as any).MyWallet = {
     getPublicKey: async () => "GBTEST...",
     sign: async (xdr: string) => xdr,
   };
   ```
6. Run unit tests: `pnpm test`.

---

## 7. Error Messages

Add wallet-specific error strings to `messages/en.json` under the `wallet` namespace:

```json
"error_my_wallet": "MyWallet extension not found. Please install it."
```

Then reference them in `WalletConnect.tsx` where the other `t("error_*")` calls live.
