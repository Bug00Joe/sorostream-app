import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 focus-visible:ring-green-500",
  danger:
    "border border-red-600 text-red-400 hover:bg-red-900 focus-visible:ring-red-500",
  outline:
    "border border-slate-300 text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400",
  ghost:
    "text-gray-400 hover:text-white focus-visible:ring-gray-400",
};

export default function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${variantClasses[variant]} ${fullWidth ? "w-full py-3" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
