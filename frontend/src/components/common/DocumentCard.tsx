import { Button, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { DocumentRecord } from "../../types";
import { DocumentTypeLabels } from "../../types/enums";
import { formatDateTime } from "../../utils/format";

export function DocumentCard({ document }: { document: DocumentRecord }) {
  return (
    <article className="document-card">
      <div className="card-kicker">{DocumentTypeLabels[document.fileType]}</div>
      <Typography.Title level={5} style={{ marginTop: 6, marginBottom: 4 }}>
        {document.title}
      </Typography.Title>
      <div className="meta-row">
        <span>{document.case?.title || "未关联案件"}</span>
        <span>{formatDateTime(document.uploadedAt)}</span>
      </div>
      <a href={document.fileUrl} target="_blank" rel="noreferrer">
        <Button size="small" icon={<DownloadOutlined />} style={{ marginTop: 10 }}>
          下载
        </Button>
      </a>
    </article>
  );
}

