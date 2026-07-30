import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const paddingClasses = { sm: "p-4", md: "p-6", lg: "p-8" };

export default function Card({ padding = "md", className = "", children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`bg-gray-800 rounded-xl ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
