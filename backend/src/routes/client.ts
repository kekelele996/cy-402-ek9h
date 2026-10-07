import { Router } from "express";
import * as clientController from "../controllers/client.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { auditLogInterceptor } from "../middlewares/audit-log.interceptor";
import { Permissions, permissionGuard, Roles, roleGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);
router.get("/", Permissions("client:read"), permissionGuard, asyncHandler(clientController.list));
router.get("/:id", Permissions("client:read"), permissionGuard, asyncHandler(clientController.detail));
router.post(
  "/",
  Roles("admin", "lawyer"),
  roleGuard,
  Permissions("client:write"),
  permissionGuard,
  auditLogInterceptor("create", "Client"),
  asyncHandler(clientController.create)
);
router.put(
  "/:id",
  Roles("admin", "lawyer"),
  roleGuard,
  Permissions("client:write"),
  permissionGuard,
  auditLogInterceptor("update", "Client"),
  asyncHandler(clientController.update)
);

export default router;

