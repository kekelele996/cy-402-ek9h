import type { CaseStatus, CaseType } from "@prisma/client";
import { prisma } from "../utils/prisma";

export type CaseFilters = {
  type?: CaseType;
  status?: CaseStatus;
  lawyerId?: string;
  startDate?: string;
  endDate?: string;
};

const caseInclude = {
  client: true,
  mainLawyer: { select: { id: true, name: true, email: true, primaryRole: true } },
  collaborators: {
    include: { user: { select: { id: true, name: true, email: true, primaryRole: true } } }
  },
  documents: { include: { uploader: { select: { id: true, name: true } } }, orderBy: { uploadedAt: "desc" as const } },
  billings: { orderBy: { createdAt: "desc" as const } }
};

export async function listCases(filters: CaseFilters) {
  return prisma.case.findMany({
    where: {
      type: filters.type,
      status: filters.status,
      acceptedAt:
        filters.startDate || filters.endDate
          ? {
              gte: filters.startDate ? new Date(filters.startDate) : undefined,
              lte: filters.endDate ? new Date(filters.endDate) : undefined
            }
          : undefined,
      OR: filters.lawyerId
        ? [{ mainLawyerId: filters.lawyerId }, { collaborators: { some: { userId: filters.lawyerId } } }]
        : undefined
    },
    include: caseInclude,
    orderBy: { acceptedAt: "desc" }
  });
}

export async function getCase(id: string) {
  return prisma.case.findUnique({
    where: { id },
    include: caseInclude
  });
}

export async function createCase(input: {
  caseNo: string;
  title: string;
  type: CaseType;
  status?: CaseStatus;
  acceptedAt: string;
  closedAt?: string | null;
  summary: string;
  clientId: string;
  mainLawyerId: string;
  collaboratorIds?: string[];
}) {
  return prisma.case.create({
    data: {
      caseNo: input.caseNo,
      title: input.title,
      type: input.type,
      status: input.status,
      acceptedAt: new Date(input.acceptedAt),
      closedAt: input.closedAt ? new Date(input.closedAt) : null,
      summary: input.summary,
      clientId: input.clientId,
      mainLawyerId: input.mainLawyerId,
      collaborators: input.collaboratorIds?.length
        ? { create: input.collaboratorIds.map((userId) => ({ userId })) }
        : undefined
    },
    include: caseInclude
  });
}

export async function updateCaseStatus(id: string, status: CaseStatus) {
  return prisma.case.update({
    where: { id },
    data: { status, closedAt: status === "closed" ? new Date() : undefined },
    include: caseInclude
  });
}

export async function assignLawyers(id: string, mainLawyerId: string, collaboratorIds: string[]) {
  return prisma.$transaction(async (tx) => {
    await tx.case.update({ where: { id }, data: { mainLawyerId } });
    await tx.caseCollaborator.deleteMany({ where: { caseId: id } });
    if (collaboratorIds.length) {
      await tx.caseCollaborator.createMany({
        data: collaboratorIds.map((userId) => ({ caseId: id, userId })),
        skipDuplicates: true
      });
    }
    return tx.case.findUnique({ where: { id }, include: caseInclude });
  });
}

