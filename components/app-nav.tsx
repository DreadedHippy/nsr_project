import Link from "next/link";
import { ClipboardCheck, FileDown, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import type { Profile } from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export function AppNav({ profile }: { profile: Profile }) {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/verify", label: "Verify", icon: ShieldCheck },
    { href: "/feedback", label: "Feedback", icon: ClipboardCheck },
    ...(profile.role === "admin"
      ? [
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/feedback", label: "Export", icon: FileDown }
        ]
      : [])
  ];

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-border bg-white px-4 py-5">
      <div className="mb-8">
        <div className="text-lg font-semibold">NSR Verification</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{profile.role}</div>
      </div>
      <nav className="grid gap-1">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="focus-ring flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-3 text-sm">
          <div className="font-medium">{profile.full_name}</div>
          <div className="text-muted-foreground">{profile.email}</div>
        </div>
        <form action={signOutAction}>
          <SubmitButton variant="secondary" className="w-full" pendingText="Signing out">
            Sign out
          </SubmitButton>
        </form>
      </div>
    </aside>
  );
}
