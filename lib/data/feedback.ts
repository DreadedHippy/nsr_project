import "server-only";
import { requireAnyProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { FeedbackRow } from "@/lib/feedback-row";
import type { FeedbackFilters } from "@/lib/types";

const pageSize = 50;

export async function listFeedback(filters: FeedbackFilters) {
  const profile = await requireAnyProfile();
  const admin = createSupabaseAdminClient();
  const page = Math.max(1, Number(filters.page ?? 1));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .from("feedback_records")
    .select("*, profiles!feedback_records_agent_id_fkey(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (profile.role === "agent") {
    query = query.eq("agent_id", profile.id);
  }
  if (filters.outcome) {
    query = query.eq("outcome", filters.outcome);
  }
  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters.to) {
    query = query.lte("created_at", filters.to);
  }
  if (filters.q) {
    const q = filters.q.trim();
    query = query.or(`social_register_id.ilike.%${q}%,nin_masked.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    throw error;
  }

  let rows = (data ?? []) as FeedbackRow[];
  if (filters.agent && profile.role === "admin") {
    rows = rows.filter((row) => {
      const agentName = Array.isArray(row.profiles) ? row.profiles[0]?.full_name : row.profiles?.full_name;
      return String(agentName ?? "").toLowerCase().includes(filters.agent!.toLowerCase());
    });
  }

  return {
    rows,
    count: count ?? rows.length,
    page,
    pageSize,
    profile
  };
}

export async function listFeedbackForExport(filters: FeedbackFilters) {
  const profile = await requireAnyProfile();
  const admin = createSupabaseAdminClient();

  let query = admin
    .from("feedback_records")
    .select("*, profiles!feedback_records_agent_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (profile.role === "agent") {
    query = query.eq("agent_id", profile.id);
  }
  if (filters.outcome) {
    query = query.eq("outcome", filters.outcome);
  }
  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters.to) {
    query = query.lte("created_at", filters.to);
  }
  if (filters.q) {
    const q = filters.q.trim();
    query = query.or(`social_register_id.ilike.%${q}%,nin_masked.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return { rows: (data ?? []) as FeedbackRow[], profile };
}
