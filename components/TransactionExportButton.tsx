"use client";

import { useEffect, useRef, useState } from "react";
import {
  exportTransactions,
  LARGE_EXPORT_THRESHOLD,
  applyExportFilters,
  type ExportFilters,
  type ExportFormat,
  type StreamHistoryEntry,
} from "@/src/lib/export";

interface TransactionExportButtonProps {
  /** Full set of history entries (filters are applied at export time). */
  entries: StreamHistoryEntry[];
  /** Account address used to name the exported file. */
  account?: string | null;
  /** Active table filters, mirrored into the export so it matches the view. */
  filters?: ExportFilters;
  /** Optional callback fired after a successful export. */
  onExported?: (filename: string) => void;
}

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
];

/**
 * One-click transaction-history export with a format selector, busy spinner,
 * and a progress indicator for large datasets (#194).
 */
export default function TransactionExportButton({
  entries,
  account,
  filters,
  onExported,
}: TransactionExportButtonProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const rowCount = applyExportFilters(entries, filters).length;
  const isLarge = rowCount > LARGE_EXPORT_THRESHOLD;
  const disabled = exporting || rowCount === 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleExport() {
    if (disabled) return;
    setExporting(true);
    setProgress(0);
    try {
      const { filename } = await exportTransactions(
        entries,
        format,
        account,
        filters,
        (f) => setProgress(f),
      );
      onExported?.(filename);
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled}
        aria-busy={exporting}
        aria-label={`Export ${rowCount} transaction${rowCount === 1 ? "" : "s"} as ${format.toUpperCase()}`}
        className="relative overflow-hidden flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
      >
        {exporting && (
          <span
            className="absolute inset-0 bg-green-500/30 transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
            aria-hidden="true"
          />
        )}
        <span className="relative flex items-center gap-2">
          {exporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {isLarge ? `Exporting… ${Math.round(progress * 100)}%` : "Exporting…"}
            </>
          ) : (
            <>
              <span aria-hidden="true">⬇</span>
              Export {format.toUpperCase()}
            </>
          )}
        </span>
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={exporting}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Select export format"
          className="h-full px-3 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          {format.toUpperCase()} ▾
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-lg"
          >
            {FORMATS.map((f) => (
              <li key={f.value} role="option" aria-selected={format === f.value}>
                <button
                  type="button"
                  onClick={() => {
                    setFormat(f.value);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 transition-colors ${
                    format === f.value ? "text-green-400" : "text-gray-200"
                  }`}
                >
                  {f.label}
                  {format === f.value && <span className="float-right" aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
