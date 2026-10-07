import { Button, Empty, List, Popconfirm, Space } from "antd";
import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import type { DocumentRecord } from "../../types";
import { DocumentTypeLabels } from "../../types/enums";
import { formatDateTime } from "../../utils/format";
import { PermissionGate } from "../../directives/permission";

export function DocumentList({
  documents,
  onDelete
}: {
  documents: DocumentRecord[];
  onDelete?: (id: string) => void;
}) {
  if (!documents.length) {
    return <Empty description="暂无文档" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <List
      dataSource={documents}
      renderItem={(doc) => (
        <List.Item
          actions={[
            <a href={doc.fileUrl} target="_blank" rel="noreferrer" key="download">
              <Button size="small" icon={<DownloadOutlined />}>
                下载
              </Button>
            </a>,
            onDelete ? (
              <PermissionGate permission="document:write" key="delete">
                <Popconfirm title="确认删除该文档？" onConfirm={() => onDelete(doc.id)}>
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </PermissionGate>
            ) : null
          ]}
        >
          <List.Item.Meta
            title={doc.title}
            description={
              <Space wrap>
                <span>{DocumentTypeLabels[doc.fileType]}</span>
                <span>{doc.case?.title}</span>
                <span>上传：{formatDateTime(doc.uploadedAt)}</span>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}

