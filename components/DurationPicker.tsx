"use client";

import { useState, useEffect } from "react";

interface DurationPickerProps {
  /** Called with the total duration in seconds whenever it changes. */
  onChange: (seconds: number) => void;
  /** Optional external error message to display (e.g. from parent form validation). */
  error?: string;
  /** Prefill the picker with an initial duration in seconds (used once on mount). */
  initialSeconds?: number;
}

/**
 * Days / hours / minutes input that converts to total seconds.
 * Supports fractional day values (e.g. 1.5 days = 129 600 seconds).
 * Shows an inline error when all fields are 0 (zero-duration guard).
 */
export default function DurationPicker({ onChange, error: externalError, initialSeconds }: DurationPickerProps) {
  const initDays = initialSeconds ? initialSeconds / 86400 : 0;
  const initHours = initialSeconds ? Math.floor((initialSeconds % 86400) / 3600) : 0;
  const initMinutes = initialSeconds ? Math.floor((initialSeconds % 3600) / 60) : 0;
  const [days, setDays] = useState(initDays);
  const [hours, setHours] = useState(initHours);
  const [minutes, setMinutes] = useState(initMinutes);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialSeconds && initialSeconds > 0) {
      onChange(initialSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(d: number, h: number, m: number) {
    const seconds = Math.round(d * 86_400 + h * 3_600 + m * 60);
    onChange(seconds);
  }

  const totalSeconds = Math.round(days * 86_400 + hours * 3_600 + minutes * 60);
  const inlineError =
    touched && totalSeconds === 0
      ? "Duration must be greater than 0."
      : null;

  // Surface either the parent-level error or the local inline error
  const displayError = externalError || inlineError;

  const isFractional = days !== Math.floor(days);

  return (
    <div>
      <div
        className="flex gap-2"
        role="group"
        aria-label="Stream duration"
      >
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-slate-300">Days</span>
          <input
            type="number"
            min={0}
            max={3650}
            step="0.1"
            value={days}
            onChange={(e) => {
              const v = Math.max(0, Math.min(3650, Number(e.target.value)));
              setDays(v);
              setTouched(true);
              update(v, hours, minutes);
            }}
            onBlur={() => setTouched(true)}
            className={`rounded-lg border bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
              displayError
                ? "border-red-500 focus-visible:ring-red-500"
                : "border-slate-600 focus-visible:ring-sky-500"
            }`}
            aria-label="Days"
            aria-invalid={!!displayError}
          />
        </label>
        {([
          { label: "Hours", value: hours, set: setHours, max: 23 },
          { label: "Minutes", value: minutes, set: setMinutes, max: 59 },
        ] as const).map(({ label, value, set, max }) => (
          <label key={label} className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-slate-300">{label}</span>
            <input
              type="number"
              min={0}
              max={max}
              value={value}
              onChange={(e) => {
                const v = Math.max(0, Math.min(max, Number(e.target.value)));
                set(v);
                setTouched(true);
                if (label === "Hours") update(days, v, minutes);
                else update(days, hours, v);
              }}
              onBlur={() => setTouched(true)}
              className={`rounded-lg border bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                displayError
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-slate-600 focus-visible:ring-sky-500"
              }`}
              aria-label={label}
              aria-invalid={!!displayError}
            />
          </label>
        ))}
      </div>
      {isFractional && totalSeconds > 0 && (
        <p className="text-xs text-slate-400 mt-1">
          {totalSeconds.toLocaleString()} seconds ({(totalSeconds / 3600).toFixed(1)} hours)
        </p>
      )}
      {displayError && (
        <p
          id="duration-error"
          className="text-red-400 text-sm mt-1"
          role="alert"
          aria-live="polite"
        >
          {displayError}
        </p>
      )}
    </div>
  );
}
