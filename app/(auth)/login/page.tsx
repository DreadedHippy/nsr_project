import { signInAction } from "@/lib/actions/auth";
import { Field, Input } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export default function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Access the NSR verification workspace.</p>
        <AsyncNotice searchParams={searchParams} />
        <form action={signInAction} className="mt-6 grid gap-4">
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <SubmitButton pendingText="Signing in">Sign in</SubmitButton>
        </form>
      </div>
    </main>
  );
}

async function AsyncNotice({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  if (params.error) {
    return <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-danger">{params.error}</div>;
  }
  if (params.message) {
    return <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-success">{params.message}</div>;
  }
  return null;
}
