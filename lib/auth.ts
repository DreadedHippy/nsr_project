import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export async function getSessionProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return profile ?? null;
}

export async function requireProfile(requiredRole?: UserRole) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "active") {
    redirect("/login?error=inactive");
  }

  if (requiredRole && profile.role !== requiredRole) {
    redirect("/unauthorized");
  }

  return profile;
}

export async function requireAnyProfile() {
  return requireProfile();
}
