/**
 * Stellar Federation lookup
 *
 * Resolves between Stellar federation addresses and public keys:
 *  1. Federation address → G-address: resolveFederationAddress()
 *  2. G-address → Federation name: resolveFederationName()
 *
 * Using the Stellar Federation protocol (SEP-2).
 *
 * Flow (federation address to G-address):
 *  1. Parse federation address (alice*stellar.org → domain=stellar.org, name=alice)
 *  2. Fetch <domain>/.well-known/stellar.toml  →  FEDERATION_SERVER url
 *  3. GET <federation_server>?q=<name>*<domain>&type=name
 *
 * Results are cached in sessionStorage to avoid repeated lookups in the same session.
 *
 * Returns `null` when:
 *  - No federation record exists for the address
 *  - The lookup times out (3 s per domain)
 *  - Any network/parse error occurs
 */

const SESSION_PREFIX = "sorostream-fed-";
const LOOKUP_TIMEOUT_MS = 3_000;

/**
 * Domains to probe for reverse federation lookup.
 * Add more as needed — only domains with known public federation servers.
 */
const PROBE_DOMAINS = [
  "stellar.org",
  "lobstr.co",
  "stellarterm.com",
  "ultrastellar.com",
  "interstellar.exchange",
];

/** Fetch with a timeout. Throws on timeout or network error. */
async function fetchWithTimeout(
  url: string,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Retrieve the FEDERATION_SERVER URL from a domain's stellar.toml. */
async function getFederationServer(domain: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://${domain}/.well-known/stellar.toml`,
      LOOKUP_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/FEDERATION_SERVER\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Query a federation server for an account-id reverse lookup. */
async function queryFederationServer(
  serverUrl: string,
  address: string,
): Promise<string | null> {
  try {
    const url = `${serverUrl}?q=${encodeURIComponent(address)}&type=id`;
    const res = await fetchWithTimeout(url, LOOKUP_TIMEOUT_MS);
    if (!res.ok) return null;
    const json = await res.json();
    const name: unknown = json?.stellar_address;
    return typeof name === "string" && name.includes("*") ? name : null;
  } catch {
    return null;
  }
}

/** Read cached result from sessionStorage. Returns `undefined` if not cached. */
function readCache(address: string): string | null | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  const key = SESSION_PREFIX + address;
  const raw = sessionStorage.getItem(key);
  if (raw === null) return undefined; // not in cache
  return raw === "" ? null : raw;    // "" encodes a null result
}

/** Write result to sessionStorage. */
function writeCache(address: string, result: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_PREFIX + address, result ?? "");
  } catch {
    // Ignore quota errors.
  }
}

/**
 * Resolve a Stellar federation address (e.g. alice*stellar.org) to a G-address.
 * This is the forward lookup.
 *
 * @param federationAddress  e.g. "alice*stellar.org"
 * @returns  e.g. "GAAAAAAA...", or null if not found / unavailable
 */
export async function resolveFederationName(
  addressOrFederation: string,
): Promise<string | null> {
  // Handle both federation address (forward) and G-address (reverse)
  if (!addressOrFederation) return null;

  // If it looks like a federation address (contains *), do forward lookup
  if (addressOrFederation.includes("*")) {
    return resolveFederationAddress(addressOrFederation);
  }

  // If it starts with G, do reverse lookup
  if (addressOrFederation.startsWith("G")) {
    return resolveFederationNameReverse(addressOrFederation);
  }

  return null;
}

/**
 * Resolve a Stellar federation address (e.g. alice*stellar.org) to a G-address.
 *
 * @param federationAddress  e.g. "alice*stellar.org"
 * @returns  e.g. "GAAAAAAA...", or null if not found / unavailable
 */
async function resolveFederationAddress(
  federationAddress: string,
): Promise<string | null> {
  // Check session cache first
  const cached = readCache(federationAddress);
  if (cached !== undefined) return cached;

  try {
    // Extract domain from federation address
    const parts = federationAddress.split("*");
    if (parts.length !== 2 || !parts[1]) return null;

    const domain = parts[1];
    const server = await getFederationServer(domain);
    if (!server) {
      writeCache(federationAddress, null);
      return null;
    }

    // Query the federation server for the full federation address
    const result = await queryFederationAddressServer(server, federationAddress);
    writeCache(federationAddress, result);
    return result;
  } catch {
    writeCache(federationAddress, null);
    return null;
  }
}

/**
 * Resolve a Stellar public key to a federation address string (reverse lookup), or `null`.
 *
 * @param address  G… Stellar public key
 * @returns  e.g. "alice*stellar.org", or null if not found / unavailable
 */
async function resolveFederationNameReverse(
  address: string,
): Promise<string | null> {
  if (!address || !address.startsWith("G")) return null;

  // Check session cache first.
  const cached = readCache(address);
  if (cached !== undefined) return cached;

  // Probe each domain concurrently — take the first non-null result.
  const results = await Promise.allSettled(
    PROBE_DOMAINS.map(async (domain) => {
      const server = await getFederationServer(domain);
      if (!server) return null;
      return queryFederationServer(server, address);
    }),
  );

  const found =
    results
      .filter(
        (r): r is PromiseFulfilledResult<string | null> =>
          r.status === "fulfilled" && r.value !== null,
      )
      .map((r) => r.value)[0] ?? null;

  writeCache(address, found);
  return found;
}

/** Query a federation server for a federation address lookup (forward). */
async function queryFederationAddressServer(
  serverUrl: string,
  federationAddress: string,
): Promise<string | null> {
  try {
    const url = `${serverUrl}?q=${encodeURIComponent(federationAddress)}&type=name`;
    const res = await fetchWithTimeout(url, LOOKUP_TIMEOUT_MS);
    if (!res.ok) return null;
    const json = await res.json();
    const address: unknown = json?.account_id;
    return typeof address === "string" && address.startsWith("G") ? address : null;
  } catch {
    return null;
  }
}
