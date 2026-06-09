"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setupAccountAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    redirect(`/setup-account?token=${encodeURIComponent(token)}&error=Password must be at least 8 characters`);
  }

  const tokenHash = await sha256(token);
  const admin = createSupabaseAdminClient();
  const { data: invitation } = await admin
    .from("agent_invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    redirect("/login?error=Invitation is invalid or expired");
  }

  const { data: users } = await admin.auth.admin.listUsers();
  const user = users.users.find((item) => item.email?.toLowerCase() === invitation.email.toLowerCase());

  if (!user) {
    redirect("/login?error=Account was not provisioned");
  }

  await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: invitation.full_name }
  });

  await admin.from("profiles").update({ status: "active" }).eq("id", user.id);
  await admin.from("agent_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invitation.id);

  redirect("/login?message=Account setup complete");
}

async function sha256(value: string) {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(value).digest("hex");
}
