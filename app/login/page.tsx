"use client";

import { Card, Form, Input, Button, Typography, message } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          SLAB-ELN
        </Typography.Title>
        <Form
          layout="vertical"
          onFinish={async (values) => {
            const result = await signIn("credentials", {
              username: values.username,
              password: values.password,
              redirect: false
            });
            if (result?.error) {
              message.error("账号或密码错误");
              return;
            }
            router.push("/dashboard");
          }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
