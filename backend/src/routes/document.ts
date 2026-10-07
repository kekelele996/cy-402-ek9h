import { Router } from "express";
import * as documentController from "../controllers/document.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { auditLogInterceptor } from "../middlewares/audit-log.interceptor";
import { Permissions, permissionGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";
import { upload } from "../utils/upload";

const router = Router();

router.use(authMiddleware);
router.get("/", Permissions("document:read"), permissionGuard, asyncHandler(documentController.list));
router.post(
  "/",
  Permissions("document:write"),
  permissionGuard,
  upload.single("file"),
  auditLogInterceptor("upload", "Document"),
  asyncHandler(documentController.upload)
);
router.delete(
  "/:id",
  Permissions("document:write"),
  permissionGuard,
  auditLogInterceptor("delete", "Document"),
  asyncHandler(documentController.remove)
);

export default router;

