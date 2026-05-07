import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const baseClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

const variantClassNames = {
  primary: "bg-surface-ink text-white shadow-lg shadow-orange-950/15 hover:bg-[#2a2520]",
  secondary: "border border-card-border-strong bg-white/70 text-foreground hover:bg-white",
  ghost: "text-foreground hover:bg-white/60",
  danger: "bg-danger text-white hover:bg-[#9a3412]",
} as const;

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button className={cn(baseClassName, variantClassNames[variant], className)} {...props}>
      {children}
    </button>
  );
}
