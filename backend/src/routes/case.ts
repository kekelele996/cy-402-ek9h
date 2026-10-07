import { Router } from "express";
import * as caseController from "../controllers/case.controller";
import * as reconciliationController from "../controllers/reconciliation.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { auditLogInterceptor } from "../middlewares/audit-log.interceptor";
import { Permissions, permissionGuard, Roles, roleGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);
router.get("/", Permissions("case:read"), permissionGuard, asyncHandler(caseController.list));
router.get("/:id", Permissions("case:read"), permissionGuard, asyncHandler(caseController.detail));
router.post(
  "/",
  Roles("admin", "lawyer"),
  roleGuard,
  Permissions("case:write"),
  permissionGuard,
  auditLogInterceptor("create", "Case"),
  asyncHandler(caseController.create)
);
router.patch(
  "/:id/status",
  Roles("admin", "lawyer"),
  roleGuard,
  Permissions("case:write"),
  permissionGuard,
  auditLogInterceptor("status_change", "Case"),
  asyncHandler(caseController.updateStatus)
);
router.patch(
  "/:id/assign",
  Roles("admin", "lawyer"),
  roleGuard,
  Permissions("case:write"),
  permissionGuard,
  auditLogInterceptor("assign_lawyers", "Case"),
  asyncHandler(caseController.assignLawyers)
);

// 结案前对账：查看/试算持有案件查看权限即可，正式对账需要案件编辑权限
router.get(
  "/:id/reconciliation",
  Permissions("case:read"),
  permissionGuard,
  asyncHandler(reconciliationController.preview)
);
router.post(
  "/:id/reconciliation",
  Roles("admin", "lawyer", "finance"),
  roleGuard,
  Permissions("reconciliation:run"),
  permissionGuard,
  auditLogInterceptor("reconcile", "Reconciliation"),
  asyncHandler(reconciliationController.run)
);
router.get(
  "/:id/reconciliation/history",
  Permissions("case:read"),
  permissionGuard,
  asyncHandler(reconciliationController.history)
);

export default router;

