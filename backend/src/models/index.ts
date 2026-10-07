export type {
  AuditLog,
  Billing,
  Case,
  Client,
  Document,
  Permission,
  Role,
  User
} from "@prisma/client";

export const CORE_MODELS = ["Client", "Case", "Document", "Billing", "User"] as const;

export type CoreModelName = (typeof CORE_MODELS)[number];

