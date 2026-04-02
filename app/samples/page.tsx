"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Space, Table, Tag, message } from "antd";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

type Sample = {
  id: number;
  sampleNo: string;
  displayName: string;
  state: "GC" | "GR";
  bareWireDiameterUm: number;
  isWelded2cm: boolean;
  alloyDesign: { code: string };
  arcBatch: { batchNo: string };
  spinningBatch: { batchNo: string };
  createdAt: string;
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function SampleListPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState<Paged<Sample>>({ items: [], total: 0, page: 1, pageSize: 10 });

  const load = async (page = 1, pageSize = 10) => {
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) query.set("keyword", keyword);
      const result = await apiFetch<Paged<Sample>>(`/api/samples?${query.toString()}`);
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
      title="样品管理"
      extra={
        <Card>
          <Form layout="inline" onFinish={() => load(1, data.pageSize)}>
            <Form.Item label="样品号/别名">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button type="primary" onClick={() => router.push("/samples/new")}>新建样品</Button>
            </Space>
          </Form>
        </Card>
      }
    >
      <Card>
        <Table
          rowKey="id"
          dataSource={data.items}
          pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: load }}
          columns={[
            { title: "样品号", dataIndex: "sampleNo" },
            { title: "显示别名", dataIndex: "displayName" },
            { title: "成分", render: (_, row) => row.alloyDesign?.code ?? "-" },
            { title: "熔炼", render: (_, row) => row.arcBatch?.batchNo ?? "-" },
            { title: "拉丝", render: (_, row) => row.spinningBatch?.batchNo ?? "-" },
            { title: "状态", render: (_, row) => <Tag>{row.state}</Tag> },
            { title: "裸丝直径", dataIndex: "bareWireDiameterUm" },
            { title: "是否焊接2cm", render: (_, row) => (row.isWelded2cm ? "是" : "否") },
            {
              title: "操作",
              render: (_, row) => (
                <Button type="link" onClick={() => router.push(`/samples/${row.id}`)}>
                  查看
                </Button>
              )
            }
          ]}
        />
      </Card>
    </AppShell>
  );
}

