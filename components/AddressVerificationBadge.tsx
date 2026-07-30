"use client";

import { useTranslations } from "@/src/lib/i18n";
import type { VerificationStatus } from "@/src/lib/addressVerification";

interface AddressVerificationBadgeProps {
  status: VerificationStatus;
  federationName?: string | null;
}

/**
 * Displays a verification status badge with appropriate styling.
 *
 * Statuses:
 * - "verified" (green): Federation name resolved + account exists
 * - "active" (blue): Account exists, no federation name
 * - "unverified" (red): Account not found or verification failed
 * - "pending" (gray): Verification in progress
 */
export default function AddressVerificationBadge({
  status,
  federationName,
}: AddressVerificationBadgeProps) {
  const t = useTranslations("stream_new");

  const getBadgeStyles = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return "bg-green-900/40 text-green-300 border-green-600/40";
      case "active":
        return "bg-blue-900/40 text-blue-300 border-blue-600/40";
      case "unverified":
        return "bg-red-900/40 text-red-300 border-red-600/40";
      case "pending":
        return "bg-gray-700/40 text-gray-300 border-gray-600/40";
      default:
        return "bg-gray-700/40 text-gray-300 border-gray-600/40";
    }
  };

  const getStatusLabel = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return t("address_verified");
      case "active":
        return t("address_active");
      case "unverified":
        return t("address_unverified");
      case "pending":
        return t("address_verifying");
      default:
        return "Unknown";
    }
  };

  const getIcon = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case "active":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case "pending":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-spin"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        );
      case "unverified":
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(
        status
      )}`}
    >
      {getIcon(status)}
      <span>
        {getStatusLabel(status)}
        {status === "verified" && federationName && (
          <span className="ml-1 text-xs opacity-75">({federationName})</span>
        )}
      </span>
    </div>
  );
}
