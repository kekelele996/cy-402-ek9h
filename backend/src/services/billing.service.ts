import type { BillingStatus, BillingType, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";

export async function listBillings(filters: { caseId?: string; clientId?: string; status?: BillingStatus }) {
  return prisma.billing.findMany({
    where: {
      caseId: filters.caseId,
      clientId: filters.clientId,
      status: filters.status
    },
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      client: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createBilling(input: {
  billNo: string;
  type: BillingType;
  amount: string;
  status?: BillingStatus;
  caseId: string;
  clientId: string;
  invoiceInfo?: Prisma.InputJsonValue;
}) {
  return prisma.billing.create({
    data: input,
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      client: { select: { id: true, name: true } }
    }
  });
}

export async function updateBillingStatus(id: string, status: BillingStatus) {
  return prisma.billing.update({
    where: { id },
    data: { status },
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      client: { select: { id: true, name: true } }
    }
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

