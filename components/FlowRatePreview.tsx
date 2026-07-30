"use client";

import FiatDisplay from "@/components/FiatDisplay";

interface FlowRatePreviewProps {
  amount: string;
  durationSeconds: number;
}

export default function FlowRatePreview({ amount, durationSeconds }: FlowRatePreviewProps) {
  if (!amount || !durationSeconds || durationSeconds === 0) return null;

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) return null;

  const perSecond = amountNum / durationSeconds;
  const perHour = perSecond * 3600;
  const perDay = perSecond * 86400;
  const perMonth = perSecond * 2592000;

  const fmt = (val: number) => val.toFixed(7);

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-2">
      <p className="text-gray-400 font-medium">Flow Rate Preview</p>
      <div className="grid grid-cols-2 gap-2">
        <span className="text-gray-400">Per second</span>
        <span className="text-green-400">{fmt(perSecond)} USDC <FiatDisplay usdcAmount={perSecond} /></span>
        <span className="text-gray-400">Per hour</span>
        <span className="text-green-400">{fmt(perHour)} USDC <FiatDisplay usdcAmount={perHour} /></span>
        <span className="text-gray-400">Per day</span>
        <span className="text-green-400">{fmt(perDay)} USDC <FiatDisplay usdcAmount={perDay} /></span>
        <span className="text-gray-400">Per month</span>
        <span className="text-green-400">{fmt(perMonth)} USDC <FiatDisplay usdcAmount={perMonth} /></span>
      </div>
    </div>
  );
}
