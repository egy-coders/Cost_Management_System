import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-site text-white hover:bg-red-900",
  secondary: "bg-white text-ink border border-gray-300 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100"
};

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
