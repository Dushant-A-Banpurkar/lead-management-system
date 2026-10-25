import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock3, X } from "lucide-react";
import { api } from "../api";
import type { LeadActivity } from "../types";

export default function LeadActivityModal({ leadId, leadName, onClose }: { leadId: string; leadName: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["lead-activity", leadId],
    queryFn: async () => (await api.get<{ activities: LeadActivity[] }>(`/leads/${leadId}/activity`)).data.activities,
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="activity-title" className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div><h2 id="activity-title" className="text-lg font-bold text-slate-900">Lead activity</h2><p className="mt-1 text-sm text-slate-500">{leadName}</p></div>
          <button className="icon-button" aria-label="Close activity" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {query.isLoading && <p className="text-sm text-slate-500">Loading activity…</p>}
          {query.isError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Couldn’t load lead activity.</p>}
          {query.data?.length === 0 && <p className="text-sm text-slate-500">No activity recorded yet.</p>}
          {query.data?.length ? <ol className="space-y-5">{query.data.map((activity) => {
            const actor = typeof activity.actor === "object" ? activity.actor.name : "A team member";
            return <li key={activity._id} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Clock3 size={16} /></span><div><p className="text-sm font-semibold text-slate-800">{actor} {activity.action} this lead</p>{activity.changedFields.length > 0 && <p className="mt-1 text-xs text-slate-500">Updated: {activity.changedFields.join(", ")}</p>}<time className="mt-1 block text-xs text-slate-400">{format(new Date(activity.createdAt), "MMM d, yyyy · h:mm a")}</time></div></li>;
          })}</ol> : null}
        </div>
      </section>
    </div>
  );
}
