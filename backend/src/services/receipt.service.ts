import { prisma } from "../utils/prisma";

/**
 * 到账流水（财务室的账）与账单（办案端的账）是两套独立数据：
 * - 登记/更正只允许财务角色，越权在路由层直接拒绝（见 routes/receipt.ts）；
 * - 每次写入各自独立提交，账单写库失败重试时不会把已记好的到账流水回滚。
 */

export type ReceiptInput = {
  receiptNo: string;
  amount: string;
  receivedAt: string;
  payerName?: string;
  payChannel?: string;
  remark?: string;
  caseId?: string | null;
};

export async function listReceipts(filters: { caseId?: string }) {
  return prisma.paymentReceipt.findMany({
    where: { caseId: filters.caseId },
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      recordedBy: { select: { id: true, name: true } },
      correctedBy: { select: { id: true, name: true } }
    },
    orderBy: { receivedAt: "desc" }
  });
}

export async function createReceipt(input: ReceiptInput, operatorId: string) {
  return prisma.paymentReceipt.create({
    data: {
      receiptNo: input.receiptNo,
      amount: input.amount,
      receivedAt: new Date(input.receivedAt),
      payerName: input.payerName ?? null,
      payChannel: input.payChannel ?? null,
      remark: input.remark ?? null,
      caseId: input.caseId ?? null,
      recordedById: operatorId
    },
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      recordedBy: { select: { id: true, name: true } }
    }
  });
}

export type ReceiptCorrection = {
  amount?: string;
  receivedAt?: string;
  payerName?: string;
  payChannel?: string;
  remark?: string;
  caseId?: string | null;
};

export async function correctReceipt(id: string, patch: ReceiptCorrection, operatorId: string) {
  return prisma.paymentReceipt.update({
    where: { id },
    data: {
      amount: patch.amount,
      receivedAt: patch.receivedAt ? new Date(patch.receivedAt) : undefined,
      payerName: patch.payerName,
      payChannel: patch.payChannel,
      remark: patch.remark,
      caseId: patch.caseId === undefined ? undefined : patch.caseId,
      correctedById: operatorId
    },
    include: {
      case: { select: { id: true, caseNo: true, title: true } },
      recordedBy: { select: { id: true, name: true } },
      correctedBy: { select: { id: true, name: true } }
    }
  });
}
