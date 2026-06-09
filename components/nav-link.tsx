"use client";

import { Loader2 } from "lucide-react";
import { ClipboardCheck, FileDown, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { clsx } from "clsx";

const icons = {
  dashboard: LayoutDashboard,
  verify: ShieldCheck,
  feedback: ClipboardCheck,
  users: Users,
  export: FileDown
};

export function NavLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: keyof typeof icons;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = icons[icon];

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => startTransition(() => router.push(href))}
      className={clsx(
        "focus-ring flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-70 lg:w-full lg:gap-3"
      )}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <span>{isPending ? "Loading" : label}</span>
    </button>
  );
}
