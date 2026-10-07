import { prisma } from "../utils/prisma";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      licenseNo: true,
      avatarUrl: true,
      primaryRole: true,
      roles: { include: { role: true } }
    }
  });
}

