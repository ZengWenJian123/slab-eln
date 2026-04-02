"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Space, Table, message } from "antd";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import { StatusTag } from "@/components/common/status-tag";

type ArcBatch = {
  id: number;
  batchNo: string;
  meltingDate: string;
  targetWeight: number;
  ingotWeight: number;
  lossRate: number;
  status: "SUCCESS" | "FAILED";
  alloyDesign: { code: string };
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function ArcBatchListPage() {
  const router = useRouter();
  const [data, setData] = useState<Paged<ArcBatch>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [batchNo, setBatchNo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (batchNo) query.set("batchNo", batchNo);
      const result = await apiFetch<Paged<ArcBatch>>(`/api/arc-batches?${query.toString()}`);
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
      title="熔炼批次"
      extra={
        <Card>
          <Form layout="inline" onFinish={() => load(1, data.pageSize)}>
            <Form.Item label="批次号">
              <Input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => router.push("/arc-batches/new")} type="primary">新建批次</Button>
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
          pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: load }}
          columns={[
            { title: "批次号", dataIndex: "batchNo" },
            { title: "成分", render: (_, row) => row.alloyDesign?.code ?? "-" },
            { title: "熔炼日期", dataIndex: "meltingDate" },
            { title: "目标重量", dataIndex: "targetWeight" },
            { title: "熔后锭子质量", dataIndex: "ingotWeight" },
            { title: "损耗率(%)", render: (_, row) => row.lossRate.toFixed(2) },
            { title: "状态", render: (_, row) => <StatusTag status={row.status} /> }
          ]}
        />
      </Card>
    </AppShell>
  );
}

