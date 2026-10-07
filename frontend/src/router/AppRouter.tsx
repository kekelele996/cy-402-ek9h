import {
  AuditOutlined,
  BankOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  PayCircleOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { BillingPage } from "../pages/BillingPage";
import { CaseDetailPage } from "../pages/CaseDetailPage";
import { CasesPage } from "../pages/CasesPage";
import { ClientsPage } from "../pages/ClientsPage";
import { DocumentsPage } from "../pages/DocumentsPage";
import { LoginPage } from "../pages/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";

const { Header, Sider, Content } = Layout;

function AppLayout({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, hasPermission } = useAuth();

  const items = [
    { key: "/cases", icon: <FolderOpenOutlined />, label: "案件列表" },
    { key: "/clients", icon: <TeamOutlined />, label: "客户管理" },
    { key: "/billing", icon: <PayCircleOutlined />, label: "费用中心" },
    { key: "/documents", icon: <FileTextOutlined />, label: "文档中心" },
    hasPermission("audit:read") ? { key: "/audit-logs", icon: <AuditOutlined />, label: "审计日志" } : null
  ].filter(Boolean);

  return (
    <Layout className="app-shell">
      <Sider width={232} className="app-sider" breakpoint="lg" collapsedWidth={0}>
        <div className="brand-block">
          <Space align="center">
            <BankOutlined style={{ color: "#d5a15f", fontSize: 22 }} />
            <div>
              <p className="brand-name">承岳 LawOps</p>
              <div className="brand-meta">案件、客户、文档、费用</div>
            </div>
          </Space>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.startsWith("/cases/") ? "/cases" : location.pathname]}
          items={items}
          onClick={(event) => navigate(event.key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div>
            <Typography.Text strong>律师案件管理系统</Typography.Text>
            <div className="brand-meta">面向律所的全流程案件工作台</div>
          </div>
          <Space>
            <Avatar>{currentUser?.name?.slice(0, 1)}</Avatar>
            <span>{currentUser?.name}</span>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
}

function RoutedApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/cases" replace />} />
      <Route
        path="/cases"
        element={
          <ProtectedRoute permission="case:read">
            <AppLayout>
              <CasesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute permission="case:read">
            <AppLayout>
              <CaseDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute permission="client:read">
            <AppLayout>
              <ClientsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute permission="billing:read">
            <AppLayout>
              <BillingPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute permission="document:read">
            <AppLayout>
              <DocumentsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute permission="audit:read">
            <AppLayout>
              <AuditLogsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <RoutedApp />
    </BrowserRouter>
  );
}

