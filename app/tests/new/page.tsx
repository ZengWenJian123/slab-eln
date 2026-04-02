"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Upload,
  message
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import type { UploadFile } from "antd/es/upload/interface";

type Sample = { id: number; sampleNo: string };

export default function TestNewPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [rawFileList, setRawFileList] = useState<UploadFile[]>([]);
  const [status, setStatus] = useState<"SUCCESS" | "FAILED">("SUCCESS");

  useEffect(() => {
    apiFetch<{ items: Sample[] }>("/api/samples")
      .then((result) => setSamples(result.items))
      .catch(() => setSamples([]));
  }, []);

  return (
    <AppShell title="新建测试记录">
      <Card>
        <Form
          layout="vertical"
          initialValues={{ testDate: dayjs(), status: "SUCCESS" }}
          onFinish={async (values) => {
            try {
              let attachmentId: number | null = null;
              const rawFile = rawFileList[0]?.originFileObj;
              if (rawFile) {
                const formData = new FormData();
                formData.append("file", rawFile);
                formData.append("relatedType", "TEST_RECORD");
                formData.append("relatedId", "0");
                const response = await fetch("/api/attachments/upload", {
                  method: "POST",
                  body: formData
                });
                const json = await response.json();
                if (!response.ok || !json.success) throw new Error(json.message || "附件上传失败");
                attachmentId = json.data.id as number;
              }

              await apiFetch("/api/tests", {
                method: "POST",
                body: {
                  sampleId: Number(values.sampleId),
                  testDate: values.testDate.toISOString(),
                  operatorName: values.operatorName,
                  instrumentName: values.instrumentName,
                  testCondition: values.testCondition,
                  keyResults: values.keyResults,
                  rawFileAttachmentId: attachmentId,
                  status: values.status,
                  failureReasonId: values.failureReasonId ? Number(values.failureReasonId) : null
                }
              });
              message.success("创建成功");
              router.push("/tests");
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item name="sampleId" label="样品号" rules={[{ required: true }]}>
            <Select options={samples.map((x) => ({ label: x.sampleNo, value: x.id }))} />
          </Form.Item>
          <Form.Item name="testDate" label="测试日期" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="operatorName" label="测试人员" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="instrumentName" label="测试设备" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="testCondition" label="测试条件" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="keyResults" label="关键结果" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="原始文件(CSV/TXT)">
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              fileList={rawFileList}
              onChange={(info) => setRawFileList(info.fileList)}
            >
              <Button>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group
              options={[
                { label: "成功", value: "SUCCESS" },
                { label: "失败", value: "FAILED" }
              ]}
              onChange={(e) => setStatus(e.target.value)}
            />
          </Form.Item>
          {status === "FAILED" && (
            <Form.Item name="failureReasonId" label="失败原因" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          )}
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => router.push("/tests")}>取消</Button>
          </Space>
        </Form>
      </Card>
    </AppShell>
  );
}

