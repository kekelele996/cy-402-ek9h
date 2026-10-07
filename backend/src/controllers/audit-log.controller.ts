import type { Request, Response } from "express";
import * as auditLogService from "../services/audit-log.service";

export async function list(req: Request, res: Response) {
  const data = await auditLogService.listAuditLogs();
  res.json({ data });
}

