"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Space, Table, Tag, message } from "antd";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

type RecordItem = {
  id: number;
  treatmentType: string;
  status: "SUCCESS" | "FAILED";
  treatedAt: string;
  sample: { sampleNo: string };
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function PostTreatmentListPage() {
  const router = useRouter();
  const [data, setData] = useState<Paged<RecordItem>>({ items: [], total: 0, page: 1, pageSize: 10 });

  const load = async (page = 1, pageSize = 10) => {
    try {
      const result = await apiFetch<Paged<RecordItem>>(`/api/post-treatments?page=${page}&pageSize=${pageSize}`);
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
      title="后处理记录"
      extra={
        <Card>
          <Form layout="inline">
            <Space>
              <Button type="primary" onClick={() => router.push("/post-treatments/new")}>新建记录</Button>
            </Space>
          </Form>
        </Card>
      }
    >
      <Card>
        <Table
          rowKey="id"
          dataSource={data.items}
          pagination={{ current: data.page, total: data.total, pageSize: data.pageSize, onChange: load }}
          columns={[
            { title: "样品号", render: (_, row) => row.sample?.sampleNo ?? "-" },
            { title: "后处理类型", dataIndex: "treatmentType" },
            { title: "日期", dataIndex: "treatedAt" },
            { title: "状态", render: (_, row) => <Tag>{row.status}</Tag> }
          ]}
        />
      </Card>
    </AppShell>
  );
}

