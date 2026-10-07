import type { RoleName } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

