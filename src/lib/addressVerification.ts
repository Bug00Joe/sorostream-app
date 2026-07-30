/**
 * Stellar Address Verification
 *
 * Performs background verification of Stellar addresses:
 * 1. Checks account existence on Stellar Horizon
 * 2. Performs federation resolution (forward and reverse lookup)
 *
 * Returns verification status:
 * - "verified" (green): Account exists + federation name resolved
 * - "active" (blue): Account exists, no federation name
 * - "unverified" (red): Account not found or verification failed
 * - "pending" (gray): Verification in progress
 */

import { resolveFederationName } from "./federation";

export type VerificationStatus = "pending" | "verified" | "active" | "unverified";

export interface AddressVerification {
  status: VerificationStatus;
  address: string;
  federationName: string | null;
  accountExists: boolean | null;
  error: string | null;
  lastCheckedAt: number;
}

// Stellar Horizon URL (using public testnet by default, override with env var)
const HORIZON_URL = process.env.NEXT_PUBLIC_RPC_URL
  ? process.env.NEXT_PUBLIC_RPC_URL.replace("/rpc/v1", "")
  : "https://horizon-testnet.stellar.org";

// Cache verification results in sessionStorage
const VERIFICATION_CACHE_PREFIX = "sorostream-addr-verify-";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Read verification result from cache if still valid.
 */
function readVerificationCache(address: string): AddressVerification | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const key = VERIFICATION_CACHE_PREFIX + address;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as AddressVerification;
    // Return if less than 5 minutes old
    if (Date.now() - cached.lastCheckedAt < CACHE_TTL_MS) {
      return cached;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Write verification result to cache.
 */
function writeVerificationCache(verification: AddressVerification): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const key = VERIFICATION_CACHE_PREFIX + verification.address;
    sessionStorage.setItem(key, JSON.stringify(verification));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Check if an account exists on Stellar Horizon.
 * Returns true if account exists, false if not found, null if check failed.
 */
async function checkAccountExists(address: string): Promise<boolean | null> {
  try {
    // Only check G-addresses (not federation addresses)
    if (!address.startsWith("G") || address.length !== 56) {
      return null;
    }

    const response = await fetch(`${HORIZON_URL}/accounts/${address}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (response.status === 200) {
      return true; // Account exists
    }
    if (response.status === 404) {
      return false; // Account not found
    }
    // For other status codes, consider it a check failure
    return null;
  } catch {
    // Network error or timeout
    return null;
  }
}

/**
 * Verify a Stellar address (G-address or federation address).
 *
 * Returns:
 * - "verified": Federation name found + account exists
 * - "active": Account exists, no federation name
 * - "unverified": Account not found or check failed
 * - "pending": Should not be returned (only internal state)
 */
export async function verifyAddress(
  address: string,
): Promise<AddressVerification> {
  // Return cached result if available
  const cached = readVerificationCache(address);
  if (cached) return cached;

  // Start with pending status
  let accountExists: boolean | null = null;
  let federationName: string | null = null;
  let error: string | null = null;

  try {
    // If federation address, resolve it first
    let resolvedAddress = address;
    if (address.includes("*")) {
      try {
        const resolved = await resolveFederationName(address);
        if (resolved) {
          federationName = address; // Store the federation name that was entered
          resolvedAddress = resolved;
        } else {
          error = "Federation address could not be resolved";
        }
      } catch (err) {
        error = err instanceof Error ? err.message : "Federation resolution failed";
      }
    }

    // Check if resolved address exists on Horizon
    if (resolvedAddress.startsWith("G")) {
      accountExists = await checkAccountExists(resolvedAddress);
      if (accountExists === false) {
        error = "Account not found on Stellar network";
      } else if (accountExists === null && !error) {
        error = "Could not verify account status";
      }
    }

    // If no federation name from input, try reverse lookup
    if (!federationName && resolvedAddress.startsWith("G")) {
      try {
        const reverse = await resolveFederationName(resolvedAddress);
        if (reverse) {
          federationName = reverse;
        }
      } catch {
        // Reverse lookup is optional, don't fail on error
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Verification failed";
  }

  // Determine status
  let status: VerificationStatus = "unverified";
  if (accountExists === true) {
    status = federationName ? "verified" : "active";
  }

  const verification: AddressVerification = {
    status,
    address,
    federationName,
    accountExists,
    error,
    lastCheckedAt: Date.now(),
  };

  writeVerificationCache(verification);
  return verification;
}

/**
 * Get human-readable status message for display.
 */
export function getStatusMessage(status: VerificationStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "active":
      return "Active";
    case "unverified":
      return "Unverified";
    case "pending":
      return "Verifying…";
    default:
      return "Unknown";
  }
}

/**
 * Check if address verification should allow stream creation.
 * Returns false only for unverified addresses.
 */
export function canCreateStream(verification: AddressVerification | null): boolean {
  if (!verification) return false;
  return verification.status !== "unverified";
}
