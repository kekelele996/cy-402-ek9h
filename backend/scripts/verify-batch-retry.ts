/* 用可替换实现的 mock 验证：账单批量写库失败只重试本批，且事务范围不含财务到账流水。 */
import Module from "node:module";

let failures = 0;
function assert(name: string, cond: boolean, extra?: unknown) {
  if (cond) console.log(`PASS ${name}`);
  else {
    failures += 1;
    console.error(`FAIL ${name}`, extra ?? "");
  }
}

const state = {
  attempts: 0,
  receiptTouches: 0,
  created: [] as any[],
  failTimes: 0,
  code: "P1017"
};
function reset(partial: Partial<typeof state>) {
  state.attempts = 0;
  state.receiptTouches = 0;
  state.created = [];
  Object.assign(state, partial);
}

const mockPrisma = {
  $transaction: async (cb: any) => {
    state.attempts += 1;
    if (state.attempts <= state.failTimes) {
      const error = new Error("db write failed") as any;
      error.code = state.code;
      throw error;
    }
    // 事务回调里只给 billing 句柄，拿不到 paymentReceipt：
    // 账单批次回滚/重试在物理上不可能影响财务到账流水。
    return cb({
      billing: {
        createMany: async ({ data }: any) => {
          state.created.push(...data);
          return { count: data.length };
        }
      }
    });
  },
  billing: {
    findMany: async () => state.created.map((item, index) => ({ ...item, id: `id-${index}` }))
  },
  paymentReceipt: {
    create: async () => {
      state.receiptTouches += 1;
      return {};
    }
  }
};

const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, ...rest: any[]) {
  if (request.includes("utils/prisma")) return { prisma: mockPrisma };
  return originalLoad.call(this, request, ...rest);
};

async function main() {
  const { createBillingBatch } = await import("../src/services/billing.service");

  const items = [
    { billNo: "BILL-X1", type: "attorney_fee", amount: "100.00", caseId: "c", clientId: "cl" },
    { billNo: "BILL-X2", type: "court_fee", amount: "200.00", caseId: "c", clientId: "cl" }
  ];

  // 1. 瞬时错误重试到成功，只重试本批
  reset({ failTimes: 2, code: "P1017" });
  const rows = await createBillingBatch(items as any, 3);
  assert("瞬时故障: 共尝试3次后成功", state.attempts === 3, state.attempts);
  assert("瞬时故障: 本批两笔最终落库", rows.length === 2, rows);
  assert("重试期间财务到账流水零接触", state.receiptTouches === 0, state.receiptTouches);

  // 2. 永久性错误（唯一键冲突）不重试，立即失败
  reset({ failTimes: 99, code: "P2002" });
  let code = "";
  try {
    await createBillingBatch(items as any, 3);
  } catch (error) {
    code = (error as { code?: string }).code ?? "";
  }
  assert("永久错误 P2002: 立即抛出、不重试", code === "P2002" && state.attempts === 1, {
    code,
    attempts: state.attempts
  });
  assert("永久错误: 财务到账流水仍零接触", state.receiptTouches === 0, state.receiptTouches);

  // 3. 超过最大重试次数仍失败时抛出
  reset({ failTimes: 10, code: "P1017" });
  let exhausted = false;
  try {
    await createBillingBatch(items as any, 2);
  } catch {
    exhausted = true;
  }
  assert("重试用尽: 恰好尝试2次后抛出", exhausted && state.attempts === 2, state.attempts);

}

main().then(() => process.exit(failures ? 1 : 0));
