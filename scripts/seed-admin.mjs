import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL ?? "admin@nsr.local";
const fullName = process.env.ADMIN_FULL_NAME ?? "System Administrator";
const generatedPassword = crypto.randomBytes(18).toString("base64url");
const password = process.env.ADMIN_PASSWORD ?? generatedPassword;

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

if (password.length < 8) {
  fail("ADMIN_PASSWORD must be at least 8 characters.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const existingUser = await findUserByEmail(email);
let user = existingUser;

if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (error || !data.user) {
    fail(error?.message ?? "Could not create admin auth user.");
  }

  user = data.user;
} else {
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    ban_duration: "none",
    user_metadata: { full_name: fullName }
  });

  if (error) {
    fail(error.message);
  }
}

const { error: profileError } = await supabase.from("profiles").upsert(
  {
    id: user.id,
    email,
    full_name: fullName,
    role: "admin",
    status: "active"
  },
  { onConflict: "id" }
);

if (profileError) {
  fail(profileError.message);
}

console.log("Seeded administrator:");
console.log(`  email: ${email}`);
console.log(`  password: ${password}`);
console.log(`  profile_id: ${user.id}`);
if (!process.env.ADMIN_PASSWORD) {
  console.log("Set ADMIN_PASSWORD before rerunning if you want a stable password.");
}

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      fail(error.message);
    }

    const match = data.users.find((item) => item.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
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
  console.error(`Admin seed failed: ${message}`);
  process.exit(1);
}
