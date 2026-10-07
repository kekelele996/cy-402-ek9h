import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../utils/prisma";

type JwtPayload = {
  sub: string;
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user) {
      return res.status(401).json({ message: "Invalid token user" });
    }

    const roles = user.roles.map((item) => item.role.name);
    const permissions = Array.from(
      new Set(user.roles.flatMap((item) => item.role.permissions.map((rp) => rp.permission.key)))
    );

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

