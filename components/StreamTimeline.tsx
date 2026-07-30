import { useSettings } from "@/src/context/SettingsContext";
import { useTranslations } from "@/src/lib/i18n";
import { formatDateShortWithTimezone } from "@/src/lib/timezone";
import { truncateAddress } from "@/src/lib/sorostream";

interface StreamTimelineProps {
  startTime?: Date | string;
  endTime?: Date | string;
  sender?: string;
  recipient?: string;
  status?: "Active" | "Paused" | "Cancelled" | "Completed" | string;
  flowRate?: number;
}

export default function StreamTimeline({
  startTime = new Date(),
  endTime = new Date(),
  sender,
  recipient,
  status = "Active",
  flowRate = 1,
}: StreamTimelineProps) {
  const t = useTranslations("stream_detail");
  const { language } = useSettings();
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const fmt = (d: Date | string) => formatDateShortWithTimezone(d, language);

  const isPaused = status === "Paused";
  const isInactive = status === "Cancelled" || status === "Completed" || now >= end;
  
  // Calculate animation speed inverse to flowRate (higher rate = faster pulse/stream)
  const animSpeedSeconds = Math.max(1, Math.min(4, 5 / Math.max(0.1, flowRate)));

  return (
    <div className="space-y-4">
      {/* Sender to Recipient Animated Flow Header */}
      <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Sender: {sender ? truncateAddress(sender) : "Sender"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Recipient: {recipient ? truncateAddress(recipient) : "Recipient"}</span>
          </div>
        </div>

        {/* Animated Flow Progression Bar */}
        <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
          {/* Base progress */}
          <div
            className={`h-full transition-all ${
              status === "Cancelled" ? "bg-red-600/50" : isPaused ? "bg-amber-500/50" : "bg-green-500/40"
            }`}
            style={{ width: `${progress}%` }}
          />

          {/* Animated Fund Flow Streamer */}
          {!isInactive && (
            <div
              className={`absolute top-0 bottom-0 left-0 right-0 pointer-events-none ${
                isPaused ? "opacity-50" : "opacity-100"
              }`}
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.8) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "streamFlow 2s linear infinite",
                animationDuration: `${animSpeedSeconds}s`,
                animationPlayState: isPaused ? "paused" : "running",
                willChange: "transform",
              }}
            />
          )}
        </div>

        <div className="flex justify-between items-center text-[11px] text-gray-400">
          <span>Flow Rate: {flowRate.toFixed(4)} / sec</span>
          <span className="font-semibold text-gray-300">
            {isPaused ? "⏸ Flow Paused" : isInactive ? "⏹ Stream Ended" : "▶ Streaming Funds"}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span title={`UTC: ${new Date(startTime).toUTCString()}`}>{fmt(startTime)}</span>
          <span>{t("now")}</span>
          <span title={`UTC: ${new Date(endTime).toUTCString()}`}>{fmt(endTime)}</span>
        </div>
        <div
          className="w-full bg-gray-700 rounded-full h-2"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Stream progress: ${Math.round(progress)}%`}
        >
          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes streamFlow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
