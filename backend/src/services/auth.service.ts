import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RoleName } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http-error";

export async function signUser(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "8h" });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } }
          }
        }
      }
    }
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = await signUser(user.id);
  const roles = user.roles.map((item) => item.role.name);
  const permissions = Array.from(
    new Set(user.roles.flatMap((item) => item.role.permissions.map((rp) => rp.permission.key)))
  );
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      licenseNo: user.licenseNo,
      avatarUrl: user.avatarUrl,
      roles,
      permissions
    }
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: RoleName;
  licenseNo?: string;
  phone?: string;
}) {
  const role = await prisma.role.findUnique({ where: { name: input.role } });
  if (!role) {
    throw new HttpError(400, "Role does not exist");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      primaryRole: input.role,
      passwordHash,
      licenseNo: input.licenseNo,
      phone: input.phone,
      roles: { create: [{ roleId: role.id }] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      primaryRole: true,
      phone: true,
      licenseNo: true
    }
  });
}

