import type { Billing, PaymentReceipt, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";

/**
 * 结案前对账：按案件编号把办案端账单(Billing)与财务室到账流水(PaymentReceipt)
 * 逐笔核对。两边各管各的账：
 * - 对账过程只读两边数据，绝不修改账单金额；
 * - 账单多出的逐笔列为待收差额，案件标为待核；
 * - 财务多出的逐笔单独列出，不拿它改写账单；
 * - 到账流水的写入/更正只在 receipt.service 中由财务角色完成。
 */

export type ReconcileResult = {
  status: "matched" | "pending_check";
  billingTotal: string;
  receiptTotal: string;
  shortfallAmount: string;
  surplusAmount: string;
  matchedCount: number;
  matchedPairs: Array<{ billNo: string; receiptNo: string; amount: string }>;
  unmatchedBillings: Array<{ billNo: string; amount: string; type: Billing["type"] }>;
  unmatchedReceipts: Array<{ receiptNo: string; amount: string; receivedAt: string }>;
  note: string;
};

type BillRow = Pick<Billing, "id" | "billNo" | "type" | "amount">;
type ReceiptRow = Pick<PaymentReceipt, "id" | "receiptNo" | "amount" | "receivedAt">;

export async function loadCaseBills(caseId: string): Promise<BillRow[]> {
  return prisma.billing.findMany({
    where: { caseId, status: { not: "voided" } },
    select: { id: true, billNo: true, type: true, amount: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function loadCaseReceipts(caseId: string): Promise<ReceiptRow[]> {
  return prisma.paymentReceipt.findMany({
    where: { caseId },
    select: { id: true, receiptNo: true, amount: true, receivedAt: true },
    orderBy: { receivedAt: "asc" }
  });
}

/**
 * 按金额逐笔配对（金额一律以分为整数比较，避免浮点误差）。
 * 同一金额可能有多笔，采用“金额桶 + 先进先出”配对；任一桶耗尽，
 * 剩余的一方即记为未逐笔匹配。
 */
export function pairBillingsAndReceipts(bills: BillRow[], receipts: ReceiptRow[]) {
  const toCents = (amount: Prisma.Decimal | string | number) => Math.round(Number(amount) * 100);

  const billBuckets = new Map<number, BillRow[]>();
  for (const bill of bills) {
    const key = toCents(bill.amount);
    const bucket = billBuckets.get(key);
    if (bucket) bucket.push(bill);
    else billBuckets.set(key, [bill]);
  }

  const matchedPairs: ReconcileResult["matchedPairs"] = [];
  const matchedReceiptIds = new Set<string>();
  const matchedBillIds = new Set<string>();

  for (const receipt of receipts) {
    const bucket = billBuckets.get(toCents(receipt.amount));
    const bill = bucket?.shift();
    if (bill) {
      matchedBillIds.add(bill.id);
      matchedReceiptIds.add(receipt.id);
      matchedPairs.push({
        billNo: bill.billNo,
        receiptNo: receipt.receiptNo,
        amount: bill.amount.toFixed(2)
      });
    }
  }

  const unmatchedBillings = bills
    .filter((bill) => !matchedBillIds.has(bill.id))
    .map((bill) => ({
      billNo: bill.billNo,
      amount: bill.amount.toFixed(2),
      type: bill.type
    }));
  const unmatchedReceipts = receipts
    .filter((receipt) => !matchedReceiptIds.has(receipt.id))
    .map((receipt) => ({
      receiptNo: receipt.receiptNo,
      amount: receipt.amount.toFixed(2),
      receivedAt: receipt.receivedAt.toISOString()
    }));

  return { matchedPairs, unmatchedBillings, unmatchedReceipts, matchedCount: matchedPairs.length };
}

export function buildReconcileResult(
  bills: BillRow[],
  receipts: ReceiptRow[]
): ReconcileResult {
  const { matchedPairs, unmatchedBillings, unmatchedReceipts, matchedCount } =
    pairBillingsAndReceipts(bills, receipts);

  const sum = (items: Array<{ amount: Prisma.Decimal | string }>) =>
    items.reduce((total, item) => total + Math.round(Number(item.amount) * 100), 0);
  const toYuan = (cents: number) => (cents / 100).toFixed(2);

  const billingTotalCents = sum(bills);
  const receiptTotalCents = sum(receipts);
  const shortfallCents = unmatchedBillings.reduce(
    (total, item) => total + Math.round(Number(item.amount) * 100),
    0
  );
  const surplusCents = unmatchedReceipts.reduce(
    (total, item) => total + Math.round(Number(item.amount) * 100),
    0
  );

  const matched = unmatchedBillings.length === 0 && unmatchedReceipts.length === 0;
  const note = matched
    ? "账单与到账流水逐笔核对相符。"
    : [
        unmatchedBillings.length
          ? `账单有 ${unmatchedBillings.length} 笔未收到到账（${unmatchedBillings
              .map((item) => item.billNo)
              .join("、")}），列为待收差额 ${toYuan(shortfallCents)} 元。`
          : null,
        unmatchedReceipts.length
          ? `财务到账流水多出 ${unmatchedReceipts.length} 笔（${unmatchedReceipts
              .map((item) => item.receiptNo)
              .join("、")}），合计 ${toYuan(surplusCents)} 元，单独列示，不改写账单。`
          : null
      ]
        .filter(Boolean)
        .join(" ");

  return {
    status: matched ? "matched" : "pending_check",
    billingTotal: toYuan(billingTotalCents),
    receiptTotal: toYuan(receiptTotalCents),
    shortfallAmount: toYuan(shortfallCents),
    surplusAmount: toYuan(surplusCents),
    matchedCount,
    matchedPairs,
    unmatchedBillings,
    unmatchedReceipts,
    note
  };
}

/** 实时计算某案件的对账结果（不落库），供结案拦截等场景使用。 */
export async function evaluateCase(caseId: string): Promise<ReconcileResult> {
  const [bills, receipts] = await Promise.all([loadCaseBills(caseId), loadCaseReceipts(caseId)]);
  return buildReconcileResult(bills, receipts);
}

/** 对账结果 -> reconciliation 行数据（只写对账侧，绝不改账单/流水）。 */
export function toReconciliationData(caseId: string, result: ReconcileResult, operatorId: string) {
  return {
    caseId,
    status: result.status,
    billingTotal: result.billingTotal,
    receiptTotal: result.receiptTotal,
    shortfallAmount: result.shortfallAmount,
    surplusAmount: result.surplusAmount,
    unmatchedBillings: result.unmatchedBillings as unknown as Prisma.InputJsonValue,
    unmatchedReceipts: result.unmatchedReceipts as unknown as Prisma.InputJsonValue,
    matchedPairs: result.matchedPairs as unknown as Prisma.InputJsonValue,
    matchedCount: result.matchedCount,
    note: result.note,
    operatedById: operatorId
  };
}

/**
 * 执行一次对账并落库，同时更新案件的对账状态。
 * 只写对账侧（reconciliations + cases.reconciliationStatus），
 * 不触碰 billings / payment_receipts。
 */
export async function runReconciliation(caseId: string, operatorId: string) {
  const result = await evaluateCase(caseId);

  return prisma.$transaction(async (tx) => {
    const record = await tx.reconciliation.create({
      data: toReconciliationData(caseId, result, operatorId)
    });
    await tx.case.update({
      where: { id: caseId },
      data: {
        reconciliationStatus: result.status,
        pendingNote: result.status === "pending_check" ? result.note : null
      }
    });
    return record;
  });
}

export async function getLatestReconciliation(caseId: string) {
  return prisma.reconciliation.findFirst({
    where: { caseId },
    orderBy: { operatedAt: "desc" }
  });
}

export async function listReconciliations(filters: { caseId?: string; status?: string }) {
  return prisma.reconciliation.findMany({
    where: { caseId: filters.caseId, status: filters.status as Prisma.EnumReconciliationStatusFilter | undefined },
    orderBy: { operatedAt: "desc" },
    take: 200
  });
}
