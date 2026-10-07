/* HTTP 层权限验证：到账流水只允许财务角色写入；律师越权必须被拒绝并说明权限问题。 */
import Module from "node:module";
import type { Server } from "node:http";

let failures = 0;
function assert(name: string, cond: boolean, extra?: unknown) {
  if (cond) console.log(`PASS ${name}`);
  else {
    failures += 1;
    console.error(`FAIL ${name}`, extra ?? "");
  }
}

// 由测试动态指定当前登录用户的角色/权限
let currentUser: { roles: string[]; permissions: string[] } | null = null;

const mockAuth = (req: any, _res: any, next: any) => {
  req.user = currentUser ? { id: "u1", email: "t@t", name: "t", ...currentUser } : undefined;
  next();
};
const mockPrisma = {
  case: { findUnique: async () => ({ id: "case-1" }) },
  paymentReceipt: {
    create: async (args: any) => ({ id: "r1", ...args.data }),
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
    findUnique: async () => ({ id: "r1", receiptNo: "RCPT-1" }),
    findMany: async () => []
  },
  auditLog: { create: async () => ({}) }
};

const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, ...rest: any[]) {
  if (request.includes("middlewares/auth.middleware")) return { authMiddleware: mockAuth };
  if (request.includes("utils/prisma")) return { prisma: mockPrisma };
  return originalLoad.call(this, request, ...rest);
};

async function main() {
  const express = (await import("express")).default;
  const receiptRouter = (await import("../src/routes/receipt")).default;
  const { errorHandler } = await import("../src/middlewares/error-handler.middleware");

  const app = express();
  app.use(express.json());
  app.use("/api/receipts", receiptRouter);
  app.use(errorHandler);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;

  async function call(method: "POST" | "PATCH", path: string, user: typeof currentUser, body?: unknown) {
    currentUser = user;
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {})
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* ignore */
    }
    return { status: res.status, json };
  }

  const validBody = {
    receiptNo: "RCPT-T1",
    amount: "100.00",
    receivedAt: "2026-07-01"
  };

  // 1. 律师：角色不符 -> 403 且说明权限问题
  {
    const r = await call(
      "POST",
      "/api/receipts",
      { roles: ["lawyer"], permissions: ["billing:write", "receipt:read"] },
      validBody
    );
    assert("律师登记流水: 403", r.status === 403, r);
    assert(
      "律师登记流水: 明确提示仅财务可登记",
      typeof r.json?.message === "string" && r.json.message.includes("财务角色"),
      r.json
    );
  }

  // 2. 助理 -> 403
  {
    const r = await call("POST", "/api/receipts", { roles: ["assistant"], permissions: ["receipt:read"] }, validBody);
    assert("助理登记流水: 403", r.status === 403, r);
  }

  // 3. 财务：角色正确 + 有 receipt:write -> 201
  {
    const r = await call(
      "POST",
      "/api/receipts",
      { roles: ["finance"], permissions: ["receipt:read", "receipt:write"] },
      validBody
    );
    assert("财务登记流水: 201", r.status === 201, r);
  }

  // 4. 管理员：视同财务主管放行 -> 201
  {
    const r = await call(
      "POST",
      "/api/receipts",
      { roles: ["admin"], permissions: ["receipt:write"] },
      validBody
    );
    assert("管理员登记流水: 201", r.status === 201, r);
  }

  // 5. 律师更正流水 -> 403
  {
    const r = await call(
      "PATCH",
      "/api/receipts/r1",
      { roles: ["lawyer"], permissions: ["billing:write"] },
      { amount: "99.00" }
    );
    assert("律师更正流水: 403", r.status === 403, r);
    assert("律师更正流水: 提示仅财务可更正", r.json?.message?.includes("财务角色"), r.json);
  }

  // 6. 财务更正流水 -> 200
  {
    const r = await call(
      "PATCH",
      "/api/receipts/r1",
      { roles: ["finance"], permissions: ["receipt:write"] },
      { amount: "99.00" }
    );
    assert("财务更正流水: 200", r.status === 200, r);
  }

  // 7. 财务但缺权限点 -> 403
  {
    const r = await call(
      "POST",
      "/api/receipts",
      { roles: ["finance"], permissions: ["receipt:read"] },
      validBody
    );
    assert("财务缺 receipt:write: 403", r.status === 403, r);
  }

  // 8. 律师只读列表（有 receipt:read）-> 200
  {
    currentUser = { roles: ["lawyer"], permissions: ["receipt:read"] };
    const res = await fetch(`http://127.0.0.1:${port}/api/receipts`);
    assert("律师可查看流水列表: 200", res.status === 200, res.status);
  }

  server.close();
}

main().then(
  () => process.exit(failures ? 1 : 0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
