/**
 * Environment variable validation
 * Validates required environment variables at startup and throws clear errors if missing.
 * This should only be called from server-side code (e.g., layout.tsx, middleware, or API routes).
 */

const requiredEnvVars = {
  NEXT_PUBLIC_CONTRACT_ID: 'Deployed StreamContract address',
  NEXT_PUBLIC_STELLAR_NETWORK: 'Network (testnet or mainnet)',
} as const;

/**
 * Optional environment variables.
 * These are not validated as missing but are documented here for reference.
 */
export const optionalEnvVars = {
  /** Stellar public key of the fee sponsor account for fee-bump transactions. */
  NEXT_PUBLIC_FEE_SPONSOR_ADDRESS: 'Fee sponsor Stellar public key (e.g. GXXX...)',
} as const;

type RequiredEnvVar = keyof typeof requiredEnvVars;

let validated = false;

export function validateEnv() {
  if (validated) return;
  // During `next build` page-data collection the runtime env vars aren't
  // available yet — skip and let real deployments validate at startup.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const missing: RequiredEnvVar[] = [];
  
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key as RequiredEnvVar);
    }
  }
  
  if (missing.length > 0) {
    const missingList = missing.map(key => `- ${key}: ${requiredEnvVars[key]}`).join('\n');
    throw new Error(
      `Missing required environment variables:\n${missingList}\n\n` +
      `Please set these in your .env.local file. See .env.example for reference.`
    );
  }
  
  validated = true;
}

/**
 * Reads an optional environment variable, returning null if not set.
 * Use this for env vars like NEXT_PUBLIC_FEE_SPONSOR_ADDRESS that are not required.
 */
export function getOptionalEnvVar(key: string): string | null {
  if (typeof window !== "undefined") {
    // Client-side: NEXT_PUBLIC_ vars are inlined at build time
    return (process.env as Record<string, string | undefined>)[key]?.trim() || null;
  }
  return process.env[key]?.trim() || null;
}
