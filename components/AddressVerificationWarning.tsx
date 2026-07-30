"use client";

import { useTranslations } from "@/src/lib/i18n";
import type { AddressVerification } from "@/src/lib/addressVerification";

interface AddressVerificationWarningProps {
  verification: AddressVerification | null;
  onAcknowledge: () => void;
  acknowledged: boolean;
}

/**
 * Displays a warning for unverified addresses with user acknowledgment option.
 * Only shows when address is unverified and user hasn't acknowledged the warning.
 */
export default function AddressVerificationWarning({
  verification,
  onAcknowledge,
  acknowledged,
}: AddressVerificationWarningProps) {
  const t = useTranslations("stream_new");

  // Only show warning for unverified addresses that haven't been acknowledged
  if (!verification || verification.status !== "unverified" || acknowledged) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-red-900/30 border border-red-600/50 rounded-lg space-y-3">
      <div className="flex gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-red-400 mt-0.5"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="flex-1">
          <h3 className="text-red-300 font-medium text-sm mb-1">
            {t("address_unverified_warning_title")}
          </h3>
          <p className="text-red-200/80 text-sm mb-3">
            {t("address_unverified_warning_desc")}
          </p>
          {verification.error && (
            <p className="text-red-200/60 text-xs mb-3 font-mono">
              {t("address_verification_error")}: {verification.error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="acknowledge-unverified"
              checked={acknowledged}
              onChange={(e) => {
                if (e.target.checked) {
                  onAcknowledge();
                }
              }}
              className="w-4 h-4 rounded border-gray-500 bg-gray-700 cursor-pointer accent-red-500"
              aria-label={t("address_acknowledge_warning")}
            />
            <label
              htmlFor="acknowledge-unverified"
              className="text-red-300 text-sm cursor-pointer flex-1"
            >
              {t("address_acknowledge_warning")}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
