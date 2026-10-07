import { Alert, Button, Select, Space, Table, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import * as receiptApi from "../api/receipt";
import { AmountSummary } from "../components/common/AmountSummary";
import { BillingCard } from "../components/common/BillingCard";
import { CorrectReceiptModal, ReceiptForm } from "../components/common/ReceiptForm";
import { StatusBadge } from "../components/common/StatusBadge";
import { PermissionGate } from "../directives/permission";
import { useBillingStore } from "../stores/billing";
import { useCaseStore } from "../stores/case";
import { useClientStore } from "../stores/client";
import { useUserStore } from "../stores/user";
import type { Billing, PaymentReceipt } from "../types";
import { BillingStatusLabels, BillingTypeLabels } from "../types/enums";
import { formatDate, formatDateTime, formatMoney } from "../utils/format";

export function BillingPage() {
  const { billings, summary, loading, fetchBillings, fetchSummary } = useBillingStore();
  const { cases, fetchCases } = useCaseStore();
  const { clients, fetchClients } = useClientStore();
  const canWriteReceipts = useUserStore((state) => state.hasPermission("receipt:write"));
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptCaseId, setReceiptCaseId] = useState<string | undefined>();
  const [correcting, setCorrecting] = useState<PaymentReceipt | null>(null);

  const refreshReceipts = (caseId?: string) =>
    receiptApi.listReceipts(caseId ? { caseId } : undefined).then(setReceipts);

  useEffect(() => {
    void fetchBillings();
    void fetchSummary();
    void fetchCases();
    void fetchClients();
  }, [fetchBillings, fetchSummary, fetchCases, fetchClients]);

  useEffect(() => {
    void refreshReceipts(receiptCaseId);
  }, [receiptCaseId]);

  const columns: ColumnsType<Billing> = useMemo(
    () => [
      { title: "账单编号", dataIndex: "billNo" },
      { title: "费用类型", dataIndex: "type", render: (value) => BillingTypeLabels[value as Billing["type"]] },
      { title: "金额", dataIndex: "amount", render: formatMoney },
      { title: "状态", dataIndex: "status", render: (value) => <StatusBadge status={value} /> },
      { title: "案件", dataIndex: ["case", "title"] },
      { title: "客户", dataIndex: ["client", "name"] },
      { title: "创建日期", dataIndex: "createdAt", render: formatDate }
    ],
    []
  );

  const receiptColumns: ColumnsType<PaymentReceipt> = [
    { title: "流水编号", dataIndex: "receiptNo" },
    { title: "金额", dataIndex: "amount", render: formatMoney },
    { title: "到账时间", dataIndex: "receivedAt", render: formatDateTime },
    { title: "付款方", dataIndex: "payerName", render: (value) => value ?? "-" },
    { title: "渠道", dataIndex: "payChannel", render: (value) => value ?? "-" },
    { title: "案件编号", dataIndex: ["case", "caseNo"], render: (value) => value ?? "未认领" },
    {
      title: "登记/更正",
      render: (_, record) => (
        <Space size={4}>
          <span>{record.recordedBy?.name ?? "-"}</span>
          {record.correctedById ? <Typography.Text type="warning">已更正</Typography.Text> : null}
        </Space>
      )
    }
  ];

  const receiptManageColumns: ColumnsType<PaymentReceipt> = [
    ...receiptColumns,
    {
      title: "操作",
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => setCorrecting(record)}>
          更正
        </Button>
      )
    }
  ];

  return (
    <main className="page-shell">
      <h1 className="page-title">费用中心</h1>
      <div className="page-subtitle">办案端账单与财务室到账流水分管分记，结案前逐笔对账。</div>
      <div style={{ marginTop: 18 }}>
        <AmountSummary {...summary} />
      </div>

      <Tabs
        style={{ marginTop: 12 }}
        items={[
          {
            key: "billings",
            label: "账单（办案端）",
            children: (
              <>
                <div className="toolbar-band" style={{ marginTop: 18 }}>
                  <Space wrap>
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="按案件筛选"
                      style={{ width: 240 }}
                      options={cases.map((item) => ({ value: item.id, label: item.title }))}
                      onChange={(caseId) => void fetchBillings({ caseId })}
                    />
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="按客户筛选"
                      style={{ width: 200 }}
                      options={clients.map((client) => ({ value: client.id, label: client.name }))}
                      onChange={(clientId) => void fetchBillings({ clientId })}
                    />
                    <Select
                      allowClear
                      placeholder="按状态筛选"
                      style={{ width: 160 }}
                      options={Object.entries(BillingStatusLabels).map(([value, label]) => ({ value, label }))}
                      onChange={(status) => void fetchBillings({ status })}
                    />
                  </Space>
                </div>
                <div className="work-grid" style={{ marginTop: 18 }}>
                  <section className="work-band">
                    <Table rowKey="id" loading={loading} dataSource={billings} columns={columns} />
                  </section>
                  <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
                    {billings.slice(0, 3).map((billing) => (
                      <BillingCard billing={billing} key={billing.id} />
                    ))}
                  </aside>
                </div>
              </>
            )
          },
          {
            key: "receipts",
            label: "到账流水（财务室）",
            children: (
              <section className="work-band" style={{ marginTop: 18 }}>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="到账流水与账单各自独立记账：财务多出的流水只在此列示，不会改写任何账单金额。"
                />
                <Space wrap style={{ marginBottom: 12 }}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="按案件筛选流水"
                    style={{ width: 260 }}
                    options={cases.map((item) => ({ value: item.id, label: `${item.caseNo} ${item.title}` }))}
                    onChange={(value) => setReceiptCaseId(value)}
                  />
                </Space>
                <PermissionGate
                  permission="receipt:write"
                  fallback={
                    <Typography.Paragraph type="warning">
                      到账流水仅由财务角色登记和更正，当前账号为办案/助理角色，无写入权限。
                    </Typography.Paragraph>
                  }
                >
                  <ReceiptForm
                    onSubmit={async (payload) => {
                      await receiptApi.createReceipt(payload);
                      await refreshReceipts(receiptCaseId);
                    }}
                  />
                </PermissionGate>
                <Table
                  style={{ marginTop: 12 }}
                  rowKey="id"
                  dataSource={receipts}
                  columns={canWriteReceipts ? receiptManageColumns : receiptColumns}
                />
                <CorrectReceiptModal
                  receipt={correcting}
                  open={Boolean(correcting)}
                  onClose={() => setCorrecting(null)}
                  onSaved={() => void refreshReceipts(receiptCaseId)}
                />
              </section>
            )
          }
        ]}
      />
    </main>
  );
}
