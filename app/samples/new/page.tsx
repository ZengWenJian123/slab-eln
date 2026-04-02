"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, Form, Input, InputNumber, Radio, Select, Space, Switch, message } from "antd";
import { useRouter } from "next/navigation";

type Option = { id: number; code?: string; batchNo?: string };

export default function SampleNewPage() {
  const router = useRouter();
  const [alloys, setAlloys] = useState<Option[]>([]);
  const [arcs, setArcs] = useState<Option[]>([]);
  const [spins, setSpins] = useState<Option[]>([]);

  useEffect(() => {
    apiFetch<{ items: Option[] }>("/api/alloys").then((r) => setAlloys(r.items)).catch(() => setAlloys([]));
    apiFetch<{ items: Option[] }>("/api/arc-batches").then((r) => setArcs(r.items)).catch(() => setArcs([]));
    apiFetch<{ items: Option[] }>("/api/spinning-batches").then((r) => setSpins(r.items)).catch(() => setSpins([]));
  }, []);

  return (
    <AppShell title="新建样品">
      <Card>
        <Form
          layout="vertical"
          initialValues={{ state: "GR", isWelded2cm: false, treatmentCode: "AS" }}
          onFinish={async (values) => {
            try {
              await apiFetch("/api/samples", {
                method: "POST",
                body: {
                  alloyDesignId: Number(values.alloyDesignId),
                  arcBatchId: Number(values.arcBatchId),
                  spinningBatchId: Number(values.spinningBatchId),
                  state: values.state,
                  bareWireDiameterUm: Number(values.bareWireDiameterUm),
                  coatedWireDiameterUm: Number(values.coatedWireDiameterUm),
                  isWelded2cm: Boolean(values.isWelded2cm),
                  sampleIndex: Number(values.sampleIndex),
                  treatmentCode: values.treatmentCode
                }
              });
              message.success("创建成功");
              router.push("/samples");
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item name="alloyDesignId" label="成分代号" rules={[{ required: true }]}>
            <Select options={alloys.map((x) => ({ label: x.code, value: x.id }))} />
          </Form.Item>
          <Form.Item name="arcBatchId" label="熔炼批次" rules={[{ required: true }]}>
            <Select options={arcs.map((x) => ({ label: x.batchNo, value: x.id }))} />
          </Form.Item>
          <Form.Item name="spinningBatchId" label="拉丝批次" rules={[{ required: true }]}>
            <Select options={spins.map((x) => ({ label: x.batchNo, value: x.id }))} />
          </Form.Item>
          <Form.Item name="state" label="状态"><Radio.Group options={[{ label: "GC", value: "GC" }, { label: "GR", value: "GR" }]} /></Form.Item>
          <Form.Item name="bareWireDiameterUm" label="裸丝直径(um)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="coatedWireDiameterUm" label="包覆丝直径(um)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="isWelded2cm" label="是否焊接2cm" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="sampleIndex" label="样品序号" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="treatmentCode" label="后处理代号"><Input placeholder="AS/DC20..." /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => router.push("/samples")}>取消</Button>
          </Space>
        </Form>
      </Card>
    </AppShell>
  );
}

