import { request } from "./request";
import type { ApiResponse, User } from "../types";

export async function listUsers() {
  const { data } = await request.get<ApiResponse<User[]>>("/users");
  return data.data;
}

