import type { BillingStatus, BillingType, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";

/// 写库瞬时故障（连接、超时等）才值得重试；唯一键冲突这类永久性错误直接抛出。
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1011",
  "P1017",
  "P2024",
  "P2028",
  "P2034"
]);

function isTransientWriteError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error
    ? TRANSIENT_PRISMA_CODES.has(String((error as { code?: string }).code))
    : false;
}

/**
 * 办案端账单批量写库：只在账单自己的事务里重试本批，
 * 事务回滚仅作用于本批账单，财务已登记的到账流水在另一套表里、独立提交，绝不跟着回滚。
 */
export async function createBillingBatch(
  items: Array<{
    billNo: string;
    type: BillingType;
    amount: string;
    status?: BillingStatus;
    caseId: string;
    clientId: string;
    invoiceInfo?: Prisma.InputJsonValue;
  }>,
  maxAttempts = 3
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.billing.createMany({ data: items });
      });
      return prisma.billing.findMany({
        where: { billNo: { in: items.map((item) => item.billNo) } },
        include: {
          case: { select: { id: true, caseNo: true, title: true } },
          client: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    } catch (error) {
      lastError = error;
      if (!isTransientWriteError(error) || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
  throw lastError;
}

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

/**
 * 本月费用汇总：
 * - 应收：本月新建、未作废账单金额（办案端的账）；
 * - 已收：本月财务到账流水金额（财务室的账），不能拿账单状态/金额充当已收；
 * - 待收：应收减已收（不小于 0）。财务多出到账但无账单的情形由对账单独列示，不在这里冲抵。
 */
export async function billingSummary() {
  const current = new Date();
  const monthStart = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));

  const [billingRows, receiptRows] = await Promise.all([
    prisma.billing.findMany({
      where: { createdAt: { gte: monthStart }, status: { not: "voided" } },
      select: { amount: true }
    }),
    prisma.paymentReceipt.findMany({
      where: { receivedAt: { gte: monthStart } },
      select: { amount: true }
    })
  ]);

  const receivable = billingRows.reduce((total, row) => total + Number(row.amount), 0);
  const received = receiptRows.reduce((total, row) => total + Number(row.amount), 0);

  return {
    receivable,
    received,
    pending: Math.max(receivable - received, 0)
  };
}

