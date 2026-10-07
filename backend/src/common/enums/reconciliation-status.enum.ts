export enum ReconciliationStatus {
  unreconciled = "unreconciled",
  matched = "matched",
  pending_check = "pending_check"
}

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.unreconciled]: "未对账",
  [ReconciliationStatus.matched]: "对账相符",
  [ReconciliationStatus.pending_check]: "待核"
};
