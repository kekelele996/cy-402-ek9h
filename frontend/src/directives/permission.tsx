import type { PropsWithChildren, ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import type { PermissionKey } from "../types/permissions";

export function PermissionGate({
  permission,
  fallback = null,
  children
}: PropsWithChildren<{ permission: PermissionKey; fallback?: ReactNode }>) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

export function vPermission(permission: PermissionKey) {
  return {
    "data-permission": permission
  };
}

