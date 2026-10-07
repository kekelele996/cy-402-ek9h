import type { BillingStatus, BillingType, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { withTransactionRetry } from "../utils/retry";

const billingInclude = {
  case: { select: { id: true, caseNo: true, title: true } },
  client: { select: { id: true, name: true } }
};

export async function listBillings(filters: { caseId?: string; clientId?: string; status?: BillingStatus }) {
  return prisma.billing.findMany({
    where: {
      caseId: filters.caseId,
      clientId: filters.clientId,
      status: filters.status
    },
    include: billingInclude,
    orderBy: { createdAt: "desc" }
  });
}

export type BillingInput = {
  billNo: string;
  type: BillingType;
  amount: string;
  status?: BillingStatus;
  caseId: string;
  clientId: string;
  invoiceInfo?: Prisma.InputJsonValue;
};

export async function createBilling(input: BillingInput) {
  return prisma.billing.create({
    data: input,
    include: billingInclude
  });
}

/**
 * 本所账单批次写库：整批一个事务，失败只重试本所这一批。
 * 财务到账流水由 payment 模块独立事务登记，不在本事务内，
 * 因此这里回滚或重试都不会把财务已记好的到账一起回滚。
 */
export async function createBillingBatch(items: BillingInput[]) {
  return withTransactionRetry(() =>
    prisma.$transaction(async (tx) => {
      const created = [];
      for (const item of items) {
        created.push(await tx.billing.create({ data: item, include: billingInclude }));
      }
      return created;
    })
  );
}

export async function updateBillingStatus(id: string, status: BillingStatus) {
  return prisma.billing.update({
    where: { id },
    data: { status },
    include: billingInclude
  });
}

export async function billingSummary() {
  const current = new Date();
  const monthStart = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
  const rows = await prisma.billing.findMany({
    where: { createdAt: { gte: monthStart }, status: { not: "voided" } },
    select: { amount: true, status: true }
  });

  return rows.reduce(
    (acc, row) => {
      const amount = Number(row.amount);
      acc.receivable += amount;
      if (row.status === "paid" || row.status === "invoiced") {
        acc.received += amount;
      } else {
        acc.pending += amount;
      }
      return acc;
    },
    { receivable: 0, received: 0, pending: 0 }
  );
}

