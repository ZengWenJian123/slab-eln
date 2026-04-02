"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, DatePicker, Form, InputNumber, Radio, Select, Space, Switch, message } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

type Alloy = { id: number; code: string };
type ArcBatch = { id: number; batchNo: string };

export default function SpinningBatchNewPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [alloys, setAlloys] = useState<Alloy[]>([]);
  const [arcBatches, setArcBatches] = useState<ArcBatch[]>([]);
  const coated = Form.useWatch("coatedWireDiameterUm", form) ?? 0;
  const bare = Form.useWatch("bareWireDiameterUm", form) ?? 0;
  const glassThickness = useMemo(() => (coated - bare) / 2, [coated, bare]);
  const status = Form.useWatch("status", form);

  useEffect(() => {
    apiFetch<{ items: Alloy[] }>("/api/alloys").then((r) => setAlloys(r.items)).catch(() => setAlloys([]));
    apiFetch<{ items: ArcBatch[] }>("/api/arc-batches").then((r) => setArcBatches(r.items)).catch(() => setArcBatches([]));
  }, []);

  return (
    <AppShell title="新建拉丝批次">
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: "SUCCESS", spinningDate: dayjs(), needMagneticTest: false }}
          onFinish={async (values) => {
            try {
              await apiFetch("/api/spinning-batches", {
                method: "POST",
                body: {
                  alloyDesignId: Number(values.alloyDesignId),
                  arcBatchId: Number(values.arcBatchId),
                  spinningDate: values.spinningDate.toISOString(),
                  glassTubeDiameter: Number(values.glassTubeDiameter),
                  feedWeight: Number(values.feedWeight),
                  spinningTemperature: Number(values.spinningTemperature),
                  windingSpeedRpm: Number(values.windingSpeedRpm),
                  coolingWaterTemp: Number(values.coolingWaterTemp),
                  negativePressureKpa: Number(values.negativePressureKpa),
                  coatedWireDiameterUm: Number(values.coatedWireDiameterUm),
                  bareWireDiameterUm: Number(values.bareWireDiameterUm),
                  glassEtchTime: Number(values.glassEtchTime),
                  needMagneticTest: Boolean(values.needMagneticTest),
                  status: values.status,
                  failureReasonId: values.failureReasonId ? Number(values.failureReasonId) : null
                }
              });
              message.success("创建成功");
              router.push("/spinning-batches");
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item name="alloyDesignId" label="成分代号" rules={[{ required: true }]}>
            <Select options={alloys.map((x) => ({ label: x.code, value: x.id }))} />
          </Form.Item>
          <Form.Item name="arcBatchId" label="熔炼批次" rules={[{ required: true }]}>
            <Select options={arcBatches.map((x) => ({ label: x.batchNo, value: x.id }))} />
          </Form.Item>
          <Form.Item name="spinningDate" label="拉丝日期" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="glassTubeDiameter" label="玻璃管直径"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="feedWeight" label="放料质量"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="spinningTemperature" label="拉丝温度"><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="windingSpeedRpm" label="卷绕转速 rpm"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="coolingWaterTemp" label="冷却水温"><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="negativePressureKpa" label="负压 kPa"><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="coatedWireDiameterUm" label="包覆丝直径 um"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="bareWireDiameterUm" label="裸丝直径 um"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="glassEtchTime" label="玻璃腐蚀时间"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Card size="small" title="自动计算">玻璃层厚度：{Number.isFinite(glassThickness) ? glassThickness.toFixed(2) : "-"} um</Card>
          <Form.Item name="needMagneticTest" label="是否进行磁学表征" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="status" label="状态"><Radio.Group options={[{ label: "成功", value: "SUCCESS" }, { label: "失败", value: "FAILED" }]} /></Form.Item>
          {status === "FAILED" && (
            <Form.Item name="failureReasonId" label="失败原因" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          )}
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => router.push("/spinning-batches")}>取消</Button>
          </Space>
        </Form>
      </Card>
    </AppShell>
  );
}

