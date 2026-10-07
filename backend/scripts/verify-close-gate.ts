/* HTTP 层结案拦截验证：
 * - 开庭 -> 结案 前必须逐笔对账；
 * - 对不上返回 409、案件标待核并写明哪几笔没收，状态保持开庭；
 * - 财务补齐到账后，对账相符才允许结案。
 */
import Module from "node:module";
import type { Server } from "node:http";

let failures = 0;
function assert(name: string, cond: boolean, extra?: unknown) {
  if (cond) console.log(`PASS ${name}`);
  else {
    failures += 1;
    console.error(`FAIL ${name}`, JSON.stringify(extra, null, 2));
  }
}

let currentUser: { roles: string[]; permissions: string[] } = {
  roles: ["lawyer"],
  permissions: ["case:read", "case:write", "billing:read", "receipt:read"]
};

const mockAuth = (req: any, _res: any, next: any) => {
  req.user = { id: "lawyer-1", email: "l@t", name: "周明律", ...currentUser };
  next();
};

// 有状态内存库
const db = {
  case: {
    id: "case-1",
    caseNo: "CY-2026-T-009",
    status: "hearing",
    reconciliationStatus: "unreconciled",
    pendingNote: null as string | null,
    mainLawyerId: "lawyer-1",
    closedAt: null as string | null
  },
  billings: [
    { id: "b1", billNo: "BILL-T1", type: "attorney_fee", amount: 1000, status: "paid", caseId: "case-1" },
    { id: "b2", billNo: "BILL-T2", type: "court_fee", amount: 200, status: "pending", caseId: "case-1" }
  ],
  receipts: [
    // 初始只有 1000 到账，200 未收
    { id: "r1", receiptNo: "RCPT-T1", amount: 1000, receivedAt: new Date("2026-07-01"), caseId: "case-1" }
  ],
  reconciliations: [] as any[]
};

function decimalLike(value: number) {
  // Prisma Decimal 在服务里会被 Number()/toFixed() 使用，模拟之
  return {
    value,
    toFixed: (digits: number) => value.toFixed(digits)
  } as any;
}

const mockPrisma = {
  case: {
    findUnique: async ({ where }: any) => (where.id === db.case.id ? { ...db.case } : null),
    update: async ({ where, data }: any) => {
      if (where.id === db.case.id) Object.assign(db.case, data);
      return { ...db.case };
    }
  },
  billing: {
    findMany: async ({ where }: any) =>
      db.billings
        .filter((b) => b.caseId === where.caseId)
        .map((b) => ({ ...b, amount: decimalLike(b.amount) }))
  },
  paymentReceipt: {
    findMany: async ({ where }: any) =>
      db.receipts
        .filter((r) => r.caseId === where.caseId)
        .map((r) => ({ ...r, amount: decimalLike(r.amount) }))
  },
  reconciliation: {
    create: async ({ data }: any) => {
      const row = { id: `rec-${db.reconciliations.length + 1}`, ...data };
      db.reconciliations.push(row);
      return row;
    },
    findFirst: async () => db.reconciliations[0] ?? null,
    findMany: async () => [...db.reconciliations]
  },
  auditLog: { create: async () => ({}) },
  // $transaction 同时支持数组形式与回调形式
  $transaction: async (arg: any) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(mockPrisma);
  }
};

const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, ...rest: any[]) {
  if (request.includes("middlewares/auth.middleware")) return { authMiddleware: mockAuth };
  if (request.includes("utils/prisma")) return { prisma: mockPrisma };
  return originalLoad.call(this, request, ...rest);
};

async function main() {
  const express = (await import("express")).default;
  const caseRouter = (await import("../src/routes/case")).default;
  const { errorHandler } = await import("../src/middlewares/error-handler.middleware");

  const app = express();
  app.use(express.json());
  app.use("/api/cases", caseRouter);
  app.use(errorHandler);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;

  async function closeCase() {
    const res = await fetch(`http://127.0.0.1:${port}/api/cases/case-1/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "closed" })
    });
    const json = await res.json();
    return { status: res.status, json };
  }

  // 1. 对不上：结案被拒
  const rejected = await closeCase();
  assert("对不上: 409 拒绝结案", rejected.status === 409, rejected);
  assert("对不上: 案件仍是开庭", db.case.status === "hearing", db.case.status);
  assert("对不上: 未写结案日期", db.case.closedAt === null);
  assert("对不上: 案件标为待核", db.case.reconciliationStatus === "pending_check", db.case);
  const note: string = db.case.pendingNote ?? "";
  assert("对不上: 待核说明写明未收账单号 BILL-T2", note.includes("BILL-T2"), note);
  assert("对不上: 待核说明写明待收差额 200", note.includes("200"), note);
  const details = rejected.json.details;
  assert(
    "对不上: 返回体列出未收逐笔",
    Array.isArray(details?.unmatchedBillings) &&
      details.unmatchedBillings.some((b: any) => b.billNo === "BILL-T2" && b.amount === "200.00"),
    details
  );
  assert("对不上: 财务无多出流水", (details?.unmatchedReceipts ?? []).length === 0, details);
  assert("对不上: 已落一条对账记录", db.reconciliations.length === 1, db.reconciliations.length);
  assert("对不上: 对账记录状态 pending_check", db.reconciliations[0].status === "pending_check");
  assert("对不上: 对账记录 shortfall=200", String(db.reconciliations[0].shortfallAmount) === "200.00");

  // 2. 财务补齐 200 到账
  db.receipts.push({
    id: "r2",
    receiptNo: "RCPT-T2",
    amount: 200,
    receivedAt: new Date("2026-07-05"),
    caseId: "case-1"
  });

  // 3. 再次结案：对账相符，允许结案
  const accepted = await closeCase();
  assert("对得上: 200 结案成功", accepted.status === 200, accepted);
  assert("对得上: 案件状态 closed", db.case.status === "closed", db.case.status);
  assert("对得上: 写入结案日期", db.case.closedAt !== null);
  assert("对得上: 对账状态 matched", db.case.reconciliationStatus === "matched", db.case);
  assert("对得上: 待核说明已清空", db.case.pendingNote === null);
  assert("对得上: 累计两条对账记录", db.reconciliations.length === 2, db.reconciliations.length);
  const matched = db.reconciliations[1];
  assert("对得上: 第二条记录 matched", matched.status === "matched");
  assert("对得上: 两笔逐笔匹配", matched.matchedCount === 2, matched);
  assert("对得上: matchedPairs 留痕两笔", Array.isArray(matched.matchedPairs) && matched.matchedPairs.length === 2, matched.matchedPairs);
  assert("对得上: 无待收差额", String(matched.shortfallAmount) === "0.00");

  // 4. 非结案状态流转不触发对账（例如改回调查）——不新增对账记录
  const reopen = await fetch(`http://127.0.0.1:${port}/api/cases/case-1/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "investigating" })
  });
  assert("其他状态流转: 200 且不新增对账记录", reopen.status === 200 && db.reconciliations.length === 2, {
    status: reopen.status,
    count: db.reconciliations.length
  });

  server.close();
}

main().then(
  () => process.exit(failures ? 1 : 0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
