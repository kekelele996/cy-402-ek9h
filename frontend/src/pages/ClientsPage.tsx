import { Drawer, Input, Space, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { CaseCard } from "../components/common/CaseCard";
import { CaseTable } from "../components/common/CaseTable";
import { ClientCard } from "../components/common/ClientCard";
import { useClientStore } from "../stores/client";
import type { Client } from "../types";

export function ClientsPage() {
  const { clients, selectedClient, fetchClients, fetchClient } = useClientStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  function openClient(client: Client) {
    void fetchClient(client.id);
    setOpen(true);
  }

  return (
    <main className="page-shell">
      <Space align="start" style={{ justifyContent: "space-between", width: "100%", marginBottom: 18 }}>
        <div>
          <h1 className="page-title">客户管理</h1>
          <div className="page-subtitle">检索客户资料，并从侧边栏查看历史案件。</div>
        </div>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索姓名、证件号、电话"
          style={{ width: 280 }}
          onPressEnter={(event) => void fetchClients(event.currentTarget.value)}
        />
      </Space>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {clients.map((client) => (
          <ClientCard client={client} onOpen={openClient} key={client.id} />
        ))}
      </section>

      <Drawer width={720} open={open} onClose={() => setOpen(false)} title={selectedClient?.name}>
        {selectedClient ? (
          <>
            <Typography.Paragraph>{selectedClient.note}</Typography.Paragraph>
            <div className="meta-row" style={{ marginBottom: 16 }}>
              <span>证件号：{selectedClient.identityNo}</span>
              <span>电话：{selectedClient.phone}</span>
              <span>地址：{selectedClient.address}</span>
            </div>
            <Typography.Title level={5}>历史案件</Typography.Title>
            <CaseTable cases={selectedClient.cases ?? []} compact />
            <Typography.Title level={5} style={{ marginTop: 18 }}>
              最近案件卡片
            </Typography.Title>
            {selectedClient.cases?.[0] ? <CaseCard item={selectedClient.cases[0]} /> : null}
          </>
        ) : null}
      </Drawer>
    </main>
  );
}

