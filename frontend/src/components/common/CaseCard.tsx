import { Button, Space, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { CaseRecord } from "../../types";
import { CaseTypeLabels } from "../../types/enums";
import { formatDate } from "../../utils/format";
import { StatusBadge } from "./StatusBadge";

export function CaseCard({ item }: { item: CaseRecord }) {
  return (
    <article className="case-card">
      <div className="card-kicker">{item.caseNo}</div>
      <Typography.Title level={5} style={{ marginTop: 6, marginBottom: 8 }}>
        {item.title}
      </Typography.Title>
      <Space size={6} wrap>
        <StatusBadge status={item.status} />
        <span>{CaseTypeLabels[item.type]}</span>
      </Space>
      <p style={{ color: "#5f5a52", minHeight: 42 }}>{item.summary}</p>
      <div className="meta-row">
        <span>客户：{item.client?.name ?? "-"}</span>
        <span>律师：{item.mainLawyer?.name ?? "-"}</span>
        <span>受理：{formatDate(item.acceptedAt)}</span>
      </div>
      <Link to={`/cases/${item.id}`}>
        <Button type="link" size="small" icon={<ArrowRightOutlined />} style={{ paddingLeft: 0, marginTop: 8 }}>
          查看详情
        </Button>
      </Link>
    </article>
  );
}

