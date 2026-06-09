import { NextResponse } from "next/server";
import type { VerificationOutcome } from "@/lib/types";
import { getAgentName } from "@/lib/feedback-row";
import { decryptText } from "@/lib/security";
import { listFeedbackForExport } from "@/lib/data/feedback";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { rows, profile } = await listFeedbackForExport({
    q: searchParams.get("q") ?? undefined,
    outcome: parseOutcome(searchParams.get("outcome")),
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined
  });

  const header = [
    "Social Register ID",
    "Masked NIN",
    "Unmasked NIN",
    "Outcome",
    "Feedback Comment",
    "Agent Name",
    "Feedback Submitted At"
  ];

  const lines = [
    header,
    ...rows.map((row) => {
      const agentName = getAgentName(row);
      return [
        row.social_register_id,
        row.nin_masked,
        profile.role === "admin" || profile.id === row.agent_id ? decryptText(row.nin_encrypted) : "",
        row.outcome,
        row.comment,
        agentName ?? "",
        row.created_at
      ];
    })
  ].map((line) => line.map(csvCell).join(","));

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="nsr-feedback-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function parseOutcome(value: string | null): VerificationOutcome | undefined {
  return value === "verified" || value === "not_verified" ? value : undefined;
}
