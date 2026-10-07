import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { auditLogInterceptor } from "../middlewares/audit-log.interceptor";
import { Permissions, permissionGuard, Roles, roleGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);
router.get("/", Permissions("payment:read"), permissionGuard, asyncHandler(paymentController.list));
// 到账流水只允许财务角色登记；律师等其他角色写入会被 403 拒绝并说明权限要求
router.post(
  "/",
  Roles("finance"),
  roleGuard,
  Permissions("payment:write"),
  permissionGuard,
  auditLogInterceptor("create", "Payment"),
  asyncHandler(paymentController.create)
);
// 更正到账流水同样仅财务角色
router.patch(
  "/:id",
  Roles("finance"),
  roleGuard,
  Permissions("payment:write"),
  permissionGuard,
  auditLogInterceptor("correct", "Payment"),
  asyncHandler(paymentController.correct)
);
// 作废到账流水（软删除）仅财务角色
router.delete(
  "/:id",
  Roles("finance"),
  roleGuard,
  Permissions("payment:write"),
  permissionGuard,
  auditLogInterceptor("void", "Payment"),
  asyncHandler(paymentController.voidPayment)
);

export default router;
