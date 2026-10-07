import { request } from "./request";
import type { ApiResponse, Billing, BillingSummary } from "../types";
import type { BillingStatus } from "../types/enums";

export type BillingQuery = {
  caseId?: string;
  clientId?: string;
  status?: BillingStatus;
};

export async function listBillings(params?: BillingQuery) {
  const { data } = await request.get<ApiResponse<Billing[]>>("/billing", { params });
  return data.data;
}

export async function createBilling(payload: Partial<Billing>) {
  const { data } = await request.post<ApiResponse<Billing>>("/billing", payload);
  return data.data;
}

/** 本所账单批量写库；后端失败时只重试本批，不影响财务到账流水。 */
export async function createBillingBatch(items: Array<Partial<Billing>>) {
  const { data } = await request.post<ApiResponse<Billing[]>>("/billing/batch", { items });
  return data.data;
}

export async function updateBillingStatus(id: string, status: BillingStatus) {
  const { data } = await request.patch<ApiResponse<Billing>>(`/billing/${id}/status`, { status });
  return data.data;
}

export async function getBillingSummary() {
  const { data } = await request.get<ApiResponse<BillingSummary>>("/billing/summary");
  return data.data;
}

