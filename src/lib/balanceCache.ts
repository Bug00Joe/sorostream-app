/**
 * balanceCache — IndexedDB-backed balance snapshot store.
 *
 * Stores periodic balance snapshots (hourly) so the portfolio chart can show
 * historical balance trends without hitting the Horizon API on every visit.
 *
 * Snapshots are keyed by `(address, timestamp)` and auto-expire after 90 days.
 */

const DB_NAME = "sorostream_balance_cache";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export interface BalanceSnapshot {
  /** Stellar account address. */
  address: string;
  /** ISO-8601 timestamp of the snapshot. */
  timestamp: string;
  /** Balances keyed by asset code (e.g. "XLM", "USDC"). */
  balances: Record<string, number>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: ["address", "timestamp"] });
        store.createIndex("address", "address", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store a balance snapshot. If a snapshot for the same address+timestamp
 * already exists it is silently replaced.
 */
export async function saveSnapshot(snapshot: BalanceSnapshot): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(snapshot);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Retrieve all snapshots for a given address within the lookback window.
 * Snapshots older than `maxAgeMs` (default 90 days) are pruned on read.
 */
export async function getSnapshots(
  address: string,
  maxAgeMs: number = MAX_AGE_MS,
): Promise<BalanceSnapshot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("address");
    const range = IDBKeyRange.only(address);
    const request = index.openCursor(range);

    const results: BalanceSnapshot[] = [];
    const cutoff = Date.now() - maxAgeMs;
    const staleKeys: [string, string][] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        // Prune stale entries in a separate write transaction
        if (staleKeys.length > 0) {
          const pruneTx = db.transaction(STORE_NAME, "readwrite");
          const pruneStore = pruneTx.objectStore(STORE_NAME);
          for (const key of staleKeys) pruneStore.delete(key);
          pruneTx.oncomplete = () => { db.close(); resolve(results); };
          pruneTx.onerror = () => { db.close(); resolve(results); };
        } else {
          db.close();
          resolve(results);
        }
        return;
      }

      const snapshot = cursor.value as BalanceSnapshot;
      const ts = new Date(snapshot.timestamp).getTime();
      if (ts < cutoff) {
        staleKeys.push([snapshot.address, snapshot.timestamp]);
      } else {
        results.push(snapshot);
      }
      cursor.continue();
    };

    request.onerror = () => { db.close(); reject(request.error); };
  });
}

/**
 * Return the most recent snapshot for an address, or null if none exist.
 */
export async function getLatestSnapshot(address: string): Promise<BalanceSnapshot | null> {
  const snapshots = await getSnapshots(address);
  if (snapshots.length === 0) return null;
  return snapshots[snapshots.length - 1];
}

/**
 * Determine whether a new snapshot should be stored based on the time
 * elapsed since the last snapshot for this address. Returns true if at
 * least `minIntervalMs` have passed (or no snapshot exists yet).
 */
export async function shouldSnapshot(
  address: string,
  minIntervalMs: number = 60 * 60 * 1000, // 1 hour
): Promise<boolean> {
  const latest = await getLatestSnapshot(address);
  if (!latest) return true;
  return Date.now() - new Date(latest.timestamp).getTime() >= minIntervalMs;
}

/**
 * Clear all snapshots for a given address (e.g. on wallet disconnect).
 */
export async function clearSnapshots(address: string): Promise<void> {
  const snapshots = await getSnapshots(address, Infinity);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const s of snapshots) {
      store.delete([s.address, s.timestamp]);
    }
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
