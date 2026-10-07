import type { Payment } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http-error";

export type UnmatchedBill = {
  billNo: string;
  type: string;
  amount: number;
  received: number;
  difference: number;
};

export type UnmatchedPayment = {
  paymentNo: string | null;
  billNo: string | null;
  amount: number;
  receivedAt: string | null;
  reason: "no_bill_reference" | "bill_not_found" | "excess_over_bill";
};

const toCents = (value: unknown) => Math.round(Number(value) * 100);
const fromCents = (cents: number) => cents / 100;

/**
 * 按案件逐笔核对账单与到账流水：
 * - 账单多出来的（未收/少收）列成待收差额，写明哪几笔没收；
 * - 财务多出来的（无对应账单或超额到账）单独列出；
 * - 对账只读账单金额，绝不用到账流水改写账单。
 */
export async function reconcileCase(caseId: string, actorId?: string) {
  const record = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      billings: { where: { status: { not: "voided" } } },
      payments: { where: { status: { not: "voided" } } }
    }
  });
  if (!record) {
    throw new HttpError(404, "Case not found");
  }

  const billNos = new Set(record.billings.map((billing) => billing.billNo));
  const paymentsByBillNo = new Map<string, Payment[]>();
  const unmatchedPayments: UnmatchedPayment[] = [];

  for (const payment of record.payments) {
    if (payment.billNo && billNos.has(payment.billNo)) {
      const list = paymentsByBillNo.get(payment.billNo) ?? [];
      list.push(payment);
      paymentsByBillNo.set(payment.billNo, list);
    } else {
      unmatchedPayments.push({
        paymentNo: payment.paymentNo,
        billNo: payment.billNo,
        amount: fromCents(toCents(payment.amount)),
        receivedAt: payment.receivedAt.toISOString(),
        reason: payment.billNo ? "bill_not_found" : "no_bill_reference"
      });
    }
  }

  const unmatchedBills: UnmatchedBill[] = [];
  for (const billing of record.billings) {
    const allocated = paymentsByBillNo.get(billing.billNo) ?? [];
    const receivedCents = allocated.reduce((sum, payment) => sum + toCents(payment.amount), 0);
    const amountCents = toCents(billing.amount);
    if (receivedCents < amountCents) {
      unmatchedBills.push({
        billNo: billing.billNo,
        type: billing.type,
        amount: fromCents(amountCents),
        received: fromCents(receivedCents),
        difference: fromCents(amountCents - receivedCents)
      });
    } else if (receivedCents > amountCents) {
      unmatchedPayments.push({
        paymentNo: null,
        billNo: billing.billNo,
        amount: fromCents(receivedCents - amountCents),
        receivedAt: null,
        reason: "excess_over_bill"
      });
    }
  }

  const billedTotalCents = record.billings.reduce((sum, billing) => sum + toCents(billing.amount), 0);
  const receivedTotalCents = record.payments.reduce((sum, payment) => sum + toCents(payment.amount), 0);
  const receivableDiffCents = unmatchedBills.reduce((sum, item) => sum + toCents(item.difference), 0);
  const matched = unmatchedBills.length === 0 && unmatchedPayments.length === 0;

  const data = {
    status: matched ? ("matched" as const) : ("discrepancy" as const),
    billedTotal: fromCents(billedTotalCents),
    receivedTotal: fromCents(receivedTotalCents),
    receivableDiff: fromCents(receivableDiffCents),
    unmatchedBills,
    unmatchedPayments,
    reconciledById: actorId ?? null
  };

  return prisma.reconciliation.upsert({
    where: { caseId },
    update: data,
    create: { caseId, ...data }
  });
}

export async function getReconciliation(caseId: string) {
  return prisma.reconciliation.findUnique({ where: { caseId } });
}
