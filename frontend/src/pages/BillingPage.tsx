import { Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo } from "react";
import { AmountSummary } from "../components/common/AmountSummary";
import { BillingCard } from "../components/common/BillingCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { useBillingStore } from "../stores/billing";
import { useCaseStore } from "../stores/case";
import { useClientStore } from "../stores/client";
import type { Billing } from "../types";
import { BillingStatusLabels, BillingTypeLabels } from "../types/enums";
import { formatDate, formatMoney } from "../utils/format";

export function BillingPage() {
  const { billings, summary, loading, fetchBillings, fetchSummary } = useBillingStore();
  const { cases, fetchCases } = useCaseStore();
  const { clients, fetchClients } = useClientStore();

  useEffect(() => {
    void fetchBillings();
    void fetchSummary();
    void fetchCases();
    void fetchClients();
  }, [fetchBillings, fetchSummary, fetchCases, fetchClients]);

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

  return (
    <main className="page-shell">
      <h1 className="page-title">费用中心</h1>
      <div className="page-subtitle">按案件、客户、状态筛选账单，并查看本月收款统计。</div>
      <div style={{ marginTop: 18 }}>
        <AmountSummary {...summary} />
      </div>
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
    </main>
  );
}

