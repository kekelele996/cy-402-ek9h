export enum ReconciliationStatus {
  matched = "matched",
  discrepancy = "discrepancy"
}

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.matched]: "已对账",
  [ReconciliationStatus.discrepancy]: "待核"
};

/** 没有对账记录时的展示状态（旧案件） */
export const UNRECONCILED_LABEL = "未对账";
