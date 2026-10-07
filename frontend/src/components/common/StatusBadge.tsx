import { Tag } from "antd";
import { BillingStatusLabels, CaseStatusLabels } from "../../types/enums";
import type { BillingStatus, CaseStatus } from "../../types/enums";

const colorMap: Record<string, string> = {
  filed: "gold",
  investigating: "cyan",
  hearing: "volcano",
  closed: "green",
  archived: "default",
  pending: "orange",
  paid: "green",
  invoiced: "blue",
  voided: "default"
};

export function StatusBadge({ status }: { status: CaseStatus | BillingStatus }) {
  const labels: Record<string, string> = { ...CaseStatusLabels, ...BillingStatusLabels };
  return <Tag color={colorMap[status]}>{labels[status] ?? status}</Tag>;
}

