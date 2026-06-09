import { setupAccountAction } from "@/lib/actions/auth";
import { Field, Input } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export default async function SetupAccountPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold">Set password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Complete your invited account.</p>
        {params.error ? <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-danger">{params.error}</div> : null}
        <form action={setupAccountAction} className="mt-6 grid gap-4">
          <input name="token" type="hidden" value={params.token ?? ""} />
          <Field label="Password">
            <Input name="password" type="password" minLength={8} autoComplete="new-password" required />
          </Field>
          <SubmitButton pendingText="Activating">Activate account</SubmitButton>
        </form>
      </div>
    </main>
  );
}
