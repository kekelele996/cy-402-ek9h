import { Collapse, Input, Select, Space, Typography, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import * as documentApi from "../api/document";
import { DocumentCard } from "../components/common/DocumentCard";
import { DocumentList } from "../components/common/DocumentList";
import { FileUploader } from "../components/common/FileUploader";
import { PermissionGate } from "../directives/permission";
import { useCaseStore } from "../stores/case";
import { useDocumentStore } from "../stores/document";
import { DocumentTypeLabels } from "../types/enums";
import { groupBy } from "../utils/group";

export function DocumentsPage() {
  const { documents, fetchDocuments } = useDocumentStore();
  const { cases, fetchCases } = useCaseStore();

  useEffect(() => {
    void fetchDocuments();
    void fetchCases();
  }, [fetchDocuments, fetchCases]);

  async function removeDocument(id: string) {
    await documentApi.deleteDocument(id);
    message.success("文档已删除");
    void fetchDocuments();
  }

  const grouped = groupBy(documents, (doc) => doc.case?.title || "未关联案件");

  return (
    <main className="page-shell">
      <h1 className="page-title">文档中心</h1>
      <div className="page-subtitle">按案件分组归档，支持类型筛选与全文搜索。</div>
      <div style={{ marginTop: 18 }}>
        <PermissionGate permission="document:write">
          <FileUploader cases={cases} onUploaded={() => void fetchDocuments()} />
        </PermissionGate>
      </div>
      <div className="toolbar-band" style={{ marginTop: 18 }}>
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索文档标题"
            style={{ width: 260 }}
            onPressEnter={(event) => void fetchDocuments({ q: event.currentTarget.value })}
          />
          <Select
            allowClear
            placeholder="文件类型"
            style={{ width: 160 }}
            options={Object.entries(DocumentTypeLabels).map(([value, label]) => ({ value, label }))}
            onChange={(fileType) => void fetchDocuments({ fileType })}
          />
        </Space>
      </div>

      <div className="work-grid" style={{ marginTop: 18 }}>
        <section className="work-band">
          <Collapse
            defaultActiveKey={Object.keys(grouped)}
            items={Object.entries(grouped).map(([caseTitle, docs]) => ({
              key: caseTitle,
              label: `${caseTitle}（${docs.length}）`,
              children: <DocumentList documents={docs} onDelete={removeDocument} />
            }))}
          />
        </section>
        <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <Typography.Title level={5}>最近上传</Typography.Title>
          {documents.slice(0, 4).map((document) => (
            <DocumentCard document={document} key={document.id} />
          ))}
        </aside>
      </div>
    </main>
  );
}

