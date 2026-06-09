import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nin = process.env.NOT_VERIFIED_NIN ?? "12345678901";
const reasonCode = process.env.NOT_VERIFIED_REASON_CODE ?? "MOCK_NO_MATCH";
const explicitAgentId = process.env.NOT_VERIFIED_AGENT_ID;

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

if (!/^\d{11}$/.test(nin)) {
  fail("NOT_VERIFIED_NIN must be 11 numeric digits.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const agent = explicitAgentId ? await findProfileById(explicitAgentId) : await findFirstActiveAgent();

if (!agent) {
  fail("No active agent profile found. Invite and activate an agent, or set NOT_VERIFIED_AGENT_ID.");
}

if (agent.role !== "agent") {
  fail("NOT_VERIFIED_AGENT_ID must belong to a profile with role 'agent'.");
}

const { data, error } = await supabase
  .from("verification_records")
  .insert({
    agent_id: agent.id,
    nin_encrypted: encryptText(nin),
    nin_hash: hashNin(nin),
    nin_masked: maskNin(nin),
    outcome: "not_verified",
    reason_code: reasonCode,
    nimc_payload_encrypted: encryptText(JSON.stringify({ provider: "seed", verified: false, reasonCode })),
    nimc_identity: null
  })
  .select("id, created_at")
  .single();

if (error || !data) {
  fail(error?.message ?? "Could not insert verification record.");
}

console.log("Seeded not_verified verification record:");
console.log(`  verification_id: ${data.id}`);
console.log(`  agent_id: ${agent.id}`);
console.log(`  agent_name: ${agent.full_name}`);
console.log(`  nin: ${nin}`);
console.log(`  masked_nin: ${maskNin(nin)}`);
console.log(`  reason_code: ${reasonCode}`);
console.log(`  created_at: ${data.created_at}`);

async function findFirstActiveAgent() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "agent")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    fail(error.message);
  }

  return data;
}

async function findProfileById(id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    fail(error.message);
  }

  return data;
}

function getKey() {
  const configured = process.env.NIN_ENCRYPTION_KEY;
  if (configured) {
    return crypto.createHash("sha256").update(configured).digest();
  }

  return crypto.createHash("sha256").update("local-development-key").digest();
}

function encryptText(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

function hashNin(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function maskNin(value) {
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
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
  console.error(`Not-verified seed failed: ${message}`);
  process.exit(1);
}
