import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import { getAgentName, type FeedbackRow } from "@/lib/feedback-row";

export function FeedbackTable({ rows }: { rows: FeedbackRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Social Register ID</th>
            <th className="px-4 py-3">NIN</th>
            <th className="px-4 py-3">Outcome</th>
            <th className="px-4 py-3">Comment</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const agentName = getAgentName(row);
            return (
              <tr key={row.id} className="border-t border-border align-top">
                <td className="px-4 py-3 font-medium">{row.social_register_id}</td>
                <td className="px-4 py-3">{row.nin_masked}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={row.outcome} />
                </td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="cursor-pointer list-none">
                      {row.comment.length > 100 ? `${row.comment.slice(0, 100)}...` : row.comment}
                    </summary>
                    {row.comment.length > 100 ? <p className="mt-2 text-muted-foreground">{row.comment}</p> : null}
                  </details>
                </td>
                <td className="px-4 py-3">{agentName ?? "Unknown"}</td>
                <td className="px-4 py-3">{format(new Date(row.created_at), "yyyy-MM-dd HH:mm")}</td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                No feedback records found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
