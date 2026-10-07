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
  return res.status(403).json({ message: "Role permission denied" });
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
  return res.status(403).json({ message: "Permission denied" });
}

