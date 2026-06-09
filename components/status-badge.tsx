import { clsx } from "clsx";

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        ["active", "verified"].includes(value) && "bg-emerald-50 text-success",
        ["deactivated", "not_verified"].includes(value) && "bg-rose-50 text-danger",
        ["invited", "pending"].includes(value) && "bg-amber-50 text-warning"
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}
