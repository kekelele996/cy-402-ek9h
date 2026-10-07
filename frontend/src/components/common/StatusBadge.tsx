import { Tag } from "antd";
import {
  BillingStatusLabels,
  CaseStatusLabels,
  ReconciliationStatusLabels
} from "../../types/enums";
import type { BillingStatus, CaseStatus, ReconciliationStatus } from "../../types/enums";

const colorMap: Record<string, string> = {
  filed: "gold",
  investigating: "cyan",
  hearing: "volcano",
  closed: "green",
  archived: "default",
  pending: "orange",
  paid: "green",
  invoiced: "blue",
  voided: "default",
  unreconciled: "default",
  matched: "green",
  pending_check: "red"
};

export function StatusBadge({
  status
}: {
  status: CaseStatus | BillingStatus | ReconciliationStatus;
}) {
  const labels: Record<string, string> = {
    ...CaseStatusLabels,
    ...BillingStatusLabels,
    ...ReconciliationStatusLabels
  };
  return <Tag color={colorMap[status]}>{labels[status] ?? status}</Tag>;
}
