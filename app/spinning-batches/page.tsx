"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Space, Table, message } from "antd";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import { StatusTag } from "@/components/common/status-tag";

type SpinBatch = {
  id: number;
  batchNo: string;
  spinningDate: string;
  bareWireDiameterUm: number;
  coatedWireDiameterUm: number;
  glassThicknessUm: number;
  status: "SUCCESS" | "FAILED";
  alloyDesign: { code: string };
  arcBatch: { batchNo: string };
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function SpinningBatchListPage() {
  const router = useRouter();
  const [data, setData] = useState<Paged<SpinBatch>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [batchNo, setBatchNo] = useState("");

  const load = async (page = 1, pageSize = 10) => {
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (batchNo) query.set("batchNo", batchNo);
      const result = await apiFetch<Paged<SpinBatch>>(`/api/spinning-batches?${query.toString()}`);
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
      title="拉丝批次"
      extra={
        <Card>
          <Form layout="inline" onFinish={() => load(1, data.pageSize)}>
            <Form.Item label="批次号">
              <Input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button type="primary" onClick={() => router.push("/spinning-batches/new")}>新建批次</Button>
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
            { title: "批次号", dataIndex: "batchNo" },
            { title: "熔炼批次", render: (_, row) => row.arcBatch?.batchNo ?? "-" },
            { title: "成分", render: (_, row) => row.alloyDesign?.code ?? "-" },
            { title: "日期", dataIndex: "spinningDate" },
            { title: "裸丝直径(um)", dataIndex: "bareWireDiameterUm" },
            { title: "包覆直径(um)", dataIndex: "coatedWireDiameterUm" },
            { title: "玻璃层厚度(um)", dataIndex: "glassThicknessUm" },
            { title: "状态", render: (_, row) => <StatusTag status={row.status} /> }
          ]}
        />
      </Card>
    </AppShell>
  );
}

