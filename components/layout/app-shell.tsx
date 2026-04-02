"use client";

import { Layout, Menu, Typography, Button, Space } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  ExperimentOutlined,
  BuildOutlined,
  ClusterOutlined,
  DeploymentUnitOutlined,
  FileImageOutlined,
  BookOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps["items"] = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "首页看板" },
  { key: "/alloys", icon: <ExperimentOutlined />, label: "成分设计" },
  { key: "/arc-batches", icon: <BuildOutlined />, label: "熔炼批次" },
  { key: "/spinning-batches", icon: <ClusterOutlined />, label: "拉丝批次" },
  { key: "/samples", icon: <DeploymentUnitOutlined />, label: "样品管理" },
  { key: "/post-treatments", icon: <BuildOutlined />, label: "后处理记录" },
  { key: "/tests", icon: <ExperimentOutlined />, label: "性能测试" },
  { key: "/images", icon: <FileImageOutlined />, label: "图片中心" },
  { key: "/dictionary", icon: <BookOutlined />, label: "数据字典" },
  { key: "/users", icon: <TeamOutlined />, label: "用户管理" }
];

type Props = {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, extra, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useSession();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="light">
        <div style={{ padding: 16, fontWeight: 700 }}>SLAB-ELN</div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInline: 16
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Space>
            <Typography.Text>{data?.user?.name ?? "-"}</Typography.Text>
            <Button
              onClick={() =>
                signOut({
                  callbackUrl: "/login"
                })
              }
            >
              退出登录
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 16 }}>
          <div className="page-wrap">
            {extra}
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

