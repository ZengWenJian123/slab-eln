"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import {
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  Radio,
  Select,
  Space,
  message
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

type Sample = { id: number; sampleNo: string; state: "GC" | "GR"; isWelded2cm: boolean; bareWireDiameterUm: number };

export default function PostTreatmentNewPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [form] = Form.useForm();
  const status = Form.useWatch("status", form);
  const treatmentType = Form.useWatch("treatmentType", form);

  useEffect(() => {
    apiFetch<{ items: Sample[] }>("/api/samples")
      .then((result) => setSamples(result.items))
      .catch(() => setSamples([]));
  }, []);

  return (
    <AppShell title="新建后处理记录">
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ treatedAt: dayjs(), status: "SUCCESS", treatmentType: "TEMPERATURE" }}
          onFinish={async (values) => {
            try {
              await apiFetch("/api/post-treatments", {
                method: "POST",
                body: {
                  sampleId: Number(values.sampleId),
                  treatmentType: values.treatmentType,
                  treatmentParams: {
                    temperature: values.temperature,
                    holdHour: values.holdHour,
                    currentType: values.currentType,
                    currentDensity: values.currentDensity,
                    currentMa: values.currentMa,
                    powerOnMin: values.powerOnMin,
                    dutyCycle: values.dutyCycle,
                    frequencyHz: values.frequencyHz,
                    tensileWeight: values.tensileWeight,
                    tensileForceMpa: values.tensileForceMpa,
                    tensileMin: values.tensileMin,
                    magneticDirection: values.magneticDirection,
                    magneticOe: values.magneticOe
                  },
                  status: values.status,
                  failureReasonId: values.failureReasonId ? Number(values.failureReasonId) : null,
                  treatedAt: values.treatedAt.toISOString()
                }
              });
              message.success("创建成功");
              router.push("/post-treatments");
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item name="sampleId" label="样品号" rules={[{ required: true }]}>
            <Select options={samples.map((x) => ({ label: x.sampleNo, value: x.id }))} />
          </Form.Item>
          <Form.Item name="treatmentType" label="后处理类型">
            <Select
              options={[
                { label: "温度退火", value: "TEMPERATURE" },
                { label: "电流退火", value: "CURRENT" },
                { label: "拉伸退火", value: "TENSILE" },
                { label: "复合退火", value: "COMBINATION" },
                { label: "磁场退火", value: "MAGNETIC" }
              ]}
            />
          </Form.Item>
          <Form.Item name="treatedAt" label="处理时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          {(treatmentType === "TEMPERATURE" || treatmentType === "COMBINATION") && (
            <>
              <Form.Item name="temperature" label="温度(°C)"><InputNumber style={{ width: "100%" }} /></Form.Item>
              <Form.Item name="holdHour" label="保温时间(h)"><InputNumber style={{ width: "100%" }} /></Form.Item>
            </>
          )}

          {(treatmentType === "CURRENT" || treatmentType === "COMBINATION") && (
            <>
              <Form.Item name="currentType" label="电流类型">
                <Select options={[{ label: "直流", value: "DC" }, { label: "脉冲", value: "PULSE" }]} />
              </Form.Item>
              <Form.Item name="currentDensity" label="电流密度(A/mm²)"><InputNumber style={{ width: "100%" }} /></Form.Item>
              <Form.Item name="currentMa" label="电流大小(mA)"><InputNumber style={{ width: "100%" }} /></Form.Item>
              <Form.Item name="powerOnMin" label="通电时间(min)"><InputNumber style={{ width: "100%" }} /></Form.Item>
              <Form.Item name="dutyCycle" label="占空比(%)"><InputNumber style={{ width: "100%" }} /></Form.Item>
              <Form.Item name="frequencyHz" label="频率(Hz)"><InputNumber style={{ width: "100%" }} /></Form.Item>
            </>
          )}

          {(treatmentType === "TENSILE" || treatmentType === "COMBINATION") && (
            <>
              <Form.Item name="tensileWeight" label="拉伸配重(g)"><InputNumber style={{ width: "100%" }} /></Form.Item>
              <Form.Item name="tensileForceMpa" label="拉伸力(MPa)"><InputNumber style={{ width: "100%" }} /></Form.Item>
              <Form.Item name="tensileMin" label="拉伸时间(min)"><InputNumber style={{ width: "100%" }} /></Form.Item>
            </>
          )}

          {treatmentType === "MAGNETIC" && (
            <>
              <Form.Item name="magneticDirection" label="磁场方向">
                <Select options={[{ label: "轴向", value: "AXIAL" }, { label: "横向", value: "TRANSVERSE" }]} />
              </Form.Item>
              <Form.Item name="magneticOe" label="磁场大小(Oe)"><InputNumber style={{ width: "100%" }} /></Form.Item>
            </>
          )}

          <Form.Item name="status" label="状态">
            <Radio.Group options={[{ label: "成功", value: "SUCCESS" }, { label: "失败", value: "FAILED" }]} />
          </Form.Item>
          {status === "FAILED" && (
            <Form.Item name="failureReasonId" label="失败原因" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          )}
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => router.push("/post-treatments")}>取消</Button>
          </Space>
        </Form>
      </Card>
    </AppShell>
  );
}

