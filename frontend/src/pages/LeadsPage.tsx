import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, ChevronLeft, ChevronRight, CirclePlus, Download, Filter, History, Pencil, Search, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";
import LeadActivityModal from "../components/LeadActivityModal";
import { apiErrorMessage } from "./AuthPage";
import LeadFormModal from "../components/LeadFormModal";
import StatusBadge from "../components/StatusBadge";
import { leadStatuses, type Lead, type LeadInput, type LeadListResponse, type LeadStatus, type SalesUser } from "../types";

export default function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "followUpDate" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingLead, setEditingLead] = useState<Lead | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [activityLead, setActivityLead] = useState<Lead | null>(null);
  const openNew = searchParams.get("new") === "1";
  const salesUsersQuery = useQuery({
    queryKey: ["sales-users"],
    queryFn: async () => (await api.get<{ users: SalesUser[] }>("/users/sales")).data.users,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (openNew) {
      setSaveError("");
      setEditingLead(null);
      setSearchParams({}, { replace: true });
    }
  }, [openNew, setSearchParams]);

  useEffect(() => setPage(1), [search, status, from, to, ownerId]);

  const query = useQuery({
    queryKey: ["leads", { search, status, from, to, ownerId, page, sortBy, sortOrder }],
    queryFn: async () => (await api.get<LeadListResponse>("/leads", {
      params: { search: search || undefined, status: status || undefined, from: from || undefined, to: to || undefined, ownerId: ownerId || undefined, page, limit: 10, sortBy, order: sortOrder },
    })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ input, id }: { input: LeadInput; id?: string }) => {
      if (id) return api.patch(`/leads/${id}`, input);
      return api.post("/leads", input);
    },
    onSuccess: async () => {
      setEditingLead(undefined);
      setError("");
      setSaveError("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-leads"] }),
        ...(editingLead ? [queryClient.invalidateQueries({ queryKey: ["lead-activity", editingLead._id] })] : []),
      ]);
    },
    onError: (cause: unknown) => setSaveError(apiErrorMessage(cause, "Unable to save this lead.")),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: async () => {
      setError("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-leads"] }),
      ]);
    },
    onError: (cause: unknown) => setError(apiErrorMessage(cause, "Unable to delete this lead.")),
  });

  const handleDelete = (lead: Lead) => {
    if (window.confirm(`Delete ${lead.name}? This cannot be undone.`)) deleteMutation.mutate(lead._id);
  };
  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const response = await api.get("/leads/export.csv", {
        params: { search: search || undefined, status: status || undefined, from: from || undefined, to: to || undefined, ownerId: ownerId || undefined },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "leads.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause: unknown) {
      setError(apiErrorMessage(cause, "Unable to export leads."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-indigo-600">{isAdmin ? "TEAM PIPELINE" : "YOUR PIPELINE"}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Leads</h1><p className="mt-2 text-sm text-slate-500">Every relationship starts with a conversation.</p></div>
        <div className="flex flex-wrap gap-2"><button className="button-secondary" onClick={() => void handleExport()} disabled={exporting}><Download size={16} />{exporting ? "Exporting…" : "Export CSV"}</button><button className="button-primary" onClick={() => { setError(""); setSaveError(""); setEditingLead(null); }}><CirclePlus size={17} /> Add a lead</button></div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_140px_130px_130px_150px_150px_auto_auto]">
          <label className="relative block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search leads" className="input pl-10" placeholder="Search name, email or phone" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label className="relative"><Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select aria-label="Filter by status" className="input pl-9" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{leadStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="sr-only" htmlFor="date-from">Created from</label><input id="date-from" aria-label="Created from" type="date" className="input" value={from} onChange={(event) => setFrom(event.target.value)} />
          <label className="sr-only" htmlFor="date-to">Created to</label><input id="date-to" aria-label="Created to" type="date" className="input" value={to} onChange={(event) => setTo(event.target.value)} />
          {isAdmin && <select aria-label="Filter by assignee" className="input" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}><option value="">All assignees</option>{salesUsersQuery.data?.map((salesUser) => <option key={salesUser.id} value={salesUser.id}>{salesUser.name}</option>)}</select>}
          <select aria-label="Sort leads by" className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}><option value="createdAt">Created date</option><option value="name">Name</option><option value="followUpDate">Follow-up date</option><option value="status">Status</option></select>
          <button className="button-secondary justify-center" onClick={() => setSortOrder((order) => order === "desc" ? "asc" : "desc")}><ArrowDownUp size={16} />{sortBy === "createdAt" ? (sortOrder === "desc" ? "Newest" : "Oldest") : (sortOrder === "asc" ? "Ascending" : "Descending")}</button>
          <button className="icon-button justify-self-center" title="Clear filters" aria-label="Clear filters" onClick={() => { setSearch(""); setStatus(""); setFrom(""); setTo(""); setOwnerId(""); }}><X size={18} /></button>
        </div>
      </section>

      {isAdmin && salesUsersQuery.isError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Couldn’t load sales users for assignment. You can still manage leads assigned to your account.</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
        {query.isError ? <div className="p-8 text-center"><p className="font-semibold text-slate-800">Couldn’t load your leads</p><p className="mt-1 text-sm text-slate-500">Check your connection and try again.</p><button className="button-secondary mx-auto mt-4" onClick={() => void query.refetch()}>Try again</button></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Lead</th><th className="px-5 py-4">Company</th><th className="px-5 py-4">Service</th>{isAdmin && <th className="px-5 py-4">Assignee</th>}<th className="px-5 py-4">Status</th><th className="px-5 py-4">Follow-up</th><th className="px-5 py-4">Created</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {query.isLoading ? Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={isAdmin ? 8 : 7} className="px-5 py-5"><div className="h-5 animate-pulse rounded bg-slate-100" /></td></tr>) :
                    query.data?.leads.map((lead) => <LeadRow key={lead._id} lead={lead} isAdmin={isAdmin} onActivity={() => setActivityLead(lead)} onEdit={() => { setError(""); setSaveError(""); setEditingLead(lead); }} onDelete={() => handleDelete(lead)} />)}
                </tbody>
              </table>
            </div>
            {!query.isLoading && query.data?.leads.length === 0 && <div className="px-5 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Search size={20} /></span><p className="mt-4 font-semibold text-slate-800">{search || status || from || to || ownerId ? "No leads match these filters" : "No leads yet"}</p><p className="mt-1 text-sm text-slate-500">{search || status || from || to || ownerId ? "Try clearing a filter or changing your search." : "Add your first lead to start building your pipeline."}</p>{!search && !status && !from && !to && !ownerId && <button className="button-primary mx-auto mt-4" onClick={() => { setSaveError(""); setEditingLead(null); }}><CirclePlus size={16} /> Add a lead</button>}</div>}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row">
              <p>{query.data ? `Showing ${query.data.pagination.total === 0 ? 0 : (page - 1) * 10 + 1}–${Math.min(page * 10, query.data.pagination.total)} of ${query.data.pagination.total} leads` : " "}</p>
              <div className="flex items-center gap-2"><button aria-label="Previous page" className="icon-button" disabled={page <= 1 || query.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={18} /></button><span className="px-2">Page {page} of {Math.max(1, query.data?.pagination.pages ?? 1)}</span><button aria-label="Next page" className="icon-button" disabled={page >= (query.data?.pagination.pages ?? 1) || query.isLoading} onClick={() => setPage((current) => current + 1)}><ChevronRight size={18} /></button></div>
            </div>
          </>
        )}
      </section>

      {editingLead !== undefined && <LeadFormModal lead={editingLead} onClose={() => { setEditingLead(undefined); setError(""); setSaveError(""); }} onSave={(input) => { setSaveError(""); saveMutation.mutate({ input, id: editingLead?._id }); }} saving={saveMutation.isPending} error={saveError} isAdmin={isAdmin} salesUsers={salesUsersQuery.data ?? []} />}
      {activityLead && <LeadActivityModal leadId={activityLead._id} leadName={activityLead.name} onClose={() => setActivityLead(null)} />}
    </div>
  );
}

function LeadRow({ lead, isAdmin, onEdit, onDelete, onActivity }: { lead: Lead; isAdmin: boolean; onEdit: () => void; onDelete: () => void; onActivity: () => void }) {
  const ownerName = typeof lead.owner === "object" && lead.owner ? lead.owner.name : "";
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-5 py-4"><p className="font-semibold text-slate-800">{lead.name}</p><p className="mt-1 text-xs text-slate-500">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p></td>
      <td className="px-5 py-4 text-sm text-slate-600">{lead.company || "—"}</td>
      <td className="px-5 py-4 text-sm text-slate-600">{lead.serviceInterested || "—"}</td>
      {isAdmin && <td className="px-5 py-4 text-sm text-slate-600">{ownerName || "Admin"}</td>}
      <td className="px-5 py-4"><StatusBadge status={lead.status as LeadStatus} /></td>
      <td className="px-5 py-4 text-sm text-slate-600">{lead.followUpDate ? format(new Date(`${lead.followUpDate.slice(0, 10)}T12:00:00`), "MMM d, yyyy") : "—"}</td>
      <td className="px-5 py-4 text-sm text-slate-600">{format(new Date(lead.createdAt), "MMM d, yyyy")}</td>
      <td className="px-5 py-4"><div className="flex justify-end gap-1"><button className="icon-button h-8 w-8" title="View activity" aria-label={`View activity for ${lead.name}`} onClick={onActivity}><History size={15} /></button><button className="icon-button h-8 w-8" title="Edit lead" aria-label={`Edit ${lead.name}`} onClick={onEdit}><Pencil size={15} /></button><button className="icon-button h-8 w-8 hover:text-rose-600" title="Delete lead" aria-label={`Delete ${lead.name}`} onClick={onDelete}><Trash2 size={15} /></button></div></td>
    </tr>
  );
}
