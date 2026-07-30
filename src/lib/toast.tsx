"use client";
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

/** Optional inline action button rendered inside the toast. */
interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  /** When set, the toast persists until explicitly dismissed (no auto-remove). */
  persistent?: boolean;
  /** Optional action button rendered alongside the message. */
  action?: ToastAction;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  /**
   * Create or update a persistent toast identified by `key`.
   * Returns the numeric id of the created/updated toast.
   * Call removeToast(id) to dismiss it.
   *
   * Pass `action` to render an inline button (e.g. an Undo control).
   * The action is preserved across message updates unless explicitly replaced.
   */
  upsertPersistentToast: (
    key: string,
    message: string,
    type?: ToastType,
    action?: ToastAction,
  ) => number;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  /** Maps a string key → numeric toast id for persistent toasts. */
  const persistentMap = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    // Clean up the persistent map entry if present
    persistentMap.current.forEach((storedId, key) => {
      if (storedId === id) {
        persistentMap.current.delete(key);
      }
    });
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  const upsertPersistentToast = useCallback(
    (
      key: string,
      message: string,
      type: ToastType = "info",
      action?: ToastAction,
    ): number => {
      const existingId = persistentMap.current.get(key);

      if (existingId !== undefined) {
        // Update the message (and optionally the action) in-place without flicker.
        setToasts((prev) =>
          prev.map((t) =>
            t.id === existingId
              ? { ...t, message, type, ...(action !== undefined ? { action } : {}) }
              : t,
          ),
        );
        return existingId;
      }

      // Create a new persistent toast.
      const id = Date.now() + Math.random();
      persistentMap.current.set(key, id);
      setToasts((prev) => [
        ...prev,
        { id, message, type, persistent: true, action },
      ]);
      return id;
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ addToast, upsertPersistentToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm animate-slide-up ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                  ? "bg-red-600"
                  : toast.type === "warning"
                    ? "bg-amber-600"
                    : "bg-gray-700"
            }`}
            role="alert"
          >
            <div className="flex justify-between items-center gap-2">
              <span className="flex items-center gap-2">
                {toast.message}
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="underline font-semibold hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-white/50 rounded"
                  >
                    {toast.action.label}
                  </button>
                )}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white ml-2 text-lg leading-none flex-shrink-0"
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
