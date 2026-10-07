import { Prisma } from "@prisma/client";
import { buildReconcileResult } from "../src/services/reconciliation.service";

const dec = (v: string) => new Prisma.Decimal(v);
let failures = 0;
function assert(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL ${name}`, extra ?? "");
  }
}

type Bill = Parameters<typeof buildReconcileResult>[0][number];
type Receipt = Parameters<typeof buildReconcileResult>[1][number];
const bill = (id: string, billNo: string, amount: string, type: Bill["type"] = "attorney_fee"): Bill => ({
  id,
  billNo,
  type,
  amount: dec(amount)
});
const receipt = (id: string, receiptNo: string, amount: string, receivedAt = "2026-07-01T00:00:00.000Z"): Receipt => ({
  id,
  receiptNo,
  amount: dec(amount),
  receivedAt: new Date(receivedAt)
});

// 1. 完全对上
{
  const r = buildReconcileResult(
    [bill("b1", "BILL-1", "50000"), bill("b2", "BILL-2", "1200")],
    [receipt("r1", "RCPT-1", "1200"), receipt("r2", "RCPT-2", "50000")]
  );
  assert("完全对上: matched", r.status === "matched", r);
  assert("完全对上: 无未匹配", r.unmatchedBillings.length === 0 && r.unmatchedReceipts.length === 0);
  assert("完全对上: matchedCount=2", r.matchedCount === 2);
  assert("完全对上: 差额为0", r.shortfallAmount === "0.00" && r.surplusAmount === "0.00");
}

// 2. 账单多出（待收差额），且注明哪几笔没收
{
  const r = buildReconcileResult(
    [bill("b1", "BILL-1", "3200", "court_fee"), bill("b2", "BILL-2", "6000")],
    [receipt("r1", "RCPT-1", "3200")]
  );
  assert("账单多出: pending_check", r.status === "pending_check", r);
  assert("账单多出: 一笔未收", r.unmatchedBillings.length === 1 && r.unmatchedBillings[0].billNo === "BILL-2", r);
  assert("账单多出: 待收差额6000", r.shortfallAmount === "6000.00", r);
  assert("账单多出: 财务无多出", r.surplusAmount === "0.00" && r.unmatchedReceipts.length === 0);
  assert("账单多出: note写明账单号", r.note.includes("BILL-2"), r.note);
}

// 3. 财务多出：单独列示，不算改账单，也不冲抵
{
  const r = buildReconcileResult(
    [bill("b1", "BILL-1", "50000"), bill("b2", "BILL-2", "1200")],
    [receipt("r1", "RCPT-1", "50000"), receipt("r2", "RCPT-2", "1200"), receipt("r3", "RCPT-3", "800")]
  );
  assert("财务多出: pending_check", r.status === "pending_check", r);
  assert("财务多出: 无账单短缺", r.unmatchedBillings.length === 0);
  assert("财务多出: 一笔800", r.unmatchedReceipts.length === 1 && r.unmatchedReceipts[0].amount === "800.00", r);
  assert("财务多出: surplus=800", r.surplusAmount === "800.00", r);
  assert("财务多出: 账单总额不被改写", r.billingTotal === "51200.00", r);
  assert("财务多出: note含不改写说明", r.note.includes("不改写账单"), r.note);
}

// 4. 旧案件：无账单无流水 -> matched（空对空），但无对账记录由上层显示未对账；
//    有账单、无流水 -> 全部待收，绝不当成已收
{
  const empty = buildReconcileResult([], []);
  assert("空案: matched", empty.status === "matched");
  const old = buildReconcileResult([bill("b1", "OLD-BILL", "999.99")], []);
  assert("旧案有账单无流水: pending_check", old.status === "pending_check", old);
  assert("旧案: 已收(到账合计)为0", old.receiptTotal === "0.00", old);
  assert("旧案: 账单999.99全额列为待收", old.shortfallAmount === "999.99", old);
}

// 5. 同金额多笔：按笔配对，数量不等时剩余一方挂出
{
  const r = buildReconcileResult(
    [bill("b1", "BILL-1", "1000"), bill("b2", "BILL-2", "1000"), bill("b3", "BILL-3", "1000")],
    [receipt("r1", "RCPT-1", "1000"), receipt("r2", "RCPT-2", "1000")]
  );
  assert("同额多笔: 匹配2笔", r.matchedCount === 2, r);
  assert("同额多笔: 剩1笔账单待收", r.unmatchedBillings.length === 1 && r.shortfallAmount === "1000.00", r);
}

// 6. 金额以分比较，无浮点误差
{
  const r = buildReconcileResult([bill("b1", "BILL-1", "0.30")], [receipt("r1", "RCPT-1", "0.30")]);
  assert("小数精确: matched", r.status === "matched", r);
}

process.exit(failures ? 1 : 0);
