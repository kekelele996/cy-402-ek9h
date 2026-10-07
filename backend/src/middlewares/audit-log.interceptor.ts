import type { RequestHandler } from "express";
import { prisma } from "../utils/prisma";

export function auditLogInterceptor(action: string, targetEntity: string): RequestHandler {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (req.user && res.statusCode < 400 && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const responseData = typeof body === "object" && body !== null && "data" in body ? (body as { data?: { id?: string } }).data : undefined;
        void prisma.auditLog.create({
          data: {
            actorId: req.user.id,
            action,
            targetEntity,
            targetId: req.params.id ?? responseData?.id ?? null,
            changes: {
              params: req.params,
              query: req.query,
              body: req.body
            },
            ip: req.ip
          }
        });
      }
      return originalJson(body);
    };
    next();
  };
}

