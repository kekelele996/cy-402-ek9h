export type RoleName = "admin" | "lawyer" | "assistant";

export type PermissionKey =
  | "case:read"
  | "case:write"
  | "client:read"
  | "client:write"
  | "document:read"
  | "document:write"
  | "billing:read"
  | "billing:write"
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
    "user:read"
  ],
  assistant: ["case:read", "client:read", "document:read", "document:write", "billing:read", "user:read"]
};

