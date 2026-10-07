import { useState } from "react";
import * as documentApi from "../api/document";
import type { DocumentRecord } from "../types";
import type { DocumentType } from "../types/enums";

export function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File, meta: { caseId: string; fileType: DocumentType; title?: string }) {
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("文件不能超过 20MB");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", meta.caseId);
    formData.append("fileType", meta.fileType);
    if (meta.title) formData.append("title", meta.title);

    setUploading(true);
    setProgress(20);
    try {
      const result: DocumentRecord = await documentApi.uploadDocument(formData);
      setProgress(100);
      return result;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  return { upload, progress, uploading };
}

