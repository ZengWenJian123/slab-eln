"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, Descriptions, Table, Tabs, Tag, message } from "antd";

type SampleDetail = {
  id: number;
  sampleNo: string;
  displayName: string;
  state: "GC" | "GR";
  bareWireDiameterUm: number;
  coatedWireDiameterUm: number;
  isWelded2cm: boolean;
  alloyDesign: { code: string };
  arcBatch: { batchNo: string };
  spinningBatch: { batchNo: string };
  postTreatments: Array<{ id: number; treatmentType: string; status: "SUCCESS" | "FAILED"; treatedAt: string }>;
  testRecords: Array<{ id: number; recordNo: string; testDate: string; keyResults: string }>;
  imageAssets: Array<{ id: number; originalName: string; category: string; createdAt: string; storagePath: string }>;
};

export default function SampleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<SampleDetail | null>(null);

  useEffect(() => {
    apiFetch<SampleDetail>(`/api/samples/${params.id}`)
      .then(setDetail)
      .catch((error) => message.error((error as Error).message));
  }, [params.id]);

  return (
    <AppShell
      title="样品详情"
      extra={
        <Button onClick={() => router.push("/samples")}>返回样品列表</Button>
      }
    >
      <Card title={detail?.displayName ?? "样品详情"}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="样品号">{detail?.sampleNo}</Descriptions.Item>
          <Descriptions.Item label="状态"><Tag>{detail?.state}</Tag></Descriptions.Item>
          <Descriptions.Item label="是否焊接2cm">{detail?.isWelded2cm ? "是" : "否"}</Descriptions.Item>
          <Descriptions.Item label="成分">{detail?.alloyDesign?.code}</Descriptions.Item>
          <Descriptions.Item label="熔炼批次">{detail?.arcBatch?.batchNo}</Descriptions.Item>
          <Descriptions.Item label="拉丝批次">{detail?.spinningBatch?.batchNo}</Descriptions.Item>
          <Descriptions.Item label="裸丝直径">{detail?.bareWireDiameterUm}</Descriptions.Item>
          <Descriptions.Item label="包覆丝直径">{detail?.coatedWireDiameterUm}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        items={[
          {
            key: "post",
            label: "后处理记录",
            children: (
              <Table
                rowKey="id"
                dataSource={detail?.postTreatments ?? []}
                pagination={false}
                columns={[
                  { title: "类型", dataIndex: "treatmentType" },
                  { title: "日期", dataIndex: "treatedAt" },
                  { title: "状态", render: (_, row) => <Tag>{row.status}</Tag> }
                ]}
              />
            )
          },
          {
            key: "test",
            label: "性能测试",
            children: (
              <Table
                rowKey="id"
                dataSource={detail?.testRecords ?? []}
                pagination={false}
                columns={[
                  { title: "记录号", dataIndex: "recordNo" },
                  { title: "日期", dataIndex: "testDate" },
                  { title: "关键结果", dataIndex: "keyResults" }
                ]}
              />
            )
          },
          {
            key: "image",
            label: "图片记录",
            children: (
              <Table
                rowKey="id"
                dataSource={detail?.imageAssets ?? []}
                pagination={false}
                columns={[
                  { title: "文件名", dataIndex: "originalName" },
                  { title: "分类", dataIndex: "category" },
                  { title: "日期", dataIndex: "createdAt" },
                  { title: "路径", dataIndex: "storagePath" }
                ]}
              />
            )
          }
        ]}
      />
    </AppShell>
  );
}

