import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Field, Input, Textarea } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { requireProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { submitFeedbackAction } from "@/lib/actions/verification";

export default async function FeedbackForVerificationPage({
  params,
  searchParams
}: {
  params: Promise<{ verificationId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireProfile("agent");
  const { verificationId } = await params;
  const query = await searchParams;
  const admin = createSupabaseAdminClient();
  const { data: verification } = await admin
    .from("verification_records")
    .select("*")
    .eq("id", verificationId)
    .eq("agent_id", profile.id)
    .single();

  if (!verification) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Submit feedback</h1>
      <p className="mt-1 text-sm text-muted-foreground">This feedback must be completed before the next verification.</p>
      <div className="mt-6 rounded-lg border border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 border-b border-border pb-5 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">NIN</div>
            <div className="mt-1 font-medium">{verification.nin_masked}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Outcome</div>
            <div className="mt-1">
              <StatusBadge value={verification.outcome} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Reason</div>
            <div className="mt-1 font-medium">{verification.reason_code ?? "Matched"}</div>
          </div>
        </div>

        {verification.nimc_identity ? (
          <div className="mt-5 rounded-md bg-emerald-50 p-4 text-sm text-success">
            {verification.nimc_identity.fullName} · {verification.nimc_identity.dateOfBirth} · {verification.nimc_identity.gender}
          </div>
        ) : null}

        {query.error ? <div className="mt-5 rounded-md bg-rose-50 p-3 text-sm text-danger">{query.error}</div> : null}

        <form action={submitFeedbackAction} className="mt-5 grid gap-4">
          <input type="hidden" name="verification_id" value={verification.id} />
          <Field label="Social Register ID">
            <Input name="social_register_id" required />
          </Field>
          <Field label="Feedback comment">
            <Textarea name="comment" minLength={10} maxLength={1000} required />
          </Field>
          <SubmitButton className="w-full sm:w-auto" pendingText="Submitting">Submit feedback</SubmitButton>
        </form>
      </div>
    </div>
  );
}
