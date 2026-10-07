import { Router } from "express";
import * as caseController from "../controllers/case.controller";
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

export default router;

