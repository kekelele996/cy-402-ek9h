import type { BillingStatus, BillingType, CaseStatus, CaseType, DocumentType } from "./enums";
import type { PermissionKey, RoleName } from "./permissions";

export type ApiResponse<T> = {
  data: T;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  licenseNo?: string | null;
  avatarUrl?: string | null;
  primaryRole?: RoleName;
  roles?: RoleName[];
  permissions?: PermissionKey[];
};

export type Client = {
  id: string;
  name: string;
  identityNo: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  cases?: CaseRecord[];
  billings?: Billing[];
  createdAt: string;
  updatedAt: string;
};

export type CaseRecord = {
  id: string;
  caseNo: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  acceptedAt: string;
  closedAt?: string | null;
  summary: string;
  clientId: string;
  mainLawyerId: string;
  client?: Client;
  mainLawyer?: User;
  collaborators?: Array<{ user: User }>;
  documents?: DocumentRecord[];
  billings?: Billing[];
  createdAt: string;
  updatedAt: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  fileType: DocumentType;
  fileUrl: string;
  uploadedAt: string;
  caseId: string;
  uploaderId: string;
  case?: Pick<CaseRecord, "id" | "caseNo" | "title">;
  uploader?: Pick<User, "id" | "name">;
};

export type Billing = {
  id: string;
  billNo: string;
  type: BillingType;
  amount: string | number;
  status: BillingStatus;
  caseId: string;
  clientId: string;
  invoiceInfo?: Record<string, unknown>;
  case?: Pick<CaseRecord, "id" | "caseNo" | "title">;
  client?: Pick<Client, "id" | "name">;
  createdAt: string;
  updatedAt: string;
};

export type BillingSummary = {
  receivable: number;
  received: number;
  pending: number;
};

export type AuditLog = {
  id: string;
  actorId?: string | null;
  actor?: Pick<User, "id" | "name" | "email"> | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  changes: Record<string, unknown>;
  ip?: string | null;
  createdAt: string;
};

