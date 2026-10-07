import { formatMoney } from "../../utils/format";

export function AmountSummary({
  receivable,
  received,
  pending
}: {
  receivable: number;
  received: number;
  pending: number;
}) {
  return (
    <div className="summary-strip">
      <div className="summary-item">
        <div className="summary-label">本月应收</div>
        <div className="summary-value">{formatMoney(receivable)}</div>
      </div>
      <div className="summary-item">
        <div className="summary-label">已收款</div>
        <div className="summary-value">{formatMoney(received)}</div>
      </div>
      <div className="summary-item">
        <div className="summary-label">待收款</div>
        <div className="summary-value">{formatMoney(pending)}</div>
      </div>
    </div>
  );
}

