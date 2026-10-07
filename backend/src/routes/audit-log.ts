import { Router } from "express";
import * as auditLogController from "../controllers/audit-log.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { Permissions, permissionGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);
router.get("/", Permissions("audit:read"), permissionGuard, asyncHandler(auditLogController.list));

export default router;

