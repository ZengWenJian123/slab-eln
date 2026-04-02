"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  message
} from "antd";

type Item = {
  id: number;
  dictType: string;
  dictLabel: string;
  dictValue: string;
  sortOrder: number;
  status: boolean;
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

const dictTypes = [
  "FAILURE_REASON",
  "USER_NAME",
  "INSTRUMENT",
  "IMAGE_CATEGORY",
  "SAMPLE_STATE",
  "POST_TREATMENT_TYPE",
  "TEST_TYPE"
];

export default function DictionaryPage() {
  const [data, setData] = useState<Paged<Item>>({ items: [], total: 0, page: 1, pageSize: 50 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [form] = Form.useForm();

  const load = async () => {
    try {
      const q = new URLSearchParams({ page: "1", pageSize: "200" });
      if (typeFilter) q.set("dictType", typeFilter);
      const result = await apiFetch<Paged<Item>>(`/api/dictionary?${q.toString()}`);
      setData(result);
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [typeFilter]);

  return (
    <AppShell
      title="数据字典"
      extra={
        <Card>
          <Space>
            <Select
              style={{ width: 220 }}
              placeholder="筛选字典类型"
              allowClear
              value={typeFilter || undefined}
              options={dictTypes.map((x) => ({ label: x, value: x }))}
              onChange={(v) => setTypeFilter(v || "")}
            />
            <Button type="primary" onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
              新增字典项
            </Button>
          </Space>
        </Card>
      }
    >
      <Card>
        <Table
          rowKey="id"
          dataSource={data.items}
          pagination={false}
          columns={[
            { title: "类型", dataIndex: "dictType" },
            { title: "名称", dataIndex: "dictLabel" },
            { title: "值", dataIndex: "dictValue" },
            { title: "排序", dataIndex: "sortOrder" },
            { title: "启用", render: (_, row) => (row.status ? "是" : "否") },
            {
              title: "操作",
              render: (_, row) => (
                <Space>
                  <Button
                    type="link"
                    onClick={() => {
                      setEditing(row);
                      form.setFieldsValue(row);
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
                        await apiFetch(`/api/dictionary/${row.id}`, { method: "DELETE" });
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

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={editing ? "编辑字典项" : "新增字典项"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              if (editing) {
                await apiFetch(`/api/dictionary/${editing.id}`, { method: "PATCH", body: values });
              } else {
                await apiFetch("/api/dictionary", { method: "POST", body: values });
              }
              message.success("保存成功");
              setOpen(false);
              load();
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item name="dictType" label="字典类型" rules={[{ required: true }]}>
            <Select options={dictTypes.map((x) => ({ label: x, value: x }))} />
          </Form.Item>
          <Form.Item name="dictLabel" label="显示名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="dictValue" label="存储值" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sortOrder" label="排序" initialValue={0}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="status" label="启用" valuePropName="checked" initialValue><Switch /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => setOpen(false)}>取消</Button>
          </Space>
        </Form>
      </Modal>
    </AppShell>
  );
}

