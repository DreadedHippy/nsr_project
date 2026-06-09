"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { verifyNinWithNimc } from "@/lib/nimc";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { encryptJson, encryptText, hashNin, maskNin } from "@/lib/security";

const ninSchema = z.string().regex(/^\d{11}$/, "NIN must be 11 numeric digits");

export async function startVerificationAction(formData: FormData) {
  const profile = await requireProfile("agent");
  const admin = createSupabaseAdminClient();

  const pending = await getPendingVerification(profile.id);
  if (pending) {
    redirect(`/verify/${pending.id}/feedback`);
  }

  const ninResult = ninSchema.safeParse(String(formData.get("nin") ?? ""));
  if (!ninResult.success) {
    redirect("/verify?error=NIN must be 11 numeric digits");
  }

  const nin = ninResult.data;
  const result = await verifyNinWithNimc(nin);

  if (result.status === "service_unavailable") {
    redirect(`/verify?warning=${encodeURIComponent(result.reasonCode)}`);
  }

  const payload: Record<string, unknown> =
    result.status === "verified"
      ? {
          agent_id: profile.id,
          nin_encrypted: encryptText(nin),
          nin_hash: hashNin(nin),
          nin_masked: maskNin(nin),
          outcome: "verified",
          nimc_payload_encrypted: encryptJson(result.rawPayload),
          nimc_identity: result.identity
        }
      : {
          agent_id: profile.id,
          nin_encrypted: encryptText(nin),
          nin_hash: hashNin(nin),
          nin_masked: maskNin(nin),
          outcome: "not_verified",
          reason_code: result.reasonCode,
          nimc_payload_encrypted: encryptJson(result.rawPayload),
          nimc_identity: null
        };

  const { data, error } = await admin.from("verification_records").insert(payload).select("id").single();
  if (error || !data) {
    redirect(`/verify?error=${encodeURIComponent(error?.message ?? "Could not save verification")}`);
  }

  redirect(`/verify/${data.id}/feedback`);
}

export async function submitFeedbackAction(formData: FormData) {
  const profile = await requireProfile("agent");
  const verificationId = String(formData.get("verification_id") ?? "");
  const socialRegisterId = String(formData.get("social_register_id") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  if (comment.length < 10 || comment.length > 1000) {
    redirect(`/verify/${verificationId}/feedback?error=Comment must be 10 to 1000 characters`);
  }

  const admin = createSupabaseAdminClient();
  const { data: verification } = await admin
    .from("verification_records")
    .select("*")
    .eq("id", verificationId)
    .eq("agent_id", profile.id)
    .single();

  if (!verification) {
    redirect("/verify?error=Verification record was not found");
  }

  const existing = await admin.from("feedback_records").select("id").eq("verification_id", verificationId).maybeSingle();
  if (existing.data) {
    redirect("/feedback?error=Feedback already exists for that verification");
  }

  const { data: nsrRecord } = await admin
    .from("nsr_records")
    .select("social_register_id,nin_hash")
    .eq("social_register_id", socialRegisterId)
    .single();

  if (!nsrRecord) {
    redirect(`/verify/${verificationId}/feedback?error=Social Register ID was not found`);
  }

  if (nsrRecord.nin_hash !== verification.nin_hash) {
    redirect(`/verify/${verificationId}/feedback?error=Social Register ID does not match this NIN`);
  }

  const { error } = await admin.from("feedback_records").insert({
    verification_id: verification.id,
    agent_id: profile.id,
    social_register_id: socialRegisterId,
    nin_encrypted: verification.nin_encrypted,
    nin_hash: verification.nin_hash,
    nin_masked: verification.nin_masked,
    outcome: verification.outcome,
    comment
  });

  if (error) {
    redirect(`/verify/${verificationId}/feedback?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/feedback?message=Feedback submitted");
}

export async function getPendingVerification(agentId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("verification_records")
    .select("id, nin_masked, outcome, reason_code, nimc_identity, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = data?.[0];
  if (!latest) {
    return null;
  }

  const feedback = await admin.from("feedback_records").select("id").eq("verification_id", latest.id).maybeSingle();
  return feedback.data ? null : latest;
}
