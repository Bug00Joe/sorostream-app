"use client";

interface SchedulingToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
}

/**
 * A toggle + datetime-local picker for scheduling a stream start time.
 * When disabled the stream starts immediately.
 * When enabled the user must pick a future date/time.
 */
export default function SchedulingToggle({
  enabled,
  onToggle,
  value,
  onChange,
  onBlur,
  error,
}: SchedulingToggleProps) {
  /** Minimum selectable datetime — 1 minute from now in datetime-local format. */
  const minDateTime = (() => {
    const d = new Date(Date.now() + 60_000);
    // datetime-local requires "YYYY-MM-DDTHH:MM" format
    return d.toISOString().slice(0, 16);
  })();

  return (
    <div className="space-y-3">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <span className="text-gray-200 text-sm font-medium">Start Time</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
            enabled ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          <span className="sr-only">{enabled ? "Scheduled start" : "Start immediately"}</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Label beneath the toggle */}
      <p className="text-xs text-gray-400">
        {enabled ? "Stream will start at the selected date and time." : "Stream starts immediately after signing."}
      </p>

      {/* Date-time picker — only shown when scheduling is enabled */}
      {enabled && (
        <div>
          <label htmlFor="scheduled-start-time" className="sr-only">
            Scheduled start date and time
          </label>
          <input
            id="scheduled-start-time"
            type="datetime-local"
            value={value}
            min={minDateTime}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 aria-[invalid=true]:border-red-500"
            aria-invalid={!!error}
            aria-describedby={error ? "scheduled-start-error" : undefined}
            aria-required={enabled}
          />
          {error && (
            <p
              id="scheduled-start-error"
              role="alert"
              className="text-red-400 text-sm mt-1"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
