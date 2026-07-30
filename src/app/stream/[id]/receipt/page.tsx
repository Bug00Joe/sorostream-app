"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMockStream, formatStellarAmount, type StreamData } from "@/src/lib/sorostream";
import { formatDateWithTimezone } from "@/src/lib/timezone";

// ── helpers ────────────────────────────────────────────────────────────────

/** Format stroops as a human-readable token amount (7 decimal places). */
function fmtAmount(stroops: number): string {
  return formatStellarAmount(stroops);
}

/**
 * Estimate total streamed: for Ended streams use the full deposit; for
 * Cancelled streams use the amount that actually flowed before cancellation
 * (flowRate × elapsed seconds, capped at deposit).
 */
function calcTotalStreamed(stream: StreamData): number {
  const start = new Date(stream.startTime).getTime();
  const end = new Date(stream.endTime).getTime();
  const elapsed = Math.max(0, end - start) / 1000; // seconds

  if (stream.status === "Ended") {
    return stream.deposit;
  }
  // Cancelled: compute how much actually flowed
  const streamed = Math.floor(stream.flowRate * elapsed);
  return Math.min(streamed, stream.deposit);
}

/**
 * Estimate protocol fee (0.5% of total streamed — mirrors the on-chain
 * default of 50 basis points used in calcWithdrawBreakdown).
 */
function calcProtocolFee(totalStreamed: number): number {
  return Math.floor((totalStreamed * 50) / 10_000);
}

/** Total claimed = lastWithdrawTime-based estimate. We use deposit as proxy. */
function calcTotalClaimed(stream: StreamData): number {
  // In production this comes from on-chain withdrawal history.
  // Here we use the deposit as the upper bound for Ended, or proportional for Cancelled.
  return calcTotalStreamed(stream);
}

// ── Receipt page ─────────────────────────────────────────────────────────────

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [stream, setStream] = useState<StreamData | null | undefined>(undefined);

  useEffect(() => {
    // Synchronous mock lookup — replace with async RPC call in production.
    const data = getMockStream(params.id);
    setStream(data);
  }, [params.id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (stream === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading receipt…</p>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (stream === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-2xl font-bold text-gray-900">Stream not found</p>
        <p className="text-gray-500 text-sm">
          No stream with ID <span className="font-mono">#{params.id}</span> exists.
        </p>
        <Link href="/dashboard" className="text-green-700 underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── Only show receipts for terminal streams ──────────────────────────────
  const isTerminal = stream.status === "Ended" || stream.status === "Cancelled";
  if (!isTerminal) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-2xl font-bold text-gray-900">Receipt unavailable</p>
        <p className="text-gray-500 text-sm max-w-sm text-center">
          A receipt can only be generated for <strong>Completed</strong> or{" "}
          <strong>Cancelled</strong> streams. Stream #{params.id} is currently{" "}
          <strong>{stream.status}</strong>.
        </p>
        <Link
          href={`/stream/${params.id}`}
          className="text-green-700 underline text-sm"
        >
          ← Back to Stream
        </Link>
      </div>
    );
  }

  const totalStreamed = calcTotalStreamed(stream);
  const totalClaimed = calcTotalClaimed(stream);
  const protocolFee = calcProtocolFee(totalStreamed);
  const receiptId = `RCP-${stream.id}-${new Date(stream.endTime).getFullYear()}`;
  const generatedAt = new Date().toISOString();

  return (
    <>
      {/* ── Print / action bar — hidden when printing ────────────────────── */}
      <div className="no-print bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href={`/stream/${stream.id}`}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Stream
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
          >
            {/* printer icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
          <button
            onClick={() => window.print()}
            aria-label="Download PDF — use 'Save as PDF' in your browser's print dialog"
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            {/* download icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Receipt document ─────────────────────────────────────────────── */}
      <main
        id="receipt-content"
        className="receipt-page bg-white min-h-screen p-8 sm:p-12 max-w-2xl mx-auto"
        aria-label="Payment stream receipt"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-700 mb-1">
              SoroStream
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Payment Receipt</h1>
            <p className="text-gray-500 text-sm mt-1">
              Stellar Soroban · {stream.token} payment stream
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full ${
                stream.status === "Ended"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {stream.status === "Ended" ? "Completed" : "Cancelled"}
            </span>
            <p className="text-gray-400 text-xs mt-2 font-mono">{receiptId}</p>
          </div>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Parties */}
        <section aria-labelledby="parties-heading" className="mb-8">
          <h2
            id="parties-heading"
            className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4"
          >
            Parties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Sender (Payer)</p>
              <p className="font-mono text-sm text-gray-900 break-all">{stream.sender}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Recipient (Payee)</p>
              <p className="font-mono text-sm text-gray-900 break-all">{stream.recipient}</p>
            </div>
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Stream details */}
        <section aria-labelledby="stream-details-heading" className="mb-8">
          <h2
            id="stream-details-heading"
            className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4"
          >
            Stream Details
          </h2>
          <dl className="space-y-3">
            <Row label="Stream ID" value={`#${stream.id}`} mono />
            <Row label="Token" value={stream.token} />
            <Row
              label="Start Date"
              value={formatDateWithTimezone(stream.startTime)}
            />
            <Row
              label="End Date"
              value={formatDateWithTimezone(stream.endTime)}
            />
            <Row
              label="Flow Rate"
              value={`${fmtAmount(stream.flowRate)} ${stream.token}/sec`}
              mono
            />
          </dl>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Financial summary */}
        <section aria-labelledby="financial-heading" className="mb-10">
          <h2
            id="financial-heading"
            className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4"
          >
            Financial Summary
          </h2>
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <FinancialRow
              label="Total Deposited"
              value={`${fmtAmount(stream.deposit)} ${stream.token}`}
            />
            <FinancialRow
              label="Total Streamed"
              value={`${fmtAmount(totalStreamed)} ${stream.token}`}
            />
            <FinancialRow
              label="Total Claimed"
              value={`${fmtAmount(totalClaimed)} ${stream.token}`}
            />
            <div className="border-t border-gray-200 pt-3">
              <FinancialRow
                label="Protocol Fee (0.5%)"
                value={`${fmtAmount(protocolFee)} ${stream.token}`}
                muted
              />
            </div>
            <div className="border-t border-gray-300 pt-3">
              <FinancialRow
                label="Net Received"
                value={`${fmtAmount(totalClaimed - protocolFee)} ${stream.token}`}
                bold
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-400">
          <p>
            Generated{" "}
            <time dateTime={generatedAt}>{formatDateWithTimezone(generatedAt)}</time>
          </p>
          <p className="font-mono">sorostream.app/stream/{stream.id}/receipt</p>
        </div>
      </main>

      {/* ── Print styles ──────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-page {
            max-width: 100% !important;
            padding: 1.5cm 2cm !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd
        className={`text-sm text-gray-900 text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function FinancialRow({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span
        className={`text-sm ${muted ? "text-gray-400" : "text-gray-600"} ${bold ? "font-semibold text-gray-900" : ""}`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-sm ${muted ? "text-gray-400" : "text-gray-900"} ${bold ? "font-bold text-base" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
