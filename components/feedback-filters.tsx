import { Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/button";
import { Input } from "@/components/field";
import type { FeedbackFilters } from "@/lib/types";

export function FeedbackFiltersForm({ filters, exportPath }: { filters: FeedbackFilters; exportPath: string }) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });

  return (
    <form className="mb-5 grid gap-3 rounded-lg border border-border bg-white p-4 shadow-sm md:grid-cols-6">
      <Input name="q" placeholder="Search ID or NIN" defaultValue={filters.q ?? ""} />
      <select name="outcome" defaultValue={filters.outcome ?? ""} className="focus-ring h-11 rounded-md border border-border bg-white px-3 text-sm">
        <option value="">Any outcome</option>
        <option value="verified">Verified</option>
        <option value="not_verified">Not verified</option>
      </select>
      <Input name="from" type="date" defaultValue={filters.from ?? ""} />
      <Input name="to" type="date" defaultValue={filters.to ?? ""} />
      <Input name="agent" placeholder="Agent name" defaultValue={filters.agent ?? ""} />
      <div className="flex gap-2">
        <Button type="submit" className="px-3" title="Search">
          <Search className="h-4 w-4" />
        </Button>
        <ButtonLink href={`${exportPath}?${params.toString()}`} variant="secondary">
          CSV
        </ButtonLink>
      </div>
    </form>
  );
}
