import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import * as auditApi from "../api/audit";
import type { AuditLog } from "../types";
import { formatDateTime } from "../utils/format";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    auditApi
      .listAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<AuditLog> = [
    { title: "时间", dataIndex: "createdAt", render: formatDateTime, width: 180 },
    { title: "操作人", dataIndex: ["actor", "name"], width: 160 },
    { title: "动作", dataIndex: "action", render: (value) => <Tag color="geekblue">{value}</Tag>, width: 150 },
    { title: "实体", dataIndex: "targetEntity", width: 140 },
    { title: "目标ID", dataIndex: "targetId", ellipsis: true },
    {
      title: "变更内容",
      dataIndex: "changes",
      render: (value) => <code>{JSON.stringify(value)}</code>
    }
  ];

  return (
    <main className="page-shell">
      <h1 className="page-title">审计日志</h1>
      <div className="page-subtitle">记录案件、客户、文档、账单和用户管理操作。</div>
      <section className="work-band" style={{ marginTop: 18 }}>
        <Table rowKey="id" loading={loading} dataSource={logs} columns={columns} />
      </section>
    </main>
  );
}

