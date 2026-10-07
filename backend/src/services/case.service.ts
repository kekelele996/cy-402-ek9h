import type { CaseStatus, CaseType, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http-error";
import { reconcileCase } from "./reconciliation.service";

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
  payments: {
    where: { status: { not: "voided" as const } },
    include: { registeredBy: { select: { id: true, name: true } } },
    orderBy: { receivedAt: "desc" as const }
  },
  reconciliation: true
};

type CaseWithRelations = Prisma.CaseGetPayload<{ include: typeof caseInclude }>;

const toAmount = (value: unknown) => Math.round(Number(value) * 100) / 100;

/**
 * 案件财务汇总：已收只统计财务登记的到账流水，
 * 没有到账记录就是 0——不能拿账单金额当成已收。
 * 没有对账记录的旧案件 reconciliationStatus 为 unreconciled（未对账）。
 */
function attachFinance(record: CaseWithRelations | null) {
  if (!record) {
    return record;
  }
  const billedTotal = record.billings
    .filter((billing) => billing.status !== "voided")
    .reduce((sum, billing) => sum + toAmount(billing.amount), 0);
  const receivedTotal = record.payments.reduce((sum, payment) => sum + toAmount(payment.amount), 0);
  const receivableDiff = record.reconciliation
    ? toAmount(record.reconciliation.receivableDiff)
    : Math.max(0, Math.round((billedTotal - receivedTotal) * 100) / 100);
  return {
    ...record,
    finance: {
      billedTotal: Math.round(billedTotal * 100) / 100,
      receivedTotal: Math.round(receivedTotal * 100) / 100,
      receivableDiff,
      reconciliationStatus: record.reconciliation?.status ?? "unreconciled"
    }
  };
}

export async function listCases(filters: CaseFilters) {
  const cases = await prisma.case.findMany({
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
  return cases.map(attachFinance);
}

export async function getCase(id: string) {
  const record = await prisma.case.findUnique({
    where: { id },
    include: caseInclude
  });
  return attachFinance(record);
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
  const record = await prisma.case.create({
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
  return attachFinance(record);
}

export async function updateCaseStatus(id: string, status: CaseStatus, actorId?: string) {
  if (status === "closed") {
    const existing = await prisma.case.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) {
      throw new HttpError(404, "Case not found");
    }
    if (existing.status !== "closed") {
      // 结案前必须对账：按案件把账单与到账流水逐笔核对，对得上才准结案
      const reconciliation = await reconcileCase(id, actorId);
      if (reconciliation.status !== "matched") {
        // 对不上：案件标为待核，差额明细随 409 响应一并返回说清
        await prisma.case.update({ where: { id }, data: { status: "pending_review" } });
        throw new HttpError(409, "对账未通过：存在待收差额或未匹配到账，案件已标记为待核", {
          reconciliation
        });
      }
    }
  }
  const record = await prisma.case.update({
    where: { id },
    data: { status, closedAt: status === "closed" ? new Date() : undefined },
    include: caseInclude
  });
  return attachFinance(record);
}

export async function assignLawyers(id: string, mainLawyerId: string, collaboratorIds: string[]) {
  const record = await prisma.$transaction(async (tx) => {
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
  return attachFinance(record ?? null);
}
