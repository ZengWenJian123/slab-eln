"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Upload,
  message
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";

type ImageAsset = {
  id: number;
  originalName: string;
  category: string;
  stage: string;
  sample?: { sampleNo: string };
  relatedType: string;
  relatedId: number;
  storagePath: string;
  createdAt: string;
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function ImageCenterPage() {
  const [data, setData] = useState<Paged<ImageAsset>>({ items: [], total: 0, page: 1, pageSize: 12 });
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [filters, setFilters] = useState({ sampleId: "", category: "", stage: "" });

  const query = useMemo(() => {
    const q = new URLSearchParams({
      page: String(data.page),
      pageSize: String(data.pageSize)
    });
    if (filters.sampleId) q.set("sampleId", filters.sampleId);
    if (filters.category) q.set("category", filters.category);
    if (filters.stage) q.set("stage", filters.stage);
    return q.toString();
  }, [data.page, data.pageSize, filters]);

  const load = async () => {
    try {
      const result = await apiFetch<Paged<ImageAsset>>(`/api/images?${query}`);
      setData(result);
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [query]);

  return (
    <AppShell
      title="图片中心"
      extra={
        <Card>
          <Form layout="inline">
            <Form.Item label="样品ID">
              <Input value={filters.sampleId} onChange={(e) => setFilters((f) => ({ ...f, sampleId: e.target.value }))} />
            </Form.Item>
            <Form.Item label="分类">
              <Input value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} />
            </Form.Item>
            <Form.Item label="阶段">
              <Input value={filters.stage} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))} />
            </Form.Item>
            <Space>
              <Button type="primary" onClick={() => setOpen(true)}>上传图片</Button>
            </Space>
          </Form>
        </Card>
      }
    >
      <Row gutter={[16, 16]}>
        {data.items.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              cover={
                <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
                  <Image
                    src={`/api/files/${item.storagePath}`}
                    alt={item.originalName}
                    style={{ maxHeight: 150 }}
                    fallback="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                  />
                </div>
              }
            >
              <Card.Meta title={item.originalName} description={<Space direction="vertical">
                <Tag>{item.category}</Tag>
                <div>关联：{item.relatedType}#{item.relatedId}</div>
                <div>路径：{item.storagePath}</div>
              </Space>} />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="上传图片"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              const file = fileList[0]?.originFileObj;
              if (!file) throw new Error("请选择图片");
              const formData = new FormData();
              formData.append("file", file);
              formData.append("relatedType", values.relatedType);
              formData.append("relatedId", String(values.relatedId));
              formData.append("category", values.category);
              formData.append("stage", values.stage);
              if (values.remark) formData.append("remark", values.remark);
              if (values.tags) formData.append("tags", values.tags);
              if (values.capturedAt) formData.append("capturedAt", values.capturedAt.toISOString());
              const response = await fetch("/api/images/upload", { method: "POST", body: formData });
              const json = await response.json();
              if (!response.ok || !json.success) throw new Error(json.message || "上传失败");
              message.success("上传成功");
              setOpen(false);
              setFileList([]);
              load();
            } catch (error) {
              message.error((error as Error).message);
            }
          }}
        >
          <Form.Item label="图片文件" required>
            <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(v) => setFileList(v.fileList)}>
              <Button>选择图片</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="关联对象类型" name="relatedType" initialValue="SAMPLE" rules={[{ required: true }]}>
            <Select options={[{ label: "样品", value: "SAMPLE" }, { label: "熔炼批次", value: "ARC_BATCH" }, { label: "拉丝批次", value: "SPINNING_BATCH" }, { label: "测试记录", value: "TEST_RECORD" }]} />
          </Form.Item>
          <Form.Item label="关联对象ID" name="relatedId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="图片分类" name="category" rules={[{ required: true }]}>
            <Input placeholder="显微组织/外观图/测试结果..." />
          </Form.Item>
          <Form.Item label="实验阶段" name="stage" rules={[{ required: true }]}>
            <Input placeholder="熔炼/拉丝/测试..." />
          </Form.Item>
          <Form.Item label="拍摄日期" name="capturedAt">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="标签" name="tags"><Input placeholder="逗号分隔" /></Form.Item>
          <Form.Item label="备注" name="remark"><Input.TextArea rows={2} /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">确认上传</Button>
            <Button onClick={() => setOpen(false)}>取消</Button>
          </Space>
        </Form>
      </Modal>
    </AppShell>
  );
}
