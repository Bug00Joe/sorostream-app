export interface NotificationEventPrefs {
  /** Notify when a stream finishes fully vesting/streaming. */
  streamCompleted: boolean;
  /** Notify ~24 hours before a stream is scheduled to expire. */
  expiringSoon: boolean;
  /** Notify when claimable funds become available to withdraw. */
  withdrawalAvailable: boolean;
}

export interface NotificationPrefs {
  /** Master switch — when false, no notifications are sent regardless of the settings below. */
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  email: string;
  events: NotificationEventPrefs;
}

const STORAGE_KEY = "sorostream_notification_prefs";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: true,
  pushEnabled: false,
  emailEnabled: false,
  email: "",
  events: {
    streamCompleted: true,
    expiringSoon: true,
    withdrawalAvailable: true,
  },
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_NOTIFICATION_PREFS;
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...parsed,
      events: { ...DEFAULT_NOTIFICATION_PREFS.events, ...(parsed.events ?? {}) },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/** True when the browser supports the Notification API at all. */
export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Requests browser push permission. Resolves to the resulting permission state. */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}
