import { ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { requireAnyProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getPendingVerification } from "@/lib/actions/verification";

export default async function DashboardPage() {
  const profile = await requireAnyProfile();
  const admin = createSupabaseAdminClient();
  const pending = profile.role === "agent" ? await getPendingVerification(profile.id) : null;
  const feedbackCount = await admin
    .from("feedback_records")
    .select("id", { count: "exact", head: true })
    .match(profile.role === "agent" ? { agent_id: profile.id } : {});
  const usersCount =
    profile.role === "admin"
      ? await admin.from("profiles").select("id", { count: "exact", head: true })
      : { count: null };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Operational overview for identity verification work.</p>
        </div>
        {profile.role === "agent" ? (
          <ButtonLink href={pending ? `/verify/${pending.id}/feedback` : "/verify"}>
            {pending ? "Complete feedback" : "Start verification"}
          </ButtonLink>
        ) : (
          <ButtonLink href="/admin/users">Manage users</ButtonLink>
        )}
      </div>

      {pending ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-warning">
          Feedback is required for {pending.nin_masked} before another verification can begin.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric icon={ClipboardCheck} label="Feedback records" value={feedbackCount.count ?? 0} />
        <Metric icon={ShieldCheck} label="Current role" value={profile.role} />
        <Metric icon={Users} label="System users" value={profile.role === "admin" ? usersCount.count ?? 0 : "Restricted"} />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-4 text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold capitalize">{value}</div>
    </div>
  );
}
