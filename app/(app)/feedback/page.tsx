import { ButtonLink } from "@/components/button";
import { FeedbackFiltersForm } from "@/components/feedback-filters";
import { FeedbackTable } from "@/components/feedback-table";
import { listFeedback } from "@/lib/data/feedback";
import type { FeedbackFilters } from "@/lib/types";

export default async function FeedbackPage({
  searchParams
}: {
  searchParams: Promise<FeedbackFilters & { message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const result = await listFeedback(params);
  const totalPages = Math.max(1, Math.ceil(result.count / result.pageSize));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search, filter, and export submitted feedback records.</p>
      </div>
      {params.message ? <div className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-success">{params.message}</div> : null}
      {params.error ? <div className="mb-5 rounded-md bg-rose-50 p-3 text-sm text-danger">{params.error}</div> : null}
      <FeedbackFiltersForm filters={params} exportPath="/feedback/export" />
      <FeedbackTable rows={result.rows} />
      <div className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {result.page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <ButtonLink href={`/feedback?page=${Math.max(1, result.page - 1)}`} variant="secondary" className="flex-1 sm:flex-none">
            Previous
          </ButtonLink>
          <ButtonLink href={`/feedback?page=${Math.min(totalPages, result.page + 1)}`} variant="secondary" className="flex-1 sm:flex-none">
            Next
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
