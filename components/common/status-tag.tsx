import { Tag } from "antd";

type Props = {
  status?: "SUCCESS" | "FAILED" | null;
};

export function StatusTag({ status }: Props) {
  if (!status) return <Tag>未知</Tag>;
  if (status === "SUCCESS") return <Tag color="success">成功</Tag>;
  return <Tag color="error">失败</Tag>;
}

