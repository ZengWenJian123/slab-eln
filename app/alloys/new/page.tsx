"use client";

import { useMemo } from "react";
import { Button, Card, Form, InputNumber, Space, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

const elements = ["Co", "Fe", "Si", "B", "Cr", "Cu", "Nb"];

export default function AlloyNewPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const composition = Form.useWatch("composition", form) as Record<string, number> | undefined;

  const total = useMemo(
    () => Object.values(composition ?? {}).reduce((acc, x) => acc + Number(x || 0), 0),
    [composition]
  );

  return (
    <AppShell title="新建成分">
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            composition: Object.fromEntries(elements.map((x) => [x, 0]))
          }}
          onFinish={async (values) => {
            try {
              const payload = {
                composition: elements.map((x) => ({
                  element: x,
                  percent: Number(values.composition[x] || 0)
                }))
              };
              await apiFetch("/api/alloys", { method: "POST", body: payload });
              message.success("创建成功");
              router.push("/alloys");
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          {elements.map((element) => (
            <Form.Item key={element} label={`${element} (%)`} name={["composition", element]}>
              <InputNumber style={{ width: "100%" }} min={0} max={100} precision={4} />
            </Form.Item>
          ))}
          <Typography.Text type={Math.abs(total - 100) < 1e-4 ? "success" : "danger"}>
            当前合计：{total.toFixed(4)}%
          </Typography.Text>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" disabled={Math.abs(total - 100) >= 1e-4}>
                保存
              </Button>
              <Button onClick={() => router.push("/alloys")}>取消</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </AppShell>
  );
}

