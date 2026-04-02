"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, DatePicker, Form, InputNumber, Select, Space, Radio, message } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

type AlloyOption = { id: number; code: string };

export default function ArcBatchNewPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [alloys, setAlloys] = useState<AlloyOption[]>([]);
  const targetWeight = Form.useWatch("targetWeight", form) ?? 0;
  const ingotWeight = Form.useWatch("ingotWeight", form) ?? 0;
  const lossRate = useMemo(
    () => (targetWeight > 0 ? ((targetWeight - ingotWeight) / targetWeight) * 100 : 0),
    [targetWeight, ingotWeight]
  );
  const status = Form.useWatch("status", form);

  useEffect(() => {
    apiFetch<{ items: AlloyOption[]; total: number; page: number; pageSize: number }>("/api/alloys")
      .then((res) => setAlloys(res.items))
      .catch(() => setAlloys([]));
  }, []);

  return (
    <AppShell title="新建熔炼批次">
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: "SUCCESS", meltingDate: dayjs() }}
          onFinish={async (values) => {
            try {
              await apiFetch("/api/arc-batches", {
                method: "POST",
                body: {
                  alloyDesignId: Number(values.alloyDesignId),
                  meltingDate: values.meltingDate.toISOString(),
                  targetWeight: Number(values.targetWeight),
                  ingotWeight: Number(values.ingotWeight),
                  meltingPoint: values.meltingPoint ? Number(values.meltingPoint) : null,
                  status: values.status,
                  failureReasonId: values.failureReasonId ? Number(values.failureReasonId) : null
                }
              });
              message.success("创建成功");
              router.push("/arc-batches");
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item name="alloyDesignId" label="成分代号" rules={[{ required: true }]}>
            <Select options={alloys.map((x) => ({ label: x.code, value: x.id }))} />
          </Form.Item>
          <Form.Item name="meltingDate" label="熔炼日期" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="targetWeight" label="目标熔炼重量(g)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="ingotWeight" label="熔后锭子质量(g)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="meltingPoint" label="熔点(可选)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Card size="small" title="自动计算">
            损耗率：{lossRate.toFixed(2)}%
          </Card>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Radio.Group options={[{ label: "成功", value: "SUCCESS" }, { label: "失败", value: "FAILED" }]} />
          </Form.Item>
          {status === "FAILED" && (
            <Form.Item name="failureReasonId" label="失败原因" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          )}
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => router.push("/arc-batches")}>取消</Button>
          </Space>
        </Form>
      </Card>
    </AppShell>
  );
}

