import { Descriptions, Divider, Space, Tag, Typography } from "antd";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import * as documentApi from "../api/document";
import { AmountSummary } from "../components/common/AmountSummary";
import { DocumentList } from "../components/common/DocumentList";
import { ReconciliationPanel } from "../components/common/ReconciliationPanel";
import { StatusBadge } from "../components/common/StatusBadge";
import { TimelineItem } from "../components/common/TimelineItem";
import { useCaseStore } from "../stores/case";
import { CaseTypeLabels, ReconciliationStatusLabels } from "../types/enums";
import { formatDate, formatDateTime, formatMoney } from "../utils/format";

export function CaseDetailPage() {
  const { id } = useParams();
  const { selectedCase, fetchCase } = useCaseStore();

  useEffect(() => {
    if (id) void fetchCase(id);
  }, [id, fetchCase]);

  if (!selectedCase) {
    return <main className="page-shell">正在加载案件详情...</main>;
  }

  const billings = selectedCase.billings ?? [];
  const receipts = selectedCase.receipts ?? [];

  // 应收：未作废账单合计；已收：以财务到账流水为准（不能拿账单金额/状态充当已收）；
  // 待收：两者之差。旧案件没有到账流水时，已收为 0，并由对账区显示“未对账”。
  const receivable = billings
    .filter((item) => item.status !== "voided")
    .reduce((total, item) => total + Number(item.amount), 0);
  const received = receipts.reduce((total, item) => total + Number(item.amount), 0);
  const summary = {
    receivable,
    received,
    pending: Math.max(receivable - received, 0)
  };

  const reconciliationStatus = selectedCase.reconciliationStatus ?? "unreconciled";

  async function removeDocument(documentId: string) {
    await documentApi.deleteDocument(documentId);
    if (id) void fetchCase(id);
  }

  return (
    <main className="page-shell">
      <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
        <div>
          <h1 className="page-title">{selectedCase.title}</h1>
          <div className="page-subtitle">
            {selectedCase.caseNo} · 对账状态：
            {ReconciliationStatusLabels[reconciliationStatus]}
          </div>
        </div>
        <Space>
          <StatusBadge status={selectedCase.status} />
          <StatusBadge status={reconciliationStatus} />
        </Space>
      </Space>

      {selectedCase.pendingNote ? (
        <div className="work-band" style={{ marginTop: 18, borderColor: "#ffa39e" }}>
          <Typography.Text type="danger" strong>
            案件待核：
          </Typography.Text>
          <Typography.Text>{selectedCase.pendingNote}</Typography.Text>
        </div>
      ) : null}

      <div className="work-band" style={{ marginTop: 18 }}>
        <Descriptions column={{ xs: 1, md: 2, xl: 3 }} bordered size="small">
          <Descriptions.Item label="案件类型">{CaseTypeLabels[selectedCase.type]}</Descriptions.Item>
          <Descriptions.Item label="客户">{selectedCase.client?.name}</Descriptions.Item>
          <Descriptions.Item label="主办律师">{selectedCase.mainLawyer?.name}</Descriptions.Item>
          <Descriptions.Item label="协办律师">
            {selectedCase.collaborators?.map((item) => item.user.name).join("、") || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="受理日期">{formatDate(selectedCase.acceptedAt)}</Descriptions.Item>
          <Descriptions.Item label="结案日期">{formatDate(selectedCase.closedAt)}</Descriptions.Item>
          <Descriptions.Item label="案情摘要" span={3}>
            {selectedCase.summary}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div style={{ marginTop: 18 }}>
        <ReconciliationPanel
          caseId={selectedCase.id}
          caseStatus={selectedCase.status}
          status={reconciliationStatus}
          pendingNote={selectedCase.pendingNote}
          receipts={receipts}
          onChanged={() => id && void fetchCase(id)}
        />
      </div>

      <div className="work-grid" style={{ marginTop: 18 }}>
        <section className="work-band">
          <Typography.Title level={4}>文档归档</Typography.Title>
          <DocumentList documents={selectedCase.documents ?? []} onDelete={removeDocument} />
          <Divider />
          <Typography.Title level={4}>账单列表（办案端）</Typography.Title>
          <AmountSummary {...summary} />
          <div style={{ marginTop: 12 }}>
            {billings.map((billing) => (
              <div className="meta-row" key={billing.id} style={{ justifyContent: "space-between", padding: "8px 0" }}>
                <span>{billing.billNo}</span>
                <span>{formatMoney(billing.amount)}</span>
                <StatusBadge status={billing.status} />
              </div>
            ))}
          </div>
          <Divider />
          <Typography.Title level={4}>到账流水（财务室）</Typography.Title>
          {receipts.length ? (
            receipts.map((receipt) => (
              <div className="meta-row" key={receipt.id} style={{ justifyContent: "space-between", padding: "8px 0" }}>
                <span>{receipt.receiptNo}</span>
                <span>{receipt.payerName ?? "-"}</span>
                <span>{formatDateTime(receipt.receivedAt)}</span>
                <span>{formatMoney(receipt.amount)}</span>
                {receipt.correctedById ? <Tag color="orange">已更正</Tag> : null}
              </div>
            ))
          ) : (
            <Typography.Text type="secondary">暂无到账流水，案件显示为未对账。</Typography.Text>
          )}
        </section>
        <aside className="work-band">
          <Typography.Title level={4}>案件时间线</Typography.Title>
          <TimelineItem title="案件受理" time={selectedCase.acceptedAt}>
            客户 {selectedCase.client?.name} 建立委托关系。
          </TimelineItem>
          <TimelineItem title="最近更新" time={selectedCase.updatedAt}>
            当前状态：<StatusBadge status={selectedCase.status} />
          </TimelineItem>
          {selectedCase.closedAt ? <TimelineItem title="结案" time={selectedCase.closedAt} /> : null}
        </aside>
      </div>
    </main>
  );
}
