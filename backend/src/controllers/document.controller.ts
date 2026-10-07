import type { Request, Response } from "express";
import { z } from "zod";
import * as documentService from "../services/document.service";

const documentTypeSchema = z.enum(["complaint", "defense", "evidence", "judgment", "contract", "other"]);

const createDocumentSchema = z.object({
  title: z.string().optional(),
  fileType: documentTypeSchema,
  fileUrl: z.string().optional(),
  caseId: z.string().uuid()
});

export async function list(req: Request, res: Response) {
  const data = await documentService.listDocuments({
    caseId: typeof req.query.caseId === "string" ? req.query.caseId : undefined,
    fileType: typeof req.query.fileType === "string" ? documentTypeSchema.parse(req.query.fileType) : undefined,
    q: typeof req.query.q === "string" ? req.query.q : undefined
  });
  res.json({ data });
}

export async function upload(req: Request, res: Response) {
  const input = createDocumentSchema.parse(req.body);
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : input.fileUrl;
  if (!fileUrl) {
    return res.status(400).json({ message: "file or fileUrl is required" });
  }
  const data = await documentService.createDocument({
    title: input.title || req.file?.originalname || "未命名文档",
    fileType: input.fileType,
    fileUrl,
    caseId: input.caseId,
    uploaderId: req.user!.id
  });
  res.status(201).json({ data });
}

export async function remove(req: Request, res: Response) {
  const data = await documentService.deleteDocument(req.params.id);
  res.json({ data });
}

