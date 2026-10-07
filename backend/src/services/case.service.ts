import type { CaseStatus, CaseType } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http-error";
import { evaluateCase, toReconciliationData } from "./reconciliation.service";

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
  billings: { orderBy: { createdAt: "desc" as const } },
  receipts: { orderBy: { receivedAt: "desc" as const } },
  reconciliations: { orderBy: { operatedAt: "desc" as const }, take: 1 }
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

/**
 * 案件状态流转。
 * 开庭(hearing) -> 结案(closed) 之前必须通过对账：
 * 实时按案件编号逐笔核对账单与到账流水，对得上才准结案；
 * 对不上则落一条对账记录、把案件标为待核(pending_check)，并拒绝结案。
 */
export async function updateCaseStatus(id: string, status: CaseStatus, operatorId: string) {
  const existing = await prisma.case.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Case not found");
  }

  if (status === "closed") {
    const result = await evaluateCase(id);

    if (result.status !== "matched") {
      // 对不上：对账结果落库、案件标为待核，然后拒绝结案（不改案件状态、不写结案日期）
      await prisma.$transaction([
        prisma.reconciliation.create({ data: toReconciliationData(id, result, operatorId) }),
        prisma.case.update({
          where: { id },
          data: { reconciliationStatus: "pending_check", pendingNote: result.note }
        })
      ]);
      throw new HttpError(409, "对账未通过，案件不能结案", {
        reconciliation: result,
        reason:
          result.unmatchedBillings.length > 0
            ? "账单存在未到账的待收差额，请先核对下列账单"
            : "财务到账流水多出账单范围，请先核实",
        unmatchedBillings: result.unmatchedBillings,
        unmatchedReceipts: result.unmatchedReceipts
      });
    }

    // 对得上：对账相符结果落库 + 清除待核标记 + 结案，放在同一事务一次提交
    return prisma.$transaction(async (tx) => {
      await tx.reconciliation.create({ data: toReconciliationData(id, result, operatorId) });
      return tx.case.update({
        where: { id },
        data: { status, closedAt: new Date(), reconciliationStatus: "matched", pendingNote: null },
        include: caseInclude
      });
    });
  }

  return prisma.case.update({
    where: { id },
    data: { status },
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

