"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const VARIANT_CLS: Record<Variant, string> = {
  primary:
    "bg-[#3c3489] text-white border border-[#3c3489] hover:bg-[#2e2770] hover:border-[#2e2770]",
  secondary:
    "bg-white text-[#3c3489] border border-[#3c3489] hover:bg-[#f0effe]",
  destructive:
    "bg-white text-[#a32d2d] border border-[#a32d2d] hover:bg-red-50",
  ghost:
    "bg-transparent text-[#5c5c5c] border border-transparent hover:bg-[#fafaf9] hover:text-[#1a1a1a]",
};

const SIZE_CLS: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

export const AdminButton = forwardRef<HTMLButtonElement, Props>(function AdminButton(
  { variant = "primary", size = "md", className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#3c3489]/40 ${SIZE_CLS[size]} ${VARIANT_CLS[variant]} ${className ?? ""}`}
      {...rest}
    />
  );
});
