import { request } from "./request";
import type { ApiResponse, Client } from "../types";

export async function listClients(q?: string) {
  const { data } = await request.get<ApiResponse<Client[]>>("/clients", { params: { q } });
  return data.data;
}

export async function getClient(id: string) {
  const { data } = await request.get<ApiResponse<Client>>(`/clients/${id}`);
  return data.data;
}

export async function createClient(payload: Partial<Client>) {
  const { data } = await request.post<ApiResponse<Client>>("/clients", payload);
  return data.data;
}

export async function updateClient(id: string, payload: Partial<Client>) {
  const { data } = await request.put<ApiResponse<Client>>(`/clients/${id}`, payload);
  return data.data;
}

