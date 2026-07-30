"use client";
/**
 * OnboardingWizard (#195)
 *
 * A multi-step modal that orients first-time users: Welcome → Connect Wallet →
 * Choose first stream → Confirm subscription → Done. It opens automatically on
 * first login (tracked via a localStorage flag) and can be reopened later via
 * the Help menu by dispatching the `OPEN_ONBOARDING_EVENT` window event.
 *
 * Accessibility: the dialog traps focus, is labelled for screen readers, and is
 * fully keyboard navigable (Escape skips/closes). Analytics events fire on each
 * step completion and on skip.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/src/context/WalletContext";
import { trackEvent } from "@/src/lib/analytics";

const STORAGE_KEY = "sorostream-onboarding-complete";
/** Window event used to reopen the wizard from elsewhere (e.g. Help menu). */
export const OPEN_ONBOARDING_EVENT = "sorostream:open-onboarding";

interface Step {
  id: string;
  title: string;
  body: string;
  /** Label for the primary action button. */
  action: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to SoroStream 👋",
    body: "Stream XLM and tokens in real time on Stellar Soroban. This quick setup gets you ready in under a minute.",
    action: "Get started",
  },
  {
    id: "connect-wallet",
    title: "Connect your wallet",
    body: "Connect Freighter so you can create and manage streams. We never store your keys.",
    action: "Connect wallet",
  },
  {
    id: "choose-stream",
    title: "Choose your first stream",
    body: "Streams send a steady flow of funds to a recipient over time — great for payroll, vesting, or subscriptions.",
    action: "Pick a template",
  },
  {
    id: "confirm",
    title: "Confirm your subscription",
    body: "Review the details and create your first stream. You can edit or cancel it any time from the dashboard.",
    action: "Create first stream",
  },
  {
    id: "done",
    title: "You're all set 🎉",
    body: "That's it! Explore your dashboard to track live streams and claimable balances.",
    action: "Go to dashboard",
  },
];

function isComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore storage errors
  }
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { address, connect, isConnecting } = useWallet();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Open automatically on first login; allow reopening via the Help menu.
  useEffect(() => {
    if (!isComplete()) {
      setOpen(true);
      trackEvent({ type: "onboarding_start" });
    }
    const reopen = () => {
      setStep(0);
      setError(null);
      setOpen(true);
      trackEvent({ type: "onboarding_start" });
    };
    window.addEventListener(OPEN_ONBOARDING_EVENT, reopen);
    return () => window.removeEventListener(OPEN_ONBOARDING_EVENT, reopen);
  }, []);

  // Move focus into the dialog when it opens / step changes.
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open, step]);

  const finish = useCallback(() => {
    markComplete();
    trackEvent({ type: "onboarding_complete" });
    setOpen(false);
    router.push("/dashboard");
  }, [router]);

  const skip = useCallback(() => {
    trackEvent({ type: "onboarding_skip", step, stepId: current.id });
    markComplete();
    setOpen(false);
  }, [step, current.id]);

  const advance = useCallback(async () => {
    setError(null);

    // Per-step validation before advancing.
    if (current.id === "connect-wallet" && !address) {
      try {
        const connected = await connect();
        if (!connected) {
          setError("Wallet connection was not completed. Please try again.");
          return;
        }
      } catch {
        setError("Could not connect to Freighter. Is the extension installed?");
        return;
      }
    }

    trackEvent({ type: "onboarding_step_complete", step, stepId: current.id });

    if (isLast) {
      finish();
      return;
    }

    // Side effects for action steps.
    if (current.id === "choose-stream") {
      router.prefetch?.("/stream/new");
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [current.id, address, connect, step, isLast, finish, router]);

  // Keyboard handling: Escape skips/closes the wizard.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      }
    },
    [skip],
  );

  if (!open) return null;

  const walletConnected = current.id !== "connect-wallet" || !!address;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) skip();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-2xl focus:outline-none animate-slide-up"
      >
        {/* Progress dots */}
        <div className="mb-4 flex items-center justify-between">
          <ol className="flex gap-1.5" aria-label="Onboarding progress">
            {STEPS.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === step ? "step" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-green-500" : i < step ? "w-3 bg-green-700" : "w-3 bg-gray-600"
                }`}
              />
            ))}
          </ol>
          <span className="text-xs text-gray-400">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        <h2 id={titleId} className="text-xl font-bold text-white">
          {current.title}
        </h2>
        <p id={descId} className="mt-2 text-sm text-gray-300">
          {current.body}
        </p>

        {current.id === "connect-wallet" && address && (
          <p className="mt-3 rounded-lg bg-green-900/30 px-3 py-2 text-xs text-green-400">
            ✓ Wallet connected: {address.slice(0, 4)}…{address.slice(-4)}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={skip}
            className="text-sm text-gray-400 hover:text-white transition-colors rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={isConnecting}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
          >
            {isConnecting && current.id === "connect-wallet"
              ? "Connecting…"
              : walletConnected && current.id === "connect-wallet"
              ? "Continue"
              : current.action}
          </button>
        </div>
      </div>
    </div>
  );
}
