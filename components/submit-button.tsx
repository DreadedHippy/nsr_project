"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

const styles =
  "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition disabled:cursor-wait disabled:opacity-70";

export function SubmitButton({
  children,
  className,
  variant = "primary",
  pendingText,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={clsx(
        styles,
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:brightness-95",
        variant === "secondary" && "border-border bg-white text-foreground hover:bg-muted",
        variant === "danger" && "border-danger bg-danger text-white hover:brightness-95",
        className
      )}
      disabled={pending || props.disabled}
      type="submit"
      aria-busy={pending}
      {...props}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingText ?? children : children}
    </button>
  );
}
