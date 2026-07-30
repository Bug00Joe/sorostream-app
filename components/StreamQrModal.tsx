"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/src/lib/useFocusTrap";
import QRCode from "qrcode";

interface StreamQrModalProps {
  open: boolean;
  onClose: () => void;
  recipient: string;
  amount: string;
  token: string;
  duration: number;
}

export default function StreamQrModal({
  open,
  onClose,
  recipient,
  amount,
  token,
  duration,
}: StreamQrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const params = new URLSearchParams({
      recipient,
      amount,
      token,
      duration: String(Math.round(duration)),
    });
    const url = `${window.location.origin}/stream/new?${params.toString()}`;

    QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: { dark: "#ffffff", light: "#1f2937" },
    });
  }, [open, recipient, amount, token, duration]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `stream-qr-${recipient.slice(0, 8)}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4 border border-gray-200 dark:border-gray-700">
        <h2 id="qr-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white text-center">
          Stream Payment QR
        </h2>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-lg"
            width={280}
            height={280}
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-xs text-center">
          Scan to open a pre-filled create-stream form
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDownload}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900"
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
