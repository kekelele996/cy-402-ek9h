import { request } from "./request";
import type { ApiResponse, AuditLog } from "../types";

export async function listAuditLogs() {
  const { data } = await request.get<ApiResponse<AuditLog[]>>("/audit-logs");
  return data.data;
}

