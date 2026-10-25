export const leadStatuses = ["New", "Contacted", "Qualified", "Converted", "Lost"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sales";
}

export interface SalesUser extends Pick<User, "id" | "name" | "email"> {}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  serviceInterested: string;
  status: LeadStatus;
  followUpDate: string | null;
  notes: string;
  owner?: string | { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  company: string;
  serviceInterested: string;
  status: LeadStatus;
  followUpDate: string | null;
  notes: string;
  ownerId?: string;
}

export interface LeadActivity {
  _id: string;
  action: "created" | "updated" | "deleted";
  leadName: string;
  changedFields: string[];
  actor: { name: string } | string;
  createdAt: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
}

export interface LeadListResponse {
  leads: Lead[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
