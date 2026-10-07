import type { NextFunction, Request, Response } from "express";

/**
 * 到账流水的登记/更正仅开放给财务角色（admin 视同财务主管放行）。
 * 办案律师/助理越权写入一律拒绝，并明确说明权限问题。
 */
export function financeWriteGuard(req: Request, res: Response, next: NextFunction) {
  const roles = req.user?.roles ?? [];
  if (roles.includes("admin") || roles.includes("finance")) {
    return next();
  }
  return res.status(403).json({
    message: "权限不足：到账流水仅可由财务角色登记和更正，办案律师无权写入财务到账账。"
  });
}
