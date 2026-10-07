export type CaseType = "civil" | "criminal" | "administrative" | "commercial" | "labor";
export type CaseStatus = "filed" | "investigating" | "hearing" | "pending_review" | "closed" | "archived";
export type DocumentType = "complaint" | "defense" | "evidence" | "judgment" | "contract" | "other";
export type BillingType = "attorney_fee" | "court_fee" | "travel_fee" | "other";
export type BillingStatus = "pending" | "paid" | "invoiced" | "voided";
export type PaymentStatus = "registered" | "corrected" | "voided";
export type ReconciliationStatus = "matched" | "discrepancy";

export const CaseTypeLabels: Record<CaseType, string> = {
  civil: "民事",
  criminal: "刑事",
  administrative: "行政",
  commercial: "商事",
  labor: "劳动"
};

export const CaseStatusLabels: Record<CaseStatus, string> = {
  filed: "立案",
  investigating: "调查",
  hearing: "开庭",
  pending_review: "待核",
  closed: "结案",
  archived: "归档"
};

export const DocumentTypeLabels: Record<DocumentType, string> = {
  complaint: "起诉状",
  defense: "答辩状",
  evidence: "证据材料",
  judgment: "判决书",
  contract: "合同",
  other: "其他"
};

export const BillingTypeLabels: Record<BillingType, string> = {
  attorney_fee: "律师费",
  court_fee: "诉讼费",
  travel_fee: "差旅费",
  other: "其他"
};

export const BillingStatusLabels: Record<BillingStatus, string> = {
  pending: "待支付",
  paid: "已支付",
  invoiced: "已开票",
  voided: "已作废"
};

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  registered: "已登记",
  corrected: "已更正",
  voided: "已作废"
};

export const ReconciliationStatusLabels: Record<ReconciliationStatus, string> = {
  matched: "已对账",
  discrepancy: "待核"
};
