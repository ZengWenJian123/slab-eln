"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  message
} from "antd";

type User = {
  id: number;
  username: string;
  realName: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  status: boolean;
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function UsersPage() {
  const [data, setData] = useState<Paged<User>>({ items: [], total: 0, page: 1, pageSize: 50 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      const result = await apiFetch<Paged<User>>("/api/users?page=1&pageSize=200");
      setData(result);
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell
      title="用户管理"
      extra={
        <Card>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            新增用户
          </Button>
        </Card>
      }
    >
      <Card>
        <Table
          rowKey="id"
          dataSource={data.items}
          pagination={false}
          columns={[
            { title: "用户名", dataIndex: "username" },
            { title: "真实姓名", dataIndex: "realName" },
            { title: "角色", dataIndex: "role" },
            { title: "状态", render: (_, row) => (row.status ? "启用" : "禁用") },
            {
              title: "操作",
              render: (_, row) => (
                <Space>
                  <Button
                    type="link"
                    onClick={() => {
                      setEditing(row);
                      form.setFieldsValue({
                        ...row,
                        password: ""
                      });
                      setOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    type="link"
                    danger
                    onClick={async () => {
                      try {
                        await apiFetch(`/api/users/${row.id}`, { method: "DELETE" });
                        message.success("删除成功");
                        load();
                      } catch (error) {
                        message.error((error as Error).message);
                      }
                    }}
                  >
                    删除
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={editing ? "编辑用户" : "新增用户"}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: "OPERATOR", status: true }}
          onFinish={async (values) => {
            try {
              if (editing) {
                await apiFetch(`/api/users/${editing.id}`, { method: "PATCH", body: values });
              } else {
                await apiFetch("/api/users", { method: "POST", body: values });
              }
              message.success("保存成功");
              setOpen(false);
              load();
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={[{ label: "管理员", value: "ADMIN" }, { label: "实验员", value: "OPERATOR" }, { label: "只读", value: "VIEWER" }]} />
          </Form.Item>
          <Form.Item name="status" label="启用" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="password" label={editing ? "重置密码(可选)" : "密码"} rules={editing ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => setOpen(false)}>取消</Button>
          </Space>
        </Form>
      </Modal>
    </AppShell>
  );
}

