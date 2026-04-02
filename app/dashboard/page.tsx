"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table } from "antd";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

type DashboardData = {
  alloyCount: number;
  arcCount: number;
  spinCount: number;
  sampleCount: number;
  imageCount: number;
  testCount: number;
  latestSamples: Array<{ id: number; sampleNo: string; displayName: string; createdAt: string }>;
  latestImages: Array<{ id: number; originalName: string; category: string; createdAt: string }>;
  latestTests: Array<{ id: number; recordNo: string; testDate: string; sample?: { sampleNo: string } }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>("/api/dashboard").then(setData).catch(() => setData(null));
  }, []);

  return (
    <AppShell title="首页看板">
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card><Statistic title="成分总数" value={data?.alloyCount ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="熔炼批次" value={data?.arcCount ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="拉丝批次" value={data?.spinCount ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="样品总数" value={data?.sampleCount ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="图片总数" value={data?.imageCount ?? 0} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="测试记录" value={data?.testCount ?? 0} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="最近样品">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data?.latestSamples ?? []}
              columns={[
                { title: "样品号", dataIndex: "sampleNo" },
                { title: "别名", dataIndex: "displayName" }
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近图片">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data?.latestImages ?? []}
              columns={[
                { title: "文件名", dataIndex: "originalName" },
                { title: "分类", dataIndex: "category" }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近测试记录">
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={data?.latestTests ?? []}
          columns={[
            { title: "记录号", dataIndex: "recordNo" },
            { title: "样品", render: (_, row) => row.sample?.sampleNo ?? "-" },
            { title: "测试日期", dataIndex: "testDate" }
          ]}
        />
      </Card>
    </AppShell>
  );
}

