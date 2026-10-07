import { Typography } from "antd";
import type { Billing } from "../../types";
import { BillingTypeLabels } from "../../types/enums";
import { formatDate, formatMoney } from "../../utils/format";
import { StatusBadge } from "./StatusBadge";

export function BillingCard({ billing }: { billing: Billing }) {
  return (
    <article className="billing-card">
      <div className="card-kicker">{billing.billNo}</div>
      <Typography.Title level={5} style={{ marginTop: 6, marginBottom: 6 }}>
        {formatMoney(billing.amount)}
      </Typography.Title>
      <div className="meta-row">
        <StatusBadge status={billing.status} />
        <span>{BillingTypeLabels[billing.type]}</span>
        <span>{billing.client?.name}</span>
        <span>{formatDate(billing.createdAt)}</span>
      </div>
    </article>
  );
}

