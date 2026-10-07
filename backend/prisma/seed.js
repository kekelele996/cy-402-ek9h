const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const permissions = [
  ["case:read", "查看案件"],
  ["case:write", "创建和编辑案件"],
  ["client:read", "查看客户"],
  ["client:write", "创建和编辑客户"],
  ["document:read", "查看文档"],
  ["document:write", "上传和删除文档"],
  ["billing:read", "查看账单"],
  ["billing:write", "创建和更新账单"],
  ["receipt:read", "查看到账流水"],
  ["receipt:write", "登记和更正到账流水（财务专属）"],
  ["reconciliation:run", "执行结案前对账"],
  ["user:read", "查看用户"],
  ["audit:read", "查看审计日志"],
  ["auth:manage", "管理用户和权限"]
];

const rolePermissions = {
  admin: permissions.map(([key]) => key),
  lawyer: [
    "case:read",
    "case:write",
    "client:read",
    "client:write",
    "document:read",
    "document:write",
    "billing:read",
    "billing:write",
    "receipt:read",
    "reconciliation:run",
    "user:read"
  ],
  assistant: [
    "case:read",
    "client:read",
    "document:read",
    "document:write",
    "billing:read",
    "receipt:read",
    "user:read"
  ],
  // 财务室：管到账流水、执行结案对账，可看账单/案件，但不改账单、不建案件
  finance: [
    "case:read",
    "client:read",
    "billing:read",
    "receipt:read",
    "receipt:write",
    "reconciliation:run",
    "user:read"
  ]
};

async function main() {
  const permissionRows = {};
  for (const [key, description] of permissions) {
    permissionRows[key] = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description }
    });
  }

  const roleRows = {};
  const displayNames = { admin: "管理员", lawyer: "律师", assistant: "助理", finance: "财务" };
  for (const role of ["admin", "lawyer", "assistant", "finance"]) {
    roleRows[role] = await prisma.role.upsert({
      where: { name: role },
      update: { displayName: displayNames[role] },
      create: {
        name: role,
        displayName: displayNames[role]
      }
    });
    for (const permissionKey of rolePermissions[role]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleRows[role].id,
            permissionId: permissionRows[permissionKey].id
          }
        },
        update: {},
        create: {
          roleId: roleRows[role].id,
          permissionId: permissionRows[permissionKey].id
        }
      });
    }
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cylawcase.local" },
    update: { name: "林知衡", primaryRole: "admin" },
    create: {
      name: "林知衡",
      primaryRole: "admin",
      licenseNo: "A2024010203",
      email: "admin@cylawcase.local",
      phone: "13800000001",
      avatarUrl: "",
      passwordHash
    }
  });
  const lawyer = await prisma.user.upsert({
    where: { email: "lawyer@cylawcase.local" },
    update: { name: "周明律", primaryRole: "lawyer" },
    create: {
      name: "周明律",
      primaryRole: "lawyer",
      licenseNo: "L2024007788",
      email: "lawyer@cylawcase.local",
      phone: "13800000002",
      avatarUrl: "",
      passwordHash
    }
  });
  const assistant = await prisma.user.upsert({
    where: { email: "assistant@cylawcase.local" },
    update: { name: "许若澜", primaryRole: "assistant" },
    create: {
      name: "许若澜",
      primaryRole: "assistant",
      licenseNo: null,
      email: "assistant@cylawcase.local",
      phone: "13800000003",
      avatarUrl: "",
      passwordHash
    }
  });
  const finance = await prisma.user.upsert({
    where: { email: "finance@cylawcase.local" },
    update: { name: "钱守账", primaryRole: "finance" },
    create: {
      name: "钱守账",
      primaryRole: "finance",
      licenseNo: null,
      email: "finance@cylawcase.local",
      phone: "13800000004",
      avatarUrl: "",
      passwordHash
    }
  });

  for (const [user, role] of [
    [admin, "admin"],
    [lawyer, "lawyer"],
    [assistant, "assistant"],
    [finance, "finance"]
  ]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleRows[role].id } },
      update: {},
      create: { userId: user.id, roleId: roleRows[role].id }
    });
  }

  const clientA = await prisma.client.upsert({
    where: { identityNo: "310101198802021234" },
    update: {},
    create: {
      name: "上海澄石贸易有限公司",
      identityNo: "310101198802021234",
      phone: "021-55210088",
      email: "legal@chengshi.example",
      address: "上海市黄浦区中山东一路 18 号",
      note: "长期商事顾问客户，关注合同履行风险。"
    }
  });
  const clientB = await prisma.client.upsert({
    where: { identityNo: "110105199304045678" },
    update: {},
    create: {
      name: "顾清远",
      identityNo: "110105199304045678",
      phone: "13900001234",
      email: "guqingyuan@example.com",
      address: "北京市朝阳区建国路 88 号",
      note: "劳动争议个案客户。"
    }
  });

  const caseA = await prisma.case.upsert({
    where: { caseNo: "CY-2026-M-001" },
    update: {},
    create: {
      caseNo: "CY-2026-M-001",
      title: "澄石贸易合同货款追偿",
      type: "commercial",
      status: "hearing",
      acceptedAt: new Date("2026-05-02T00:00:00.000Z"),
      summary: "供应商未按补充协议履行付款义务，已进入庭前交换证据阶段。",
      clientId: clientA.id,
      mainLawyerId: lawyer.id,
      collaborators: { create: [{ userId: assistant.id }] }
    }
  });
  const caseB = await prisma.case.upsert({
    where: { caseNo: "CY-2026-L-002" },
    update: {},
    create: {
      caseNo: "CY-2026-L-002",
      title: "顾清远劳动合同解除争议",
      type: "labor",
      status: "investigating",
      acceptedAt: new Date("2026-05-15T00:00:00.000Z"),
      summary: "围绕违法解除、补偿金与未休年假工资进行证据梳理。",
      clientId: clientB.id,
      mainLawyerId: lawyer.id,
      collaborators: { create: [{ userId: assistant.id }] }
    }
  });

  await prisma.document.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      title: "起诉状初稿",
      fileType: "complaint",
      fileUrl: "/uploads/demo-complaint.pdf",
      caseId: caseA.id,
      uploaderId: assistant.id
    }
  });
  await prisma.document.upsert({
    where: { id: "00000000-0000-0000-0000-000000000102" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000102",
      title: "劳动合同扫描件",
      fileType: "evidence",
      fileUrl: "/uploads/demo-contract.pdf",
      caseId: caseB.id,
      uploaderId: assistant.id
    }
  });

  await prisma.billing.upsert({
    where: { billNo: "BILL-2026-0001" },
    update: {},
    create: {
      billNo: "BILL-2026-0001",
      type: "attorney_fee",
      amount: "50000",
      status: "paid",
      caseId: caseA.id,
      clientId: clientA.id,
      invoiceInfo: { title: "上海澄石贸易有限公司", taxNo: "91310000MA1K000001" }
    }
  });
  await prisma.billing.upsert({
    where: { billNo: "BILL-2026-0002" },
    update: {},
    create: {
      billNo: "BILL-2026-0002",
      type: "court_fee",
      amount: "3200",
      status: "pending",
      caseId: caseB.id,
      clientId: clientB.id,
      invoiceInfo: { title: "顾清远" }
    }
  });
  // 案件A追加一笔差旅费账单；案件B追加一笔律师费账单（用于结案对账演示）
  const billA2 = await prisma.billing.upsert({
    where: { billNo: "BILL-2026-0003" },
    update: {},
    create: {
      billNo: "BILL-2026-0003",
      type: "travel_fee",
      amount: "1200",
      status: "invoiced",
      caseId: caseA.id,
      clientId: clientA.id,
      invoiceInfo: { title: "上海澄石贸易有限公司" }
    }
  });
  const billB2 = await prisma.billing.upsert({
    where: { billNo: "BILL-2026-0004" },
    update: {},
    create: {
      billNo: "BILL-2026-0004",
      type: "attorney_fee",
      amount: "6000",
      status: "pending",
      caseId: caseB.id,
      clientId: clientB.id,
      invoiceInfo: { title: "顾清远" }
    }
  });

  // 财务室到账流水（由财务账号登记）
  // 案件A：两笔账单都收到，且财务多出 800 元待核（不许据此改写账单）
  await prisma.paymentReceipt.upsert({
    where: { receiptNo: "RCPT-2026-0001" },
    update: {},
    create: {
      receiptNo: "RCPT-2026-0001",
      amount: "50000",
      receivedAt: new Date("2026-06-10T02:30:00.000Z"),
      payerName: "上海澄石贸易有限公司",
      payChannel: "银行转账",
      remark: "合同货款追偿首期律师费",
      caseId: caseA.id,
      recordedById: finance.id
    }
  });
  await prisma.paymentReceipt.upsert({
    where: { receiptNo: "RCPT-2026-0002" },
    update: {},
    create: {
      receiptNo: "RCPT-2026-0002",
      amount: "1200",
      receivedAt: new Date("2026-07-02T06:00:00.000Z"),
      payerName: "上海澄石贸易有限公司",
      payChannel: "银行转账",
      remark: "差旅费报销到账",
      caseId: caseA.id,
      recordedById: finance.id
    }
  });
  await prisma.paymentReceipt.upsert({
    where: { receiptNo: "RCPT-2026-0003" },
    update: {},
    create: {
      receiptNo: "RCPT-2026-0003",
      amount: "800",
      receivedAt: new Date("2026-07-08T03:15:00.000Z"),
      payerName: "上海澄石贸易有限公司",
      payChannel: "银行转账",
      remark: "客户多汇，待财务核实",
      caseId: caseA.id,
      recordedById: finance.id
    }
  });
  // 案件B：3200 诉讼费已到，6000 律师费未到（账单多出的待收差额）
  await prisma.paymentReceipt.upsert({
    where: { receiptNo: "RCPT-2026-0004" },
    update: {},
    create: {
      receiptNo: "RCPT-2026-0004",
      amount: "3200",
      receivedAt: new Date("2026-06-20T08:45:00.000Z"),
      payerName: "顾清远",
      payChannel: "微信支付",
      remark: "诉讼费",
      caseId: caseB.id,
      recordedById: finance.id
    }
  });

  // 案件C：账单与到账逐笔相符（开庭中，可直接演示“对账通过后结案”）
  const caseC = await prisma.case.upsert({
    where: { caseNo: "CY-2026-C-003" },
    update: {},
    create: {
      caseNo: "CY-2026-C-003",
      title: "澄石贸易常年法律顾问费结算",
      type: "civil",
      status: "hearing",
      acceptedAt: new Date("2026-04-10T00:00:00.000Z"),
      summary: "年度顾问费与差旅两笔费用，财务已全额到账，对账相符后即可结案。",
      clientId: clientA.id,
      mainLawyerId: lawyer.id
    }
  });
  await prisma.billing.upsert({
    where: { billNo: "BILL-2026-0005" },
    update: {},
    create: {
      billNo: "BILL-2026-0005",
      type: "attorney_fee",
      amount: "20000",
      status: "paid",
      caseId: caseC.id,
      clientId: clientA.id,
      invoiceInfo: { title: "上海澄石贸易有限公司" }
    }
  });
  await prisma.billing.upsert({
    where: { billNo: "BILL-2026-0006" },
    update: {},
    create: {
      billNo: "BILL-2026-0006",
      type: "travel_fee",
      amount: "1500",
      status: "paid",
      caseId: caseC.id,
      clientId: clientA.id,
      invoiceInfo: { title: "上海澄石贸易有限公司" }
    }
  });
  await prisma.paymentReceipt.upsert({
    where: { receiptNo: "RCPT-2026-0005" },
    update: {},
    create: {
      receiptNo: "RCPT-2026-0005",
      amount: "20000",
      receivedAt: new Date("2026-05-11T01:20:00.000Z"),
      payerName: "上海澄石贸易有限公司",
      payChannel: "银行转账",
      remark: "年度法律顾问费",
      caseId: caseC.id,
      recordedById: finance.id
    }
  });
  await prisma.paymentReceipt.upsert({
    where: { receiptNo: "RCPT-2026-0006" },
    update: {},
    create: {
      receiptNo: "RCPT-2026-0006",
      amount: "1500",
      receivedAt: new Date("2026-05-12T05:40:00.000Z"),
      payerName: "上海澄石贸易有限公司",
      payChannel: "银行转账",
      remark: "差旅费到账",
      caseId: caseC.id,
      recordedById: finance.id
    }
  });

  // 旧案件/新案件默认均为“未对账”，需在结案前显式执行对账，不预置对账结果
  void billA2;
  void billB2;
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

