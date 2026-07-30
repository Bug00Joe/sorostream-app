export interface StreamHistoryEntry {
  timestamp: string;
  type: "withdrawal" | "top-up" | "creation" | "cancellation";
  amount: string;
  txHash: string;
  /**
   * True when this entry was synthesised client-side (not sourced from an
   * on-chain event or an indexer). Must never appear in exported CSVs or be
   * treated as authoritative transaction data.
   */
  isMock?: boolean;
}

export function toCSV(entries: StreamHistoryEntry[]): string {
  const header = "date,type,amount,token,transaction_id";
  const rows = entries.map((e) => {
    const date = new Date(e.timestamp).toLocaleString();
    const amount = (Number(e.amount) / 10_000_000).toFixed(2);
    return `${date},${e.type},${amount},USDC,${e.txHash}`;
  });
  return [header, ...rows].join("\n");
}

export function toJSON(entries: StreamHistoryEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export type ExportFormat = "csv" | "json";

/** Filters that can be applied to a transaction-history export (#194). */
export interface ExportFilters {
  /** Inclusive start of the date range (ISO string). */
  from?: string;
  /** Inclusive end of the date range (ISO string). */
  to?: string;
  /** Restrict to a single asset/token. */
  token?: string;
  /** Restrict to a single transaction type. */
  type?: StreamHistoryEntry["type"];
}

/** Apply the active UI filters to the entries so exports mirror the table. */
export function applyExportFilters(
  entries: StreamHistoryEntry[],
  filters: ExportFilters = {},
): StreamHistoryEntry[] {
  const fromTime = filters.from ? new Date(filters.from).getTime() : undefined;
  const toTime = filters.to ? new Date(filters.to).getTime() : undefined;
  return entries.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    if (fromTime !== undefined && t < fromTime) return false;
    if (toTime !== undefined && t > toTime) return false;
    if (filters.type && e.type !== filters.type) return false;
    return true;
  });
}

function toYmd(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().split("T")[0]
    : d.toISOString().split("T")[0];
}

/** Earliest/latest dates present in the entries, as YYYY-MM-DD strings. */
export function getDateRange(entries: StreamHistoryEntry[]): { start: string; end: string } {
  if (entries.length === 0) {
    const today = new Date().toISOString().split("T")[0];
    return { start: today, end: today };
  }
  const times = entries.map((e) => new Date(e.timestamp).getTime()).filter((t) => !Number.isNaN(t));
  const min = new Date(Math.min(...times)).toISOString().split("T")[0];
  const max = new Date(Math.max(...times)).toISOString().split("T")[0];
  return { start: min, end: max };
}

/**
 * Build a descriptive filename from the account address and the date range
 * covered by the export, e.g. `GXYZ_2025-01-01_2025-06-30.csv` (#194).
 */
export function buildExportFilename(
  account: string | null | undefined,
  entries: StreamHistoryEntry[],
  format: ExportFormat,
  filters: ExportFilters = {},
): string {
  // Sanitise the account label — addresses may contain "..." from truncation.
  const label = (account || "account").replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "account";
  const start = filters.from ? toYmd(filters.from) : getDateRange(entries).start;
  const end = filters.to ? toYmd(filters.to) : getDateRange(entries).end;
  return `${label}_${start}_${end}.${format}`;
}

/** Number of rows above which we treat an export as "large" and show progress. */
export const LARGE_EXPORT_THRESHOLD = 1000;

/**
 * Serialise entries to the requested format, building the payload in chunks so
 * very large exports don't block the main thread. `onProgress` is called with a
 * 0–1 fraction so callers can render a progress indicator (#194).
 */
export async function exportTransactions(
  entries: StreamHistoryEntry[],
  format: ExportFormat,
  account: string | null | undefined,
  filters: ExportFilters = {},
  onProgress?: (fraction: number) => void,
): Promise<{ filename: string; mimeType: string }> {
  const filtered = applyExportFilters(entries, filters);
  const filename = buildExportFilename(account, filtered, format, filters);

  if (format === "json") {
    onProgress?.(0.5);
    const content = toJSON(filtered);
    onProgress?.(1);
    downloadBlob(content, filename, "application/json");
    return { filename, mimeType: "application/json" };
  }

  // CSV — build header + rows in chunks, yielding to the event loop between
  // chunks so the progress indicator can paint on large datasets.
  const CHUNK_SIZE = 200;
  const chunks: string[] = ["date,type,amount,token,transaction_id\n"];
  for (let i = 0; i < filtered.length; i += CHUNK_SIZE) {
    const slice = filtered.slice(i, i + CHUNK_SIZE);
    const rows = slice.map((e) => {
      const date = new Date(e.timestamp).toLocaleString();
      const amount = (Number(e.amount) / 10_000_000).toFixed(2);
      return `${date},${e.type},${amount},USDC,${e.txHash}`;
    });
    chunks.push(rows.join("\n") + "\n");
    onProgress?.(Math.min(1, (i + CHUNK_SIZE) / Math.max(1, filtered.length)));
    if (filtered.length > LARGE_EXPORT_THRESHOLD) {
      // Yield so the UI can repaint the progress bar.
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  onProgress?.(1);
  downloadBlob(chunks.join(""), filename, "text/csv");
  return { filename, mimeType: "text/csv" };
}

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSVStreaming(entries: StreamHistoryEntry[], streamId: string) {
  const date = new Date().toISOString().split('T')[0];
  const filename = `stream-${streamId}-history-${date}.csv`;
  
  const header = "date,type,amount,token,transaction_id\n";
  const chunks: string[] = [header];
  
  const CHUNK_SIZE = 100;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const rows = chunk.map((e) => {
      const dateStr = new Date(e.timestamp).toLocaleString();
      const amount = (Number(e.amount) / 10_000_000).toFixed(2);
      return `${dateStr},${e.type},${amount},USDC,${e.txHash}`;
    });
    chunks.push(rows.join("\n") + "\n");
  }
  
  const blob = new Blob(chunks, { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(entries: StreamHistoryEntry[], streamId: string) {
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(toCSV(entries), `stream-${streamId}-history-${date}.csv`, "text/csv");
}

export function downloadJSON(entries: StreamHistoryEntry[], streamId: string) {
  downloadBlob(toJSON(entries), `stream-${streamId}-history.json`, "application/json");
}
