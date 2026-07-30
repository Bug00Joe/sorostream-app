/**
 * Returns the user's local timezone identifier (e.g. "America/New_York").
 * Safe to call in SSR – falls back to "UTC".
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Format an ISO timestamp (or Date) as a locale string with timezone
 * abbreviation in the user's local timezone.
 *
 * Example output: "Dec 31, 2025, 11:59 PM EST"
 */
export function formatDateWithTimezone(
  value: Date | string,
  locale: string = "en",
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toLocaleString(locale);
  }
}

/**
 * Format an ISO timestamp (or Date) as a short date with timezone
 * abbreviation. Suitable for compact UI (e.g. timeline labels).
 *
 * Example output: "Dec 31, 2025 EST"
 */
export function formatDateShortWithTimezone(
  value: Date | string,
  locale: string = "en",
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toLocaleDateString(locale);
  }
}
