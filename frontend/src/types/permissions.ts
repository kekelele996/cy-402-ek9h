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
  | "receipt:read"
  | "receipt:write"
  | "reconciliation:run"
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
    "receipt:read",
    "receipt:write",
    "reconciliation:run",
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
    "receipt:read",
    "reconciliation:run",
    "user:read"
  ],
  assistant: [
    "case:read",
    "client:read",
    "document:read",
    "document:write",
    "billing:read",
    "receipt:read",
    "user:read"
  ],
  finance: [
    "case:read",
    "client:read",
    "billing:read",
    "receipt:read",
    "receipt:write",
    "reconciliation:run",
    "user:read"
  ]
};

export const ROLE_LABELS: Record<RoleName, string> = {
  admin: "管理员",
  lawyer: "律师",
  assistant: "助理",
  finance: "财务"
};
