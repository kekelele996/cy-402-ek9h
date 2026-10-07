import { request } from "./request";
import type { ApiResponse, ReconciliationPreview, ReconciliationRecord } from "../types";

/** 试算对账（不落库）：旧案件无记录时返回 unreconciled。 */
export async function previewReconciliation(caseId: string) {
  const { data } = await request.get<ApiResponse<ReconciliationPreview>>(
    `/cases/${caseId}/reconciliation`
  );
  return data.data;
}

/** 正式对账落库：相符案件可继续结案，不符案件标为待核。 */
export async function runReconciliation(caseId: string) {
  const { data } = await request.post<ApiResponse<ReconciliationRecord>>(
    `/cases/${caseId}/reconciliation`
  );
  return data.data;
}

export async function listReconciliationHistory(caseId: string) {
  const { data } = await request.get<ApiResponse<ReconciliationRecord[]>>(
    `/cases/${caseId}/reconciliation/history`
  );
  return data.data;
}
