# Admin Access

> **Security warning:** the admin dashboard is UI-only gating. It hides and shows buttons in the browser, but it does not enforce any contract-level permissions. All real authorization still has to be enforced on-chain by the contract itself.

## Configuration

Set `NEXT_PUBLIC_ADMIN_ADDRESS` to one or more Stellar public keys:

```bash
NEXT_PUBLIC_ADMIN_ADDRESS=GABCDEF...,GHIJKLM...
```

You can also keep using the legacy `NEXT_PUBLIC_ADMIN_WALLET` variable for older deployments, but `NEXT_PUBLIC_ADMIN_ADDRESS` is the preferred name.

## How The Check Works

The `/admin` page reads the configured address list in the client bundle and compares it against the currently connected wallet address. If the address matches one of the configured values, the Sweep Fees controls are shown.

Because the comparison happens in the browser, it should be treated as a convenience gate rather than a security boundary.

## Multiple Admin Addresses

Separate multiple addresses with commas. Whitespace is also ignored, so either of these works:

```bash
NEXT_PUBLIC_ADMIN_ADDRESS=GABCDEF...,GHIJKLM...
NEXT_PUBLIC_ADMIN_ADDRESS=GABCDEF... GHIJKLM...
```

## Security Notes

- The admin dashboard only controls the UI.
- Do not rely on it for real authorization.
- Ensure the contract enforces any privileged operations on-chain.
- Treat the public admin list as a convenience configuration, not a secret.
