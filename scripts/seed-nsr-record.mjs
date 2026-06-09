import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const socialRegisterId = process.env.NSR_SOCIAL_REGISTER_ID ?? "NSR-TEST-001";
const nin = process.env.NSR_NIN ?? "12345678902";
const fullName = process.env.NSR_FULL_NAME ?? "Mock Beneficiary";
const state = process.env.NSR_STATE ?? "Lagos";
const lga = process.env.NSR_LGA ?? "Ikeja";

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

if (!/^\d{11}$/.test(nin)) {
  fail("NSR_NIN must be 11 numeric digits.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { error } = await supabase.from("nsr_records").upsert(
  {
    social_register_id: socialRegisterId,
    nin_encrypted: encryptText(nin),
    nin_hash: hashNin(nin),
    full_name: fullName,
    state,
    lga
  },
  { onConflict: "social_register_id" }
);

if (error) {
  fail(error.message);
}

console.log("Seeded NSR test record:");
console.log(`  social_register_id: ${socialRegisterId}`);
console.log(`  nin: ${nin}`);
console.log(`  full_name: ${fullName}`);
console.log("Use this NIN on /verify, then this Social Register ID on the feedback form.");

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
  console.error(`NSR seed failed: ${message}`);
  process.exit(1);
}
