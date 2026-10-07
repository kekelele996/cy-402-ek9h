import type { DocumentType } from "@prisma/client";
import { prisma } from "../utils/prisma";

export async function listDocuments(filters: { caseId?: string; fileType?: DocumentType; q?: string }) {
  return prisma.document.findMany({
    where: {
      caseId: filters.caseId,
      fileType: filters.fileType,
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined
    },
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      uploader: { select: { id: true, name: true } }
    },
    orderBy: { uploadedAt: "desc" }
  });
}

export async function createDocument(input: {
  title: string;
  fileType: DocumentType;
  fileUrl: string;
  caseId: string;
  uploaderId: string;
}) {
  return prisma.document.create({
    data: input,
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      uploader: { select: { id: true, name: true } }
    }
  });
}

export async function deleteDocument(id: string) {
  return prisma.document.delete({ where: { id } });
}

