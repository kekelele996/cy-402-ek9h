import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { Permissions, permissionGuard } from "../middlewares/role.guard";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(authMiddleware);
router.get("/", Permissions("user:read"), permissionGuard, asyncHandler(userController.list));

export default router;

