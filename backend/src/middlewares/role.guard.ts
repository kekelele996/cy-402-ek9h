import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { RoleName } from "@prisma/client";

export function Roles(...roles: RoleName[]): RequestHandler {
  return (_req, res, next) => {
    res.locals.requiredRoles = roles;
    next();
  };
}

export function Permissions(...permissions: string[]): RequestHandler {
  return (_req, res, next) => {
    res.locals.requiredPermissions = permissions;
    next();
  };
}

export function roleGuard(req: Request, res: Response, next: NextFunction) {
  const requiredRoles = (res.locals.requiredRoles ?? []) as RoleName[];
  if (!requiredRoles.length) {
    return next();
  }
  const userRoles = req.user?.roles ?? [];
  if (userRoles.includes("admin") || requiredRoles.some((role) => userRoles.includes(role))) {
    return next();
  }
  // 说明权限问题：需要哪些角色、当前用户是哪些角色
  return res.status(403).json({
    message: `Role permission denied: requires role [${requiredRoles.join(", ")}]`,
    requiredRoles,
    yourRoles: userRoles
  });
}

export function permissionGuard(req: Request, res: Response, next: NextFunction) {
  const requiredPermissions = (res.locals.requiredPermissions ?? []) as string[];
  if (!requiredPermissions.length) {
    return next();
  }
  const userPermissions = req.user?.permissions ?? [];
  if (req.user?.roles.includes("admin") || requiredPermissions.every((permission) => userPermissions.includes(permission))) {
    return next();
  }
  return res.status(403).json({
    message: `Permission denied: requires permission [${requiredPermissions.join(", ")}]`,
    requiredPermissions
  });
}

