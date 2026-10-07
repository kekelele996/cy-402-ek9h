import { Button, Input, Progress, Select, Space, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { UploadFile } from "antd";
import type { CaseRecord } from "../../types";
import type { DocumentType } from "../../types/enums";
import { DocumentTypeLabels } from "../../types/enums";
import { useFileUpload } from "../../hooks/useFileUpload";

export function FileUploader({ cases, onUploaded }: { cases: CaseRecord[]; onUploaded: () => void }) {
  const { upload, uploading, progress } = useFileUpload();
  const [caseId, setCaseId] = useState<string>();
  const [fileType, setFileType] = useState<DocumentType>("evidence");
  const [title, setTitle] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  async function submit() {
    const file = fileList[0]?.originFileObj;
    if (!caseId || !file) {
      message.warning("请选择案件和文件");
      return;
    }
    await upload(file, { caseId, fileType, title });
    message.success("文档已上传");
    setFileList([]);
    setTitle("");
    onUploaded();
  }

  return (
    <div className="toolbar-band">
      <Space wrap>
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="选择案件"
          style={{ width: 260 }}
          value={caseId}
          onChange={setCaseId}
          options={cases.map((item) => ({ value: item.id, label: `${item.caseNo} ${item.title}` }))}
        />
        <Select
          style={{ width: 140 }}
          value={fileType}
          onChange={setFileType}
          options={Object.entries(DocumentTypeLabels).map(([value, label]) => ({ value, label }))}
        />
        <Input placeholder="文档标题" value={title} onChange={(event) => setTitle(event.target.value)} style={{ width: 220 }} />
        <Upload
          maxCount={1}
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
        <Button type="primary" loading={uploading} onClick={submit}>
          上传
        </Button>
      </Space>
      {progress > 0 ? <Progress percent={progress} size="small" style={{ marginTop: 12 }} /> : null}
    </div>
  );
}

