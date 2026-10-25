import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, CircleDollarSign, Plus, Target, Users, UserRoundCheck } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import type { Lead, LeadStats, LeadStatus } from "../types";

const statusColors: Record<LeadStatus, string> = {
  New: "#4f8df7",
  Contacted: "#f3aa3c",
  Qualified: "#8c6be8",
  Converted: "#20a779",
  Lost: "#eb7181",
};

export default function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["lead-stats"],
    queryFn: async () => (await api.get<LeadStats>("/leads/stats")).data,
  });
  const recentQuery = useQuery({
    queryKey: ["recent-leads"],
    queryFn: async () => (await api.get<{ leads: Lead[] }>("/leads", { params: { limit: 5, sortBy: "createdAt", order: "desc" } })).data.leads,
  });
  const stats = statsQuery.data;
  const chartData = stats ? Object.entries(stats.byStatus).map(([status, count]) => ({ status, count })) : [];
  const cards = [
    { label: "Total leads", value: stats?.total ?? 0, icon: Users, tone: "bg-indigo-50 text-indigo-600" },
    { label: "New", value: stats?.byStatus.New ?? 0, icon: Target, tone: "bg-sky-50 text-sky-600" },
    { label: "In conversation", value: stats?.byStatus.Contacted ?? 0, icon: UserRoundCheck, tone: "bg-amber-50 text-amber-600" },
    { label: "Qualified", value: stats?.byStatus.Qualified ?? 0, icon: CircleDollarSign, tone: "bg-violet-50 text-violet-600" },
    { label: "Converted", value: stats?.byStatus.Converted ?? 0, icon: ArrowUpRight, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Lost", value: stats?.byStatus.Lost ?? 0, icon: CalendarDays, tone: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-indigo-600">OVERVIEW</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Good things are in motion.</h1><p className="mt-2 text-sm text-slate-500">Here’s what’s happening across your pipeline.</p></div>
        <Link to="/leads?new=1" className="button-primary"><Plus size={17} /> Add a lead</Link>
      </div>

      {statsQuery.isError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">We couldn’t load your dashboard. Please refresh and try again.</p>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span></div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{statsQuery.isLoading ? "—" : value}</p>
            <p className="mt-1 text-xs text-slate-400">Leads in your workspace</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="mb-5"><h2 className="font-bold text-slate-900">Pipeline overview</h2><p className="mt-1 text-sm text-slate-500">Leads by current status</p></div>
          {statsQuery.isLoading ? <div className="h-[260px] animate-pulse rounded-xl bg-slate-50" /> : stats?.total ? (
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#edf0f5" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]} maxBarSize={54}>{chartData.map((entry) => <Cell key={entry.status} fill={statusColors[entry.status as LeadStatus]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="grid h-[270px] place-items-center text-center"><div><span className="text-sm font-semibold text-slate-700">Your pipeline starts here</span><p className="mt-1 text-sm text-slate-500">Add a lead to see your activity take shape.</p><Link to="/leads?new=1" className="mt-3 inline-flex text-sm font-semibold text-indigo-600">Add your first lead <ArrowUpRight size={15} /></Link></div></div>}
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Recently added</h2><p className="mt-1 text-sm text-slate-500">Your newest opportunities</p></div><Link to="/leads" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</Link></div>
          {recentQuery.isError && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Couldn’t load recent leads.</p>}
          {recentQuery.isLoading ? <div className="space-y-4">{[1, 2, 3, 4].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-50" />)}</div> : recentQuery.data?.length ? (
            <div className="divide-y divide-slate-100">
              {recentQuery.data.map((lead) => <div key={lead._id} className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{lead.name}</p><p className="mt-1 truncate text-xs text-slate-500">{lead.company || lead.email}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><StatusBadge status={lead.status} /><span className="text-[11px] text-slate-400">{format(new Date(lead.createdAt), "MMM d")}</span></div></div>)}
            </div>
          ) : <div className="grid h-[210px] place-items-center text-sm text-slate-500">No leads yet. Your new prospects will show up here.</div>}
        </article>
      </section>
    </div>
  );
}
