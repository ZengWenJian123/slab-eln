"use client";

import { ConfigProvider, App as AntdApp } from "antd";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ConfigProvider
        theme={{
          token: {
            borderRadius: 8
          }
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </SessionProvider>
  );
}

