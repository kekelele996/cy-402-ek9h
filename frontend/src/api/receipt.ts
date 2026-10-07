import { request } from "./request";
import type { ApiResponse, PaymentReceipt } from "../types";

export type ReceiptQuery = {
  caseId?: string;
};

export type ReceiptPayload = {
  receiptNo: string;
  amount: string | number;
  receivedAt: string;
  payerName?: string;
  payChannel?: string;
  remark?: string;
  caseId?: string | null;
};

export async function listReceipts(params?: ReceiptQuery) {
  const { data } = await request.get<ApiResponse<PaymentReceipt[]>>("/receipts", { params });
  return data.data;
}

/** 仅财务角色可调；律师调用后端会返回 403 权限不足。 */
export async function createReceipt(payload: ReceiptPayload) {
  const { data } = await request.post<ApiResponse<PaymentReceipt>>("/receipts", payload);
  return data.data;
}

/** 更正已登记的到账流水（财务专属）。 */
export async function correctReceipt(id: string, payload: Partial<ReceiptPayload>) {
  const { data } = await request.patch<ApiResponse<PaymentReceipt>>(`/receipts/${id}`, payload);
  return data.data;
}
