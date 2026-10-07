import { Tag } from "antd";
import {
  BillingStatusLabels,
  CaseStatusLabels,
  PaymentStatusLabels,
  ReconciliationStatusLabels
} from "../../types/enums";
import type { BillingStatus, CaseStatus, PaymentStatus, ReconciliationStatus } from "../../types/enums";

const colorMap: Record<string, string> = {
  filed: "gold",
  investigating: "cyan",
  hearing: "volcano",
  pending_review: "magenta",
  closed: "green",
  archived: "default",
  pending: "orange",
  paid: "green",
  invoiced: "blue",
  voided: "default",
  registered: "green",
  corrected: "blue",
  matched: "green",
  discrepancy: "magenta",
  unreconciled: "default"
};

type BadgeStatus = CaseStatus | BillingStatus | PaymentStatus | ReconciliationStatus | "unreconciled";

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const labels: Record<string, string> = {
    ...CaseStatusLabels,
    ...BillingStatusLabels,
    ...PaymentStatusLabels,
    ...ReconciliationStatusLabels,
    unreconciled: "未对账"
  };
  return <Tag color={colorMap[status]}>{labels[status] ?? status}</Tag>;
}
