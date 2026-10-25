import type { LeadStatus } from "../types";

const colors: Record<LeadStatus, string> = {
  New: "bg-sky-50 text-sky-700 ring-sky-200",
  Contacted: "bg-amber-50 text-amber-700 ring-amber-200",
  Qualified: "bg-violet-50 text-violet-700 ring-violet-200",
  Converted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Lost: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[status]}`}>{status}</span>;
}
