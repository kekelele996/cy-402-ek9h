import { Button, Typography } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import type { Client } from "../../types";

export function ClientCard({ client, onOpen }: { client: Client; onOpen: (client: Client) => void }) {
  return (
    <article className="client-card">
      <div className="card-kicker">{client.identityNo}</div>
      <Typography.Title level={5} style={{ marginTop: 6, marginBottom: 4 }}>
        {client.name}
      </Typography.Title>
      <div className="meta-row">
        <span>{client.phone}</span>
        <span>{client.email || "未登记邮箱"}</span>
      </div>
      <p style={{ color: "#6f675d" }}>{client.note || "暂无备注"}</p>
      <Button icon={<FolderOpenOutlined />} onClick={() => onOpen(client)}>
        历史案件
      </Button>
    </article>
  );
}

