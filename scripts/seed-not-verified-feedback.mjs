import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const socialRegisterId = process.env.NOT_VERIFIED_SOCIAL_REGISTER_ID ?? "NSR-NOT-VERIFIED-001";
const comment =
  process.env.NOT_VERIFIED_FEEDBACK_COMMENT ??
  "Beneficiary identity could not be verified against the NIMC response.";

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

if (comment.length < 10 || comment.length > 1000) {
  fail("NOT_VERIFIED_FEEDBACK_COMMENT must be 10 to 1000 characters.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const verification = await findNotVerifiedWithoutFeedback();
if (!verification) {
  fail("No not_verified verification without feedback found. Run npm run seed:not-verified first.");
}

await ensureNsrRecord(verification);

const { data, error } = await supabase
  .from("feedback_records")
  .insert({
    verification_id: verification.id,
    agent_id: verification.agent_id,
    social_register_id: socialRegisterId,
    nin_encrypted: verification.nin_encrypted,
    nin_hash: verification.nin_hash,
    nin_masked: verification.nin_masked,
    outcome: "not_verified",
    comment
  })
  .select("id, created_at")
  .single();

if (error || !data) {
  fail(error?.message ?? "Could not insert feedback record.");
}

console.log("Seeded not_verified feedback record:");
console.log(`  feedback_id: ${data.id}`);
console.log(`  verification_id: ${verification.id}`);
console.log(`  social_register_id: ${socialRegisterId}`);
console.log(`  agent_id: ${verification.agent_id}`);
console.log(`  masked_nin: ${verification.nin_masked}`);
console.log(`  outcome: not_verified`);
console.log(`  created_at: ${data.created_at}`);

async function findNotVerifiedWithoutFeedback() {
  const { data: verifications, error } = await supabase
    .from("verification_records")
    .select("id, agent_id, nin_encrypted, nin_hash, nin_masked, outcome, created_at")
    .eq("outcome", "not_verified")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    fail(error.message);
  }

  for (const verification of verifications ?? []) {
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback_records")
      .select("id")
      .eq("verification_id", verification.id)
      .maybeSingle();

    if (feedbackError) {
      fail(feedbackError.message);
    }

    if (!feedback) {
      return verification;
    }
  }

  return null;
}

async function ensureNsrRecord(verification) {
  const { error } = await supabase.from("nsr_records").upsert(
    {
      social_register_id: socialRegisterId,
      nin_encrypted: verification.nin_encrypted,
      nin_hash: verification.nin_hash,
      full_name: "Not Verified Test Beneficiary",
      state: "Lagos",
      lga: "Ikeja"
    },
    { onConflict: "social_register_id" }
  );

  if (error) {
    fail(error.message);
  }
}

function loadEnvFile(fileName) {
  const envPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

function fail(message) {
  console.error(`Not-verified feedback seed failed: ${message}`);
  process.exit(1);
}
