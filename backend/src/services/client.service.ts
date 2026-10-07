import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";

export async function listClients(search?: string) {
  return prisma.client.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { identityNo: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } }
          ]
        }
      : undefined,
    include: {
      cases: {
        include: {
          mainLawyer: { select: { id: true, name: true } },
          client: true
        },
        orderBy: { acceptedAt: "desc" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      cases: {
        include: {
          mainLawyer: { select: { id: true, name: true } },
          client: true,
          documents: true,
          billings: true
        },
        orderBy: { acceptedAt: "desc" }
      },
      billings: true
    }
  });
}

export async function createClient(data: Prisma.ClientCreateInput) {
  return prisma.client.create({ data });
}

export async function updateClient(id: string, data: Prisma.ClientUpdateInput) {
  return prisma.client.update({ where: { id }, data });
}

