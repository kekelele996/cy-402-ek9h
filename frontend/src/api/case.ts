import { request } from "./request";
import type { ApiResponse, CaseRecord } from "../types";
import type { CaseStatus, CaseType } from "../types/enums";

export type CaseQuery = {
  type?: CaseType;
  status?: CaseStatus;
  lawyerId?: string;
  startDate?: string;
  endDate?: string;
};

export async function listCases(params?: CaseQuery) {
  const { data } = await request.get<ApiResponse<CaseRecord[]>>("/cases", { params });
  return data.data;
}

export async function getCase(id: string) {
  const { data } = await request.get<ApiResponse<CaseRecord>>(`/cases/${id}`);
  return data.data;
}

export async function createCase(payload: Partial<CaseRecord> & { collaboratorIds?: string[] }) {
  const { data } = await request.post<ApiResponse<CaseRecord>>("/cases", payload);
  return data.data;
}

export async function updateCaseStatus(id: string, status: CaseStatus) {
  const { data } = await request.patch<ApiResponse<CaseRecord>>(`/cases/${id}/status`, { status });
  return data.data;
}

