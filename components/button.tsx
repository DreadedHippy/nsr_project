import { clsx } from "clsx";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";

const styles =
  "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={clsx(
        styles,
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:brightness-95",
        variant === "secondary" && "border-border bg-white text-foreground hover:bg-muted",
        variant === "danger" && "border-danger bg-danger text-white hover:brightness-95",
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: "primary" | "secondary" | "danger" }) {
  return (
    <Link
      className={clsx(
        styles,
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:brightness-95",
        variant === "secondary" && "border-border bg-white text-foreground hover:bg-muted",
        variant === "danger" && "border-danger bg-danger text-white hover:brightness-95",
        className
      )}
      {...props}
    />
  );
}
