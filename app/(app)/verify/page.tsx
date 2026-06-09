import { redirect } from "next/navigation";
import { Field, Input } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { requireProfile } from "@/lib/auth";
import { startVerificationAction, getPendingVerification } from "@/lib/actions/verification";

export default async function VerifyPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; warning?: string }>;
}) {
  const profile = await requireProfile("agent");
  const pending = await getPendingVerification(profile.id);
  if (pending) {
    redirect(`/verify/${pending.id}/feedback`);
  }

  const params = await searchParams;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Start verification</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter an 11-digit National Identification Number.</p>
      {params.error ? <div className="mt-5 rounded-md bg-rose-50 p-3 text-sm text-danger">{params.error}</div> : null}
      {params.warning ? (
        <div className="mt-5 rounded-md bg-amber-50 p-3 text-sm text-warning">NIMC service unavailable: {params.warning}</div>
      ) : null}
      <form action={startVerificationAction} className="mt-6 rounded-lg border border-border bg-white p-5 shadow-sm">
        <Field label="National Identification Number">
          <Input name="nin" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} required />
        </Field>
        <SubmitButton className="mt-5" pendingText="Verifying">
          Verify NIN
        </SubmitButton>
      </form>
    </div>
  );
}
