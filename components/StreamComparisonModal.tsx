"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useFocusTrap } from "@/src/lib/useFocusTrap";
import { useTranslations } from "@/src/lib/i18n";
import type { StreamData } from "@/src/lib/sorostream";
import { formatStellarAmount, formatStreamAmount } from "@/src/lib/sorostream";
import FederationName from "@/components/FederationName";

interface StreamComparisonModalProps {
  open: boolean;
  onClose: () => void;
  currentStream: StreamData;
  availableStreams: StreamData[];
}

/**
 * Compares two streams side-by-side with searchable dropdown.
 * Shows key parameters: amount, flow rate, recipient, status, claimable, end date.
 * Highlights differences between the streams.
 */
export default function StreamComparisonModal({
  open,
  onClose,
  currentStream,
  availableStreams,
}: StreamComparisonModalProps) {
  const t = useTranslations("stream_detail");
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useFocusTrap(dialogRef, open);

  // Filter out current stream and search through available streams
  const filteredStreams = useMemo(() => {
    return availableStreams.filter((stream) => {
      if (stream.id === currentStream.id) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        stream.id.toLowerCase().includes(query) ||
        stream.recipient.toLowerCase().includes(query) ||
        stream.sender.toLowerCase().includes(query)
      );
    });
  }, [availableStreams, currentStream.id, searchQuery]);

  const selectedStream = filteredStreams.find((s) => s.id === selectedStreamId);

  // Close modal on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isDropdownOpen, onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getDifference = (value1: any, value2: any): boolean => {
    return String(value1) !== String(value2);
  };

  const ComparisonRow = ({
    label,
    current,
    compared,
    highlighted,
  }: {
    label: string;
    current: React.ReactNode;
    compared: React.ReactNode;
    highlighted: boolean;
  }) => (
    <div
      className={`grid grid-cols-3 gap-4 py-3 px-3 border-b border-gray-700 last:border-0 ${
        highlighted ? "bg-amber-900/20" : ""
      }`}
    >
      <div className="text-gray-400 text-sm font-medium">{label}</div>
      <div className={highlighted ? "text-amber-300 font-medium" : ""}>
        {current}
      </div>
      <div className={highlighted ? "text-amber-300 font-medium" : ""}>
        {compared}
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <h2
            id="comparison-title"
            className="text-xl font-semibold text-white"
          >
            {t("compare_modal_title")}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close comparison modal"
            className="text-gray-400 hover:text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {availableStreams.length === 1 ? (
            <div className="text-center py-8 text-gray-400">
              <p>
                {t("compare_single_stream")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stream Selector */}
              <div>
                <label htmlFor="compare-stream" className="block text-sm font-medium text-gray-200 mb-2">
                  {t("compare_select_stream")}
                </label>
                <div ref={dropdownRef} className="relative">
                  <button
                    id="compare-stream"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-left text-gray-100 hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 flex items-center justify-between"
                  >
                    <span>
                      {selectedStream
                        ? `${selectedStream.id.slice(0, 8)}... • ${selectedStream.recipient.slice(0, 8)}...`
                        : t("compare_choose_stream")}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className={`transform transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10">
                      {/* Search Input */}
                      <div className="p-2 border-b border-gray-600">
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder={t("compare_search_placeholder")}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                          autoFocus
                        />
                      </div>

                      {/* Stream List */}
                      <ul className="max-h-60 overflow-y-auto">
                        {filteredStreams.length === 0 ? (
                          <li className="px-3 py-2 text-sm text-gray-400 text-center">
                            {t("compare_no_streams_found")}
                          </li>
                        ) : (
                          filteredStreams.map((stream) => (
                            <li key={stream.id}>
                              <button
                                onClick={() => {
                                  setSelectedStreamId(stream.id);
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors text-sm text-gray-100 flex flex-col gap-1"
                              >
                                <div className="font-medium">
                                  {stream.id.slice(0, 16)}
                                  {stream.id.length > 16 ? "..." : ""}
                                </div>
                                <div className="text-xs text-gray-400">
                                  To: {stream.recipient.slice(0, 16)}
                                  {stream.recipient.length > 16 ? "..." : ""}
                                </div>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              {selectedStream && (
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 gap-4 bg-gray-700 px-3 py-3 border-b border-gray-600 font-medium text-sm">
                    <div className="text-gray-300">{t("compare_parameter")}</div>
                    <div className="text-blue-400">{t("compare_current_stream")}</div>
                    <div className="text-purple-400">{t("compare_comparison_stream")}</div>
                  </div>

                  {/* Table Body */}
                  <div className="bg-gray-800">
                    <ComparisonRow
                      label={t("compare_stream_id")}
                      current={currentStream.id.slice(0, 16) + "..."}
                      compared={selectedStream.id.slice(0, 16) + "..."}
                      highlighted={false}
                    />

                    <ComparisonRow
                      label={t("compare_status")}
                      current={
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            currentStream.status === "Active"
                              ? "bg-green-900/40 text-green-300"
                              : currentStream.status === "Ended"
                                ? "bg-gray-600/40 text-gray-300"
                                : "bg-red-900/40 text-red-300"
                          }`}
                        >
                          {currentStream.status}
                        </span>
                      }
                      compared={
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            selectedStream.status === "Active"
                              ? "bg-green-900/40 text-green-300"
                              : selectedStream.status === "Ended"
                                ? "bg-gray-600/40 text-gray-300"
                                : "bg-red-900/40 text-red-300"
                          }`}
                        >
                          {selectedStream.status}
                        </span>
                      }
                      highlighted={getDifference(
                        currentStream.status,
                        selectedStream.status
                      )}
                    />

                    <ComparisonRow
                      label={t("compare_recipient")}
                      current={
                        <div className="text-sm font-mono truncate">
                          <FederationName
                            address={currentStream.recipient}
                            truncate
                          />
                        </div>
                      }
                      compared={
                        <div className="text-sm font-mono truncate">
                          <FederationName
                            address={selectedStream.recipient}
                            truncate
                          />
                        </div>
                      }
                      highlighted={getDifference(
                        currentStream.recipient,
                        selectedStream.recipient
                      )}
                    />

                    <ComparisonRow
                      label={t("compare_amount")}
                      current={formatStreamAmount(currentStream.deposit)}
                      compared={formatStreamAmount(selectedStream.deposit)}
                      highlighted={getDifference(
                        currentStream.deposit,
                        selectedStream.deposit
                      )}
                    />

                    <ComparisonRow
                      label={t("compare_flow_rate")}
                      current={
                        <div className="text-sm">
                          {formatStellarAmount(currentStream.flowRate)} / sec
                        </div>
                      }
                      compared={
                        <div className="text-sm">
                          {formatStellarAmount(selectedStream.flowRate)} / sec
                        </div>
                      }
                      highlighted={getDifference(
                        currentStream.flowRate,
                        selectedStream.flowRate
                      )}
                    />

                    <ComparisonRow
                      label={t("compare_start_date")}
                      current={formatDate(currentStream.startTime)}
                      compared={formatDate(selectedStream.startTime)}
                      highlighted={getDifference(
                        currentStream.startTime,
                        selectedStream.startTime
                      )}
                    />

                    <ComparisonRow
                      label={t("compare_end_date")}
                      current={formatDate(currentStream.endTime)}
                      compared={formatDate(selectedStream.endTime)}
                      highlighted={getDifference(
                        currentStream.endTime,
                        selectedStream.endTime
                      )}
                    />

                    <ComparisonRow
                      label={t("compare_duration")}
                      current={
                        <div className="text-sm">
                          {(() => {
                            const start = new Date(currentStream.startTime).getTime();
                            const end = new Date(currentStream.endTime).getTime();
                            const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
                            return t("compare_days", { days: String(days) });
                          })()}
                        </div>
                      }
                      compared={
                        <div className="text-sm">
                          {(() => {
                            const start = new Date(selectedStream.startTime).getTime();
                            const end = new Date(selectedStream.endTime).getTime();
                            const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
                            return t("compare_days", { days: String(days) });
                          })()}
                        </div>
                      }
                      highlighted={false}
                    />

                    <ComparisonRow
                      label={t("compare_auto_renew")}
                      current={currentStream.autoRenew ? "Yes" : "No"}
                      compared={selectedStream.autoRenew ? "Yes" : "No"}
                      highlighted={getDifference(
                        currentStream.autoRenew,
                        selectedStream.autoRenew
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            {t("compare_close")}
          </button>
        </div>
      </div>
    </div>
  );
}
