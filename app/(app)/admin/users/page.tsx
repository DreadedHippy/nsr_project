import { format } from "date-fns";
import { Button } from "@/components/button";
import { Field, Input } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { deactivateUserAction, inviteUserAction, resendInvitationAction } from "@/lib/actions/admin";
import { requireProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string; inviteLink?: string }>;
}) {
  await requireProfile("admin");
  const params = await searchParams;
  const admin = createSupabaseAdminClient();
  const { data: users } = await admin.from("profiles").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invite, resend setup links, and deactivate accounts.</p>
      </div>
      {params.message ? <div className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-success">{params.message}</div> : null}
      {params.error ? <div className="mb-5 rounded-md bg-rose-50 p-3 text-sm text-danger">{params.error}</div> : null}
      {params.inviteLink ? (
        <div className="mb-5 rounded-md border border-border bg-white p-4 text-sm shadow-sm">
          <div className="font-medium">Account setup link</div>
          <div className="mt-2 break-all rounded-md bg-muted p-3 font-mono text-xs">{params.inviteLink}</div>
        </div>
      ) : null}

      <form action={inviteUserAction} className="mb-6 grid gap-4 rounded-lg border border-border bg-white p-5 shadow-sm md:grid-cols-4">
        <Field label="Full name">
          <Input name="full_name" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
        <label className="grid gap-2 text-sm font-medium">
          Role
          <select name="role" className="focus-ring h-11 rounded-md border border-border bg-white px-3 text-sm">
            <option value="agent">Agent</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Invite user
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{user.full_name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={user.status} />
                </td>
                <td className="px-4 py-3">{format(new Date(user.created_at), "yyyy-MM-dd")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {user.status === "invited" ? (
                      <form action={resendInvitationAction}>
                        <input type="hidden" name="email" value={user.email} />
                        <input type="hidden" name="full_name" value={user.full_name} />
                        <input type="hidden" name="role" value={user.role} />
                        <Button variant="secondary" type="submit">
                          Resend
                        </Button>
                      </form>
                    ) : null}
                    {user.status !== "deactivated" ? (
                      <form action={deactivateUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <Button variant="danger" type="submit">
                          Deactivate
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
