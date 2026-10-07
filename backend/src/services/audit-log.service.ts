import { prisma } from "../utils/prisma";

export async function listAuditLogs() {
  return prisma.auditLog.findMany({
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });
}

