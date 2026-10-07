import { Alert, Spin } from "antd";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { PermissionKey } from "../types/permissions";

export function ProtectedRoute({ permission, children }: { permission?: PermissionKey; children: JSX.Element }) {
  const { token, currentUser, hasPermission } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!currentUser) {
    return <Spin fullscreen tip="正在校验登录状态" />;
  }
  if (permission && !hasPermission(permission)) {
    return <Alert type="error" message="无权访问" description="当前角色没有访问该页面的权限。" showIcon />;
  }
  return children;
}

