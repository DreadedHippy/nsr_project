"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { clsx } from "clsx";

const styles =
  "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition disabled:cursor-wait disabled:opacity-70";

export function LoadingLinkButton({
  href,
  children,
  className,
  pendingText,
  variant = "primary"
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-busy={isPending}
      disabled={isPending}
      className={clsx(
        styles,
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:brightness-95",
        variant === "secondary" && "border-border bg-white text-foreground hover:bg-muted",
        className
      )}
      onClick={() => startTransition(() => router.push(href))}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {isPending ? pendingText ?? children : children}
    </button>
  );
}
