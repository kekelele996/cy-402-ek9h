import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { auditLogInterceptor } from "../middlewares/audit-log.interceptor";
import { Permissions, permissionGuard, Roles, roleGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/login", asyncHandler(authController.login));
router.get("/me", authMiddleware, asyncHandler(authController.me));
router.post(
  "/register",
  authMiddleware,
  Roles("admin"),
  roleGuard,
  Permissions("auth:manage"),
  permissionGuard,
  auditLogInterceptor("create", "User"),
  asyncHandler(authController.register)
);

export default router;

