import { AppNav } from "@/components/app-nav";
import { requireAnyProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAnyProfile();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AppNav profile={profile} />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
    </div>
  );
}
