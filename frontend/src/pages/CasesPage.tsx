import { Button, Space, Table, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CaseQuery } from "../api/case";
import { CaseCard } from "../components/common/CaseCard";
import { FilterBar } from "../components/common/FilterBar";
import { StatusBadge } from "../components/common/StatusBadge";
import { PermissionGate, vPermission } from "../directives/permission";
import { usePagination } from "../hooks/usePagination";
import { useCaseStore } from "../stores/case";
import { useUserStore } from "../stores/user";
import type { CaseRecord } from "../types";
import { CaseTypeLabels } from "../types/enums";
import { formatDate } from "../utils/format";

export function CasesPage() {
  const { cases, loading, fetchCases } = useCaseStore();
  const { users, fetchUsers } = useUserStore();
  const [selected, setSelected] = useState<CaseRecord | null>(null);
  const { tablePagination } = usePagination(8);

  useEffect(() => {
    void fetchCases();
    void fetchUsers();
  }, [fetchCases, fetchUsers]);

  const current = selected ?? cases[0];

  const columns: ColumnsType<CaseRecord> = useMemo(
    () => [
      { title: "案件编号", dataIndex: "caseNo", width: 150 },
      {
        title: "案件标题",
        dataIndex: "title",
        render: (value, record) => <Link to={`/cases/${record.id}`}>{value}</Link>
      },
      { title: "类型", dataIndex: "type", render: (value) => CaseTypeLabels[value as CaseRecord["type"]] },
      { title: "状态", dataIndex: "status", render: (value) => <StatusBadge status={value} /> },
      { title: "客户", dataIndex: ["client", "name"] },
      { title: "主办律师", dataIndex: ["mainLawyer", "name"] },
      { title: "受理日期", dataIndex: "acceptedAt", render: formatDate }
    ],
    []
  );

  function applyFilter(query: CaseQuery) {
    void fetchCases(query);
  }

  return (
    <main className="page-shell">
      <Space align="start" style={{ justifyContent: "space-between", width: "100%", marginBottom: 18 }}>
        <div>
          <h1 className="page-title">案件列表</h1>
          <div className="page-subtitle">按类型、状态、律师和时间筛选所有案件。</div>
        </div>
        <PermissionGate permission="case:write">
          <Button type="primary" icon={<PlusOutlined />} {...vPermission("case:write")}>
            新建案件
          </Button>
        </PermissionGate>
      </Space>
      <FilterBar users={users} onChange={applyFilter} />
      <div className="work-grid" style={{ marginTop: 18 }}>
        <section className="work-band">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={cases}
            columns={columns}
            pagination={tablePagination}
            onRow={(record) => ({ onClick: () => setSelected(record) })}
          />
        </section>
        <aside>
          <Typography.Title level={5}>案件速览</Typography.Title>
          {current ? <CaseCard item={current} /> : <div className="work-band">暂无案件</div>}
        </aside>
      </div>
    </main>
  );
}

