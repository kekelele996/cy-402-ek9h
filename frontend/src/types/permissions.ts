export type RoleName = "admin" | "lawyer" | "assistant" | "finance";

export type PermissionKey =
  | "case:read"
  | "case:write"
  | "client:read"
  | "client:write"
  | "document:read"
  | "document:write"
  | "billing:read"
  | "billing:write"
  | "payment:read"
  | "payment:write"
  | "user:read"
  | "audit:read"
  | "auth:manage";

export const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  admin: [
    "case:read",
    "case:write",
    "client:read",
    "client:write",
    "document:read",
    "document:write",
    "billing:read",
    "billing:write",
    "payment:read",
    "payment:write",
    "user:read",
    "audit:read",
    "auth:manage"
  ],
  lawyer: [
    "case:read",
    "case:write",
    "client:read",
    "client:write",
    "document:read",
    "document:write",
    "billing:read",
    "billing:write",
    "payment:read",
    "user:read"
  ],
  assistant: [
    "case:read",
    "client:read",
    "document:read",
    "document:write",
    "billing:read",
    "payment:read",
    "user:read"
  ],
  finance: ["case:read", "client:read", "billing:read", "payment:read", "payment:write", "user:read"]
};
