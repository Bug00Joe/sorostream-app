"use client";

import { BADGE_CAP } from "@/src/context/NotificationContext";

interface NotificationBadgeProps {
  count: number;
  /** Human label for the section, used in the accessible description. */
  label?: string;
}

/**
 * Small count overlay shown on a navigation item when there is unread
 * activity. Renders nothing when count is 0 and caps display at "99+" (#193).
 */
export default function NotificationBadge({ count, label }: NotificationBadgeProps) {
  if (count <= 0) return null;
  const display = count > BADGE_CAP ? `${BADGE_CAP}+` : String(count);
  return (
    <span
      className="ml-1 inline-flex min-w-[1.1rem] h-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white"
      role="status"
      aria-label={`${count} unread ${label ?? "notification"}${count === 1 ? "" : "s"}`}
    >
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
