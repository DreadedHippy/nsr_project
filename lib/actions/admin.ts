"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { appUrl } from "@/lib/env";
import { requireProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function inviteUserAction(formData: FormData) {
  const adminProfile = await requireProfile("admin");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "agent") === "admin" ? "admin" : "agent";

  if (!fullName || !email.includes("@")) {
    redirect("/admin/users?error=Enter a valid full name and email");
  }

  const admin = createSupabaseAdminClient();
  const existingProfile = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existingProfile.data) {
    redirect("/admin/users?error=An account already exists for that email");
  }

  const password = crypto.randomBytes(32).toString("base64url");
  const { data: userResult, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError || !userResult.user) {
    redirect(`/admin/users?error=${encodeURIComponent(createError?.message ?? "Could not create user")}`);
  }

  await admin.from("profiles").insert({
    id: userResult.user.id,
    email,
    full_name: fullName,
    role,
    status: "invited",
    created_by: adminProfile.id
  });

  const setupLink = await createInvitation(adminProfile.id, email, fullName, role);
  redirect(`/admin/users?message=Invitation created&inviteLink=${encodeURIComponent(setupLink)}`);
}

export async function resendInvitationAction(formData: FormData) {
  const adminProfile = await requireProfile("admin");
  const email = String(formData.get("email") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const role = String(formData.get("role") ?? "agent") === "admin" ? "admin" : "agent";
  const setupLink = await createInvitation(adminProfile.id, email, fullName, role);
  redirect(`/admin/users?message=Invitation refreshed&inviteLink=${encodeURIComponent(setupLink)}`);
}

export async function deactivateUserAction(formData: FormData) {
  await requireProfile("admin");
  const id = String(formData.get("id") ?? "");
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ status: "deactivated" }).eq("id", id);
  await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  redirect("/admin/users?message=Account deactivated");
}

async function createInvitation(createdBy: string, email: string, fullName: string, role: string) {
  const admin = createSupabaseAdminClient();
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await admin.from("agent_invitations").insert({
    email,
    full_name: fullName,
    role,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    created_by: createdBy
  });

  const setupLink = `${appUrl}/setup-account?token=${token}`;
  console.info(`NSR setup link for ${email}: ${setupLink}`);
  return setupLink;
}
