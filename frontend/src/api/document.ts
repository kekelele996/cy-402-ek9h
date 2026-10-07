import { request } from "./request";
import type { ApiResponse, DocumentRecord } from "../types";
import type { DocumentType } from "../types/enums";

export type DocumentQuery = {
  caseId?: string;
  fileType?: DocumentType;
  q?: string;
};

export async function listDocuments(params?: DocumentQuery) {
  const { data } = await request.get<ApiResponse<DocumentRecord[]>>("/documents", { params });
  return data.data;
}

export async function uploadDocument(payload: FormData) {
  const { data } = await request.post<ApiResponse<DocumentRecord>>("/documents", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data.data;
}

export async function deleteDocument(id: string) {
  const { data } = await request.delete<ApiResponse<DocumentRecord>>(`/documents/${id}`);
  return data.data;
}

