import { Router } from "express";
import * as billingController from "../controllers/billing.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { auditLogInterceptor } from "../middlewares/audit-log.interceptor";
import { Permissions, permissionGuard, Roles, roleGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);
router.get("/", Permissions("billing:read"), permissionGuard, asyncHandler(billingController.list));
router.get("/summary", Permissions("billing:read"), permissionGuard, asyncHandler(billingController.summary));
router.post(
  "/",
  Roles("admin", "lawyer"),
  roleGuard,
  Permissions("billing:write"),
  permissionGuard,
  auditLogInterceptor("create", "Billing"),
  asyncHandler(billingController.create)
);
router.patch(
  "/:id/status",
  Roles("admin", "lawyer"),
  roleGuard,
  Permissions("billing:write"),
  permissionGuard,
  auditLogInterceptor("status_change", "Billing"),
  asyncHandler(billingController.updateStatus)
);

export default router;

