import type {
  BillingStatus,
  BillingType,
  CaseStatus,
  CaseType,
  DocumentType,
  ReconciliationStatus
} from "./enums";
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
  receipts?: PaymentReceipt[];
  reconciliations?: ReconciliationRecord[];
  reconciliationStatus?: ReconciliationStatus;
  pendingNote?: string | null;
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

export type PaymentReceipt = {
  id: string;
  receiptNo: string;
  amount: string | number;
  receivedAt: string;
  payerName?: string | null;
  payChannel?: string | null;
  remark?: string | null;
  caseId?: string | null;
  case?: Pick<CaseRecord, "id" | "caseNo" | "title">;
  recordedById: string;
  recordedBy?: Pick<User, "id" | "name">;
  correctedById?: string | null;
  correctedBy?: Pick<User, "id" | "name"> | null;
  createdAt: string;
  updatedAt: string;
};

/** 结案前逐笔核对账单与到账流水的结果 */
export type ReconcileResult = {
  status: Exclude<ReconciliationStatus, "unreconciled">;
  billingTotal: string;
  receiptTotal: string;
  /** 账单多出的待收差额 */
  shortfallAmount: string;
  /** 财务多出的金额（单独列示，不回写账单） */
  surplusAmount: string;
  matchedCount: number;
  matchedPairs: Array<{ billNo: string; receiptNo: string; amount: string }>;
  unmatchedBillings: Array<{ billNo: string; amount: string; type: BillingType }>;
  unmatchedReceipts: Array<{ receiptNo: string; amount: string; receivedAt: string }>;
  note: string;
};

export type ReconciliationRecord = {
  id: string;
  caseId: string;
  status: ReconciliationStatus;
  billingTotal: string | number;
  receiptTotal: string | number;
  shortfallAmount: string | number;
  surplusAmount: string | number;
  unmatchedBillings: ReconcileResult["unmatchedBillings"];
  unmatchedReceipts: ReconcileResult["unmatchedReceipts"];
  matchedCount: number;
  note?: string | null;
  operatedById: string;
  operatedAt: string;
};

export type ReconciliationPreview = {
  caseId: string;
  caseNo: string;
  reconciliationStatus: ReconciliationStatus;
  latestRecord: ReconciliationRecord | null;
  result: ReconcileResult;
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

