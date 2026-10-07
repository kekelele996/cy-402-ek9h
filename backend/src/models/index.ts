export type {
  AuditLog,
  Billing,
  Case,
  Client,
  Document,
  Payment,
  Permission,
  Reconciliation,
  Role,
  User
} from "@prisma/client";

export const CORE_MODELS = ["Client", "Case", "Document", "Billing", "Payment", "Reconciliation", "User"] as const;

export type CoreModelName = (typeof CORE_MODELS)[number];
