import { ButtonLink } from "@/components/button";

export default function UnauthorizedPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="mt-2 text-muted-foreground">Your account does not have access to this area.</p>
      <ButtonLink href="/dashboard" className="mt-6" variant="secondary">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
