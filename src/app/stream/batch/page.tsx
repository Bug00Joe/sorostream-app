"use client";

/**
 * Batch stream creation via CSV upload.
 *
 * Flow:
 *  1. User uploads a CSV file (columns: recipient, amount, duration_seconds, token)
 *  2. App parses and validates every row — invalid rows show inline errors
 *  3. Valid rows render in a preview table
 *  4. User confirms → app creates all streams sequentially via sorostream SDK
 *  5. On success, user is redirected to the dashboard where the new streams appear
 *
 * Accepted CSV format (header row required, order matters):
 *   recipient,amount,duration_seconds,token
 *   GBKL...KLHA,100,86400,USDC
 *   GXYZ...XYZ,50,3600,XLM
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { sorostream } from "@/src/lib/sorostream";
import TransactionStepper, { TxStage } from "@/components/TransactionStepper";
import { trackEvent } from "@/src/lib/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatchRow {
  /** 0-based index in the original CSV (for error attribution) */
  index: number;
  recipient: string;
  amount: string;
  duration_seconds: number;
  token: string;
  /** Validation errors for this row, keyed by field name */
  errors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Parsing & validation helpers
// ---------------------------------------------------------------------------

const REQUIRED_HEADERS = ["recipient", "amount", "duration_seconds", "token"] as const;

function validateRow(raw: Record<string, string>, index: number): BatchRow {
  const errors: Record<string, string> = {};

  const recipient = (raw.recipient ?? "").trim();
  if (!recipient) {
    errors.recipient = "Recipient is required.";
  } else if (!/^G[A-Z2-7]{55}$/.test(recipient)) {
    errors.recipient = "Must be a valid Stellar public key (starts with G, 56 chars).";
  }

  const amount = (raw.amount ?? "").trim();
  if (!amount) {
    errors.amount = "Amount is required.";
  } else if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) {
    errors.amount = "Amount must be a positive number.";
  }

  const durationRaw = (raw.duration_seconds ?? "").trim();
  const duration_seconds = parseInt(durationRaw, 10);
  if (!durationRaw) {
    errors.duration_seconds = "Duration is required.";
  } else if (isNaN(duration_seconds) || duration_seconds <= 0) {
    errors.duration_seconds = "Duration must be a positive integer (seconds).";
  }

  const token = (raw.token ?? "").trim();
  if (!token) {
    errors.token = "Token is required.";
  }

  return { index, recipient, amount, duration_seconds: isNaN(duration_seconds) ? 0 : duration_seconds, token, errors };
}

/**
 * Parse a CSV string into an array of BatchRow objects.
 * Returns `{ rows, headerError }` — headerError is set when required columns
 * are missing so the UI can surface a file-level error.
 */
function parseCSV(text: string): { rows: BatchRow[]; headerError: string | null } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], headerError: "CSV file is empty." };
  }

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      headerError: `Missing required columns: ${missingHeaders.join(", ")}. Expected: ${REQUIRED_HEADERS.join(", ")}`,
    };
  }

  const dataLines = lines.slice(1);
  if (dataLines.length === 0) {
    return { rows: [], headerError: "CSV has a header but no data rows." };
  }

  const rows: BatchRow[] = dataLines.map((line, i) => {
    const values = line.split(",").map((v) => v.trim());
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] ?? "";
    });
    return validateRow(raw, i);
  });

  return { rows, headerError: null };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BatchStreamPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<BatchRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [txStage, setTxStage] = useState<TxStage | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  const validRows = rows.filter((r) => Object.keys(r.errors).length === 0);
  const invalidRows = rows.filter((r) => Object.keys(r.errors).length > 0);
  const hasValidRows = validRows.length > 0;

  // ── File handling ──────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setFileError("Only .csv files are accepted.");
      setRows([]);
      setFileName(null);
      return;
    }

    setFileName(file.name);
    setFileError(null);
    setRows([]);
    setSubmitError(null);
    setCreatedCount(0);
    setTxStage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows: parsed, headerError } = parseCSV(text);
      if (headerError) {
        setFileError(headerError);
        setRows([]);
      } else {
        setRows(parsed);
      }
    };
    reader.onerror = () => {
      setFileError("Failed to read the file.");
    };
    reader.readAsText(file);
  }

  function handleReset() {
    setRows([]);
    setFileError(null);
    setFileName(null);
    setSubmitError(null);
    setCreatedCount(0);
    setTxStage(null);
    setSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Submission ─────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!hasValidRows) return;

    setSubmitting(true);
    setSubmitError(null);
    setCreatedCount(0);
    setTxStage(TxStage.Building);
    trackEvent({ type: "stream_create_start" });

    try {
      await new Promise((r) => setTimeout(r, 300));
      setTxStage(TxStage.Signing);
      await new Promise((r) => setTimeout(r, 300));
      setTxStage(TxStage.Submitting);

      let created = 0;
      for (const row of validRows) {
        await sorostream.createStream({
          recipient: row.recipient,
          amount: row.amount,
          durationSeconds: row.duration_seconds,
          token: row.token,
        });
        created++;
        setCreatedCount(created);
        trackEvent({ type: "stream_create_complete", streamId: String(created) });
      }

      setTxStage(TxStage.Done);
      await new Promise((r) => setTimeout(r, 1500));
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Batch creation failed. Please try again.",
      );
      setTxStage(null);
      setSubmitting(false);
    }
  }

  // ── Render: submission in progress ─────────────────────────────────────

  if (submitting) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-gray-900 text-white p-4 sm:p-8"
      >
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-8">Creating Batch Streams</h1>
          <div
            className="bg-gray-800 rounded-xl p-8 space-y-6"
            aria-label="Batch transaction in progress"
          >
            <p className="text-center text-gray-300 text-sm">
              {txStage === TxStage.Done
                ? `✅ ${createdCount} stream${createdCount !== 1 ? "s" : ""} created!`
                : `Creating stream ${createdCount + 1} of ${validRows.length}…`}
            </p>
            {txStage !== null && (
              <TransactionStepper currentStage={txStage} />
            )}
            {submitError && (
              <>
                <p className="text-red-400 text-sm text-center" role="alert">
                  {submitError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitting(false);
                    setTxStage(null);
                    setSubmitError(null);
                  }}
                  className="w-full border border-gray-600 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Back to Preview
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Render: main upload + preview UI ───────────────────────────────────

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-gray-900 text-white p-4 sm:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Batch Stream Creation</h1>
          <p className="mt-1 text-sm text-gray-400">
            Upload a CSV file to create multiple streams at once. Required columns:{" "}
            <code className="text-green-400 bg-gray-800 px-1 rounded">
              recipient, amount, duration_seconds, token
            </code>
          </p>
        </div>

        {/* Upload area */}
        <div className="space-y-3">
          <label
            htmlFor="csv-upload"
            className="block text-sm font-medium text-gray-200"
          >
            Upload CSV file
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              id="csv-upload"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              aria-label="Upload CSV file"
              aria-describedby={fileError ? "csv-file-error" : undefined}
              aria-invalid={!!fileError}
              className="block text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-green-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-800 file:cursor-pointer cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            />
            {fileName && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-white transition-colors"
                aria-label="Clear uploaded file"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* File-level error */}
          {fileError && (
            <p
              id="csv-file-error"
              role="alert"
              className="text-red-400 text-sm"
              aria-live="polite"
            >
              {fileError}
            </p>
          )}

          {/* Row count summary */}
          {rows.length > 0 && (
            <p className="text-xs text-gray-400">
              {rows.length} row{rows.length !== 1 ? "s" : ""} parsed —{" "}
              <span className="text-green-400">{validRows.length} valid</span>
              {invalidRows.length > 0 && (
                <>,{" "}
                  <span className="text-red-400">
                    {invalidRows.length} invalid
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <div
              className="overflow-x-auto rounded-xl border border-gray-700"
              aria-label="Batch stream preview table"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-gray-400 text-left">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Recipient</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Token</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const hasError = Object.keys(row.errors).length > 0;
                    const durationLabel = (() => {
                      const s = row.duration_seconds;
                      if (s >= 86400) return `${Math.floor(s / 86400)}d`;
                      if (s >= 3600) return `${Math.floor(s / 3600)}h`;
                      return `${Math.floor(s / 60)}m`;
                    })();

                    return (
                      <tr
                        key={row.index}
                        className={`border-t border-gray-700 ${
                          hasError ? "bg-red-950/20" : "hover:bg-gray-800/50"
                        }`}
                        aria-invalid={hasError || undefined}
                      >
                        <td className="px-4 py-3 text-gray-500 font-mono">
                          {row.index + 1}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {row.errors.recipient ? (
                            <span className="text-red-400" role="alert">
                              {row.recipient || "—"}{" "}
                              <span className="text-xs block">{row.errors.recipient}</span>
                            </span>
                          ) : (
                            <span className="text-white">
                              {row.recipient.slice(0, 6)}…{row.recipient.slice(-4)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.errors.amount ? (
                            <span className="text-red-400" role="alert">
                              {row.amount || "—"}{" "}
                              <span className="text-xs block">{row.errors.amount}</span>
                            </span>
                          ) : (
                            <span className="text-white">{row.amount}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.errors.duration_seconds ? (
                            <span className="text-red-400" role="alert">
                              —{" "}
                              <span className="text-xs block">
                                {row.errors.duration_seconds}
                              </span>
                            </span>
                          ) : (
                            <span className="text-white">{durationLabel}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.errors.token ? (
                            <span className="text-red-400" role="alert">
                              {row.token || "—"}
                            </span>
                          ) : (
                            <span className="text-white">{row.token}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasError ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-900/50 text-red-400">
                              Invalid
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-400">
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Submit / reset actions */}
            <div className="flex flex-wrap gap-3">
              {hasValidRows && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Create {validRows.length} Stream{validRows.length !== 1 ? "s" : ""}
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="border border-gray-600 text-gray-300 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
