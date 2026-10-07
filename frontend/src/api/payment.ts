import { request } from "./request";
import type { ApiResponse, Payment } from "../types";

export type PaymentQuery = {
  caseId?: string;
  paymentNo?: string;
};

export type PaymentPayload = {
  paymentNo: string;
  caseId: string;
  billNo?: string | null;
  amount: string | number;
  receivedAt: string;
  note?: string | null;
};

export async function listPayments(params?: PaymentQuery) {
  const { data } = await request.get<ApiResponse<Payment[]>>("/payments", { params });
  return data.data;
}

export async function createPayment(payload: PaymentPayload) {
  const { data } = await request.post<ApiResponse<Payment>>("/payments", payload);
  return data.data;
}

export async function correctPayment(id: string, payload: Partial<Omit<PaymentPayload, "paymentNo" | "caseId">>) {
  const { data } = await request.patch<ApiResponse<Payment>>(`/payments/${id}`, payload);
  return data.data;
}
