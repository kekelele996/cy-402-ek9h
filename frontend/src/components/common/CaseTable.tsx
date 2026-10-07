import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CaseRecord } from "../../types";
import { CaseTypeLabels } from "../../types/enums";
import { formatDate } from "../../utils/format";
import { StatusBadge } from "./StatusBadge";

const columns: ColumnsType<CaseRecord> = [
  { title: "案件编号", dataIndex: "caseNo" },
  { title: "标题", dataIndex: "title" },
  { title: "类型", dataIndex: "type", render: (value) => CaseTypeLabels[value as CaseRecord["type"]] },
  { title: "状态", dataIndex: "status", render: (value) => <StatusBadge status={value} /> },
  { title: "受理日期", dataIndex: "acceptedAt", render: formatDate }
];

export function CaseTable({ cases, compact = false }: { cases: CaseRecord[]; compact?: boolean }) {
  return <Table rowKey="id" size={compact ? "small" : "middle"} dataSource={cases} columns={columns} pagination={false} />;
}

