import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Lead, LeadInput, LeadStatus, SalesUser } from "../types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  phone: z.string().max(40),
  company: z.string().max(120),
  serviceInterested: z.string().max(120),
  status: z.enum(["New", "Contacted", "Qualified", "Converted", "Lost"]),
  followUpDate: z.string(),
  notes: z.string().max(5000),
  ownerId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
const statuses: LeadStatus[] = ["New", "Contacted", "Qualified", "Converted", "Lost"];

export default function LeadFormModal({
  lead,
  onClose,
  onSave,
  saving,
  error,
  isAdmin,
  salesUsers,
}: {
  lead: Lead | null;
  onClose: () => void;
  onSave: (input: LeadInput) => void;
  saving: boolean;
  error?: string;
  isAdmin: boolean;
  salesUsers: SalesUser[];
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", company: "", serviceInterested: "", status: "New", followUpDate: "", notes: "", ownerId: "" },
  });

  useEffect(() => {
    reset(lead ? {
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      serviceInterested: lead.serviceInterested ?? "",
      status: lead.status,
      followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : "",
      notes: lead.notes ?? "",
      ownerId: typeof lead.owner === "object" && lead.owner ? lead.owner._id : typeof lead.owner === "string" ? lead.owner : "",
    } : undefined);
  }, [lead, reset]);

  const submit = (values: FormValues) => onSave({
    ...values,
    followUpDate: values.followUpDate ? new Date(`${values.followUpDate}T00:00:00.000Z`).toISOString() : null,
    ownerId: values.ownerId || undefined,
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="lead-form-title" className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div><h2 id="lead-form-title" className="text-lg font-bold text-slate-900">{lead ? "Edit lead" : "Add a lead"}</h2><p className="mt-1 text-sm text-slate-500">Keep your prospect details up to date.</p></div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit(submit)} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name *" error={errors.name?.message}><input className="input" {...register("name")} /></Field>
            <Field label="Email address *" error={errors.email?.message}><input type="email" className="input" {...register("email")} /></Field>
            <Field label="Phone number" error={errors.phone?.message}><input className="input" {...register("phone")} /></Field>
            <Field label="Company" error={errors.company?.message}><input className="input" {...register("company")} /></Field>
            <Field label="Service interested in"><input className="input" {...register("serviceInterested")} /></Field>
            <Field label="Status"><select className="input" {...register("status")}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
            <Field label="Follow-up date"><input type="date" className="input" {...register("followUpDate")} /></Field>
            {isAdmin && <Field label="Assigned to"><select className="input" {...register("ownerId")}><option value="">My account / keep current</option>{salesUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></Field>}
          </div>
          <Field label="Notes"><textarea rows={3} className="input resize-y" placeholder="Add context for your next conversation…" {...register("notes")} /></Field>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button-primary" disabled={saving}>{saving ? "Saving…" : lead ? "Save changes" : "Create lead"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}{error && <span className="mt-1 block text-xs font-normal text-rose-600">{error}</span>}</label>;
}
