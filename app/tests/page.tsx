"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Space, Table, Tag, message } from "antd";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

type TestRecord = {
  id: number;
  recordNo: string;
  testDate: string;
  operatorName: string;
  instrumentName: string;
  status: "SUCCESS" | "FAILED";
  sample: { sampleNo: string };
  rawFileAttachment?: { originalName: string };
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function TestListPage() {
  const router = useRouter();
  const [data, setData] = useState<Paged<TestRecord>>({ items: [], total: 0, page: 1, pageSize: 10 });

  const load = async (page = 1, pageSize = 10) => {
    try {
      const result = await apiFetch<Paged<TestRecord>>(`/api/tests?page=${page}&pageSize=${pageSize}`);
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
      title="性能测试"
      extra={
        <Card>
          <Form layout="inline">
            <Space>
              <Button type="primary" onClick={() => router.push("/tests/new")}>新建测试记录</Button>
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
            { title: "记录号", dataIndex: "recordNo" },
            { title: "样品号", render: (_, row) => row.sample?.sampleNo ?? "-" },
            { title: "测试日期", dataIndex: "testDate" },
            { title: "测试人员", dataIndex: "operatorName" },
            { title: "测试设备", dataIndex: "instrumentName" },
            { title: "原始文件", render: (_, row) => row.rawFileAttachment?.originalName ?? "-" },
            { title: "状态", render: (_, row) => <Tag>{row.status}</Tag> }
          ]}
        />
      </Card>
    </AppShell>
  );
}

