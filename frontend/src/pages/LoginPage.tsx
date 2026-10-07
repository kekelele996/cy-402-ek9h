import { Button, Form, Input, Typography, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  async function submit(values: { email: string; password: string }) {
    try {
      await login(values.email, values.password);
      navigate("/cases");
    } catch {
      message.error("登录失败，请检查邮箱或密码");
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <Typography.Title level={2}>承岳案件管理</Typography.Title>
        <Typography.Paragraph type="secondary">
          演示账号：admin@cylawcase.local / Password123!
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={submit} initialValues={{ email: "admin@cylawcase.local", password: "Password123!" }}>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: "email" }]}>
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form>
      </section>
      <section className="login-brief">
        <Typography.Title style={{ color: "#fafaf7", fontSize: 44 }}>案件线索到结算闭环</Typography.Title>
        <Typography.Paragraph style={{ color: "#e9ded1", maxWidth: 560 }}>
          客户、案件、文档、账单和审计日志在同一个工作台里流转，适合律所内部的高频检索、协同和风险留痕。
        </Typography.Paragraph>
      </section>
    </main>
  );
}

