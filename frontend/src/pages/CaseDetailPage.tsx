import { Button, Descriptions, Divider, Space, Typography, message } from "antd";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import * as documentApi from "../api/document";
import { AmountSummary } from "../components/common/AmountSummary";
import { DocumentList } from "../components/common/DocumentList";
import { StatusBadge } from "../components/common/StatusBadge";
import { TimelineItem } from "../components/common/TimelineItem";
import { PermissionGate } from "../directives/permission";
import { useCaseStore } from "../stores/case";
import { CaseTypeLabels } from "../types/enums";
import { formatDate, formatMoney } from "../utils/format";

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
  const summary = billings.reduce(
    (acc, item) => {
      const amount = Number(item.amount);
      acc.receivable += amount;
      if (item.status === "paid" || item.status === "invoiced") acc.received += amount;
      else acc.pending += amount;
      return acc;
    },
    { receivable: 0, received: 0, pending: 0 }
  );

  async function removeDocument(documentId: string) {
    await documentApi.deleteDocument(documentId);
    message.success("文档已删除");
    if (id) void fetchCase(id);
  }

  return (
    <main className="page-shell">
      <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
        <div>
          <h1 className="page-title">{selectedCase.title}</h1>
          <div className="page-subtitle">{selectedCase.caseNo}</div>
        </div>
        <Space>
          <StatusBadge status={selectedCase.status} />
          <PermissionGate permission="case:write">
            <Button>状态流转</Button>
          </PermissionGate>
        </Space>
      </Space>

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

      <div className="work-grid" style={{ marginTop: 18 }}>
        <section className="work-band">
          <Typography.Title level={4}>文档归档</Typography.Title>
          <DocumentList documents={selectedCase.documents ?? []} onDelete={removeDocument} />
          <Divider />
          <Typography.Title level={4}>账单列表</Typography.Title>
          <AmountSummary {...summary} />
          <div style={{ marginTop: 12 }}>
            {(selectedCase.billings ?? []).map((billing) => (
              <div className="meta-row" key={billing.id} style={{ justifyContent: "space-between", padding: "8px 0" }}>
                <span>{billing.billNo}</span>
                <span>{formatMoney(billing.amount)}</span>
                <StatusBadge status={billing.status} />
              </div>
            ))}
          </div>
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

