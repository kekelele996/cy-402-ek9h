import { Router } from "express";
import * as receiptController from "../controllers/receipt.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { auditLogInterceptor } from "../middlewares/audit-log.interceptor";
import { Permissions, permissionGuard } from "../middlewares/role.guard";
import { financeWriteGuard } from "../middlewares/finance-write.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);

// 查看：持有到账流水查看权限即可（律师/助理/财务/管理员都能看对账依据）
router.get("/", Permissions("receipt:read"), permissionGuard, asyncHandler(receiptController.list));

// 登记/更正：先过财务角色校验——律师/助理越权写入在此被明确拒绝并说明权限问题；
// 再校验 receipt:write 权限点。财务到账独立成账，与账单写入完全分开。
router.post(
  "/",
  financeWriteGuard,
  Permissions("receipt:write"),
  permissionGuard,
  auditLogInterceptor("create", "PaymentReceipt"),
  asyncHandler(receiptController.create)
);
router.patch(
  "/:id",
  financeWriteGuard,
  Permissions("receipt:write"),
  permissionGuard,
  auditLogInterceptor("correct", "PaymentReceipt"),
  asyncHandler(receiptController.correct)
);

export default router;
