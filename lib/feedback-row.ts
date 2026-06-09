export type FeedbackRow = {
  id: string;
  verification_id: string;
  agent_id: string;
  social_register_id: string;
  nin_encrypted: string;
  nin_masked: string;
  outcome: "verified" | "not_verified";
  comment: string;
  created_at: string;
  profiles?: { full_name?: string } | { full_name?: string }[] | null;
};

export function getAgentName(row: FeedbackRow) {
  return Array.isArray(row.profiles) ? row.profiles[0]?.full_name : row.profiles?.full_name;
}
