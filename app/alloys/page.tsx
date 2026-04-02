"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Space, Table, message } from "antd";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

type Alloy = {
  id: number;
  code: string;
  compositionJson: Array<{ element: string; percent: number }>;
  creator: { realName: string };
  createdAt: string;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function AlloyListPage() {
  const router = useRouter();
  const [data, setData] = useState<Paged<Alloy>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (code) query.set("code", code);
      const result = await apiFetch<Paged<Alloy>>(`/api/alloys?${query.toString()}`);
      setData(result);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell
      title="成分设计"
      extra={
        <Card>
          <Form layout="inline" onFinish={() => load(1, data.pageSize)}>
            <Form.Item label="成分代号">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="H1/H2..." />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { setCode(""); load(1, data.pageSize); }}>重置</Button>
              <Button type="primary" onClick={() => router.push("/alloys/new")}>新建成分</Button>
            </Space>
          </Form>
        </Card>
      }
    >
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data.items}
          pagination={{
            current: data.page,
            total: data.total,
            pageSize: data.pageSize,
            onChange: load
          }}
          columns={[
            { title: "成分代号", dataIndex: "code" },
            {
              title: "元素组成",
              render: (_, row) =>
                row.compositionJson.map((x) => `${x.element}${x.percent}`).join(" ")
            },
            { title: "创建人", render: (_, row) => row.creator?.realName ?? "-" },
            { title: "创建时间", dataIndex: "createdAt" }
          ]}
        />
      </Card>
    </AppShell>
  );
}

