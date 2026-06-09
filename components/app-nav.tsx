import type { Profile } from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { NavLink } from "@/components/nav-link";

export function AppNav({ profile }: { profile: Profile }) {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
    { href: "/verify", label: "Verify", icon: "verify" as const },
    { href: "/feedback", label: "Feedback", icon: "feedback" as const },
    ...(profile.role === "admin"
      ? [
          { href: "/admin/users", label: "Users", icon: "users" as const },
          { href: "/admin/feedback", label: "Export", icon: "export" as const }
        ]
      : [])
  ];

  return (
    <aside className="sticky top-0 z-20 flex w-full flex-col border-b border-border bg-white px-4 py-3 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-8 lg:block">
        <div className="text-base font-semibold sm:text-lg">NSR Verification</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{profile.role}</div>
      </div>
      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:pb-0">
        {links.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>
      <div className="mt-3 border-t border-border pt-3 lg:mt-auto lg:pt-4">
        <div className="mb-3 hidden text-sm lg:block">
          <div className="font-medium">{profile.full_name}</div>
          <div className="break-all text-muted-foreground">{profile.email}</div>
        </div>
        <form action={signOutAction}>
          <SubmitButton variant="secondary" className="w-full sm:w-auto lg:w-full" pendingText="Signing out">
            Sign out
          </SubmitButton>
        </form>
      </div>
    </aside>
  );
}
