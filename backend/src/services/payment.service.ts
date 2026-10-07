import type { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";

const paymentInclude = {
  case: { select: { id: true, caseNo: true, title: true } },
  registeredBy: { select: { id: true, name: true } }
};

export async function listPayments(filters: { caseId?: string; paymentNo?: string }) {
  return prisma.payment.findMany({
    where: {
      caseId: filters.caseId,
      paymentNo: filters.paymentNo
    },
    include: paymentInclude,
    orderBy: { receivedAt: "desc" }
  });
}

export async function getPayment(id: string) {
  return prisma.payment.findUnique({ where: { id }, include: paymentInclude });
}

/**
 * 登记到账流水。只允许财务角色调用（路由层 Roles("finance") 强制）。
 * 到账流水在自己的事务里写入，不与本所账单共用事务：
 * 账单批次失败回滚/重试都不会把已登记的到账一起回滚。
 */
export async function createPayment(
  input: {
    paymentNo: string;
    caseId: string;
    billNo?: string | null;
    amount: string;
    receivedAt: string;
    note?: string | null;
  },
  registeredById: string
) {
  return prisma.payment.create({
    data: {
      paymentNo: input.paymentNo,
      caseId: input.caseId,
      billNo: input.billNo || null,
      amount: input.amount,
      receivedAt: new Date(input.receivedAt),
      note: input.note ?? null,
      registeredById
    },
    include: paymentInclude
  });
}

/** 更正到账流水（金额/到账日期/对应账单/备注），同样仅财务角色可调用。 */
export async function correctPayment(
  id: string,
  input: {
    billNo?: string | null;
    amount?: string;
    receivedAt?: string;
    note?: string | null;
  }
) {
  const data: Prisma.PaymentUpdateInput = {
    status: "corrected",
    billNo: input.billNo === undefined ? undefined : input.billNo || null,
    amount: input.amount,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
    note: input.note
  };
  return prisma.payment.update({
    where: { id },
    data,
    include: paymentInclude
  });
}

/** 作废登记错误的到账流水（软删除，保留痕迹），仅财务角色可调用。 */
export async function voidPayment(id: string) {
  return prisma.payment.update({
    where: { id },
    data: { status: "voided" },
    include: paymentInclude
  });
}
