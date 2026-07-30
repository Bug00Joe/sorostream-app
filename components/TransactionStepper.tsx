"use client";

import React from "react";

/** Ordered stages of the create-stream transaction lifecycle. */
export enum TxStage {
  Building = "Building",
  Signing = "Signing",
  Submitting = "Submitting",
  Confirming = "Confirming",
  Done = "Done",
}

/** Display metadata for each stage. */
const STAGE_META: Record<TxStage, { label: string; description: string }> = {
  [TxStage.Building]: {
    label: "Building",
    description: "Constructing the transaction envelope",
  },
  [TxStage.Signing]: {
    label: "Signing",
    description: "Waiting for wallet signature",
  },
  [TxStage.Submitting]: {
    label: "Submitting",
    description: "Broadcasting to the Soroban network",
  },
  [TxStage.Confirming]: {
    label: "Confirming",
    description: "Waiting for on-chain confirmation",
  },
  [TxStage.Done]: {
    label: "Done",
    description: "Stream created successfully",
  },
};

const STAGE_ORDER: TxStage[] = [
  TxStage.Building,
  TxStage.Signing,
  TxStage.Submitting,
  TxStage.Confirming,
  TxStage.Done,
];

interface TransactionStepperProps {
  /** The current active stage. */
  currentStage: TxStage;
  /** If set, the step that failed — shown in red with the error message below. */
  failedStage?: TxStage;
  /** Optional error message to display under the failed stage. */
  errorMessage?: string;
}

/**
 * Multi-step progress indicator for the create-stream transaction flow.
 *
 * Shows Building → Signing → Submitting → Confirming → Done with the
 * active stage highlighted in green, completed stages shown as ticks,
 * and the failed stage highlighted in red when provided.
 */
export default function TransactionStepper({
  currentStage,
  failedStage,
  errorMessage,
}: TransactionStepperProps) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const hasFailed = failedStage !== undefined;

  return (
    <div
      aria-label="Transaction progress"
      aria-live="polite"
      aria-atomic="true"
      className="w-full"
    >
      <ol className="flex items-start justify-between gap-1 sm:gap-2">
        {STAGE_ORDER.map((stage, idx) => {
          const isFailed = stage === failedStage;
          const isActive = stage === currentStage && !hasFailed;
          const isCompleted = idx < currentIdx && !hasFailed;
          const meta = STAGE_META[stage];

          const circleClass = isFailed
            ? "bg-red-600 text-white border-red-600"
            : isCompleted
            ? "bg-green-700 text-white border-green-700"
            : isActive
            ? "bg-green-600 text-white border-green-600 ring-2 ring-green-500/50"
            : "bg-gray-700 text-gray-400 border-gray-600";

          const labelClass = isFailed
            ? "text-red-400"
            : isActive || isCompleted
            ? "text-white"
            : "text-gray-400";

          const connectorClass =
            idx < currentIdx && !hasFailed ? "bg-green-700" : "bg-gray-700";

          return (
            <React.Fragment key={stage}>
              <li className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                {/* Circle / icon */}
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold shrink-0 transition-colors ${circleClass}`}
                >
                  {isFailed ? (
                    <span aria-hidden="true">✕</span>
                  ) : isCompleted ? (
                    <span aria-hidden="true">✓</span>
                  ) : isActive && stage !== TxStage.Done ? (
                    /* Pulsing dot for the in-progress step */
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"
                    />
                  ) : (
                    <span aria-hidden="true">{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium text-center leading-tight hidden sm:block ${labelClass}`}
                >
                  {meta.label}
                </span>
              </li>

              {/* Connector line between steps */}
              {idx < STAGE_ORDER.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`h-px flex-1 mt-4 shrink-0 transition-colors ${connectorClass}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>

      {/* Current stage description */}
      {!hasFailed && (
        <p className="text-center text-xs text-gray-400 mt-3">
          {STAGE_META[currentStage].description}
          {currentStage !== TxStage.Done && (
            <span className="ml-1 animate-pulse">…</span>
          )}
        </p>
      )}

      {/* Error state */}
      {hasFailed && (
        <div className="mt-3 text-center space-y-1">
          <p className="text-sm font-medium text-red-400">
            Failed at: {STAGE_META[failedStage!].label}
          </p>
          {errorMessage && (
            <p className="text-xs text-red-300/70 break-words">{errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
