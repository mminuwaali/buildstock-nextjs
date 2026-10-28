"use client";

import React from "react";
import { App as AntdApp, ConfigProvider } from "antd";

export function AntdProvider(props: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1F3A5F",
          colorInfo: "#315B86",
          colorSuccess: "#247447",
          colorWarning: "#A85A08",
          colorError: "#B42318",
          colorBgLayout: "#F4F6F8",
          colorBorder: "#D7DEE7",
          colorText: "#17212F",
          borderRadius: 8,
          fontFamily: "Arial, Helvetica, sans-serif",
        },
        components: {
          Button: { controlHeight: 40, fontWeight: 600 },
          Input: { controlHeight: 40 },
          Select: { controlHeight: 40 },
          Table: { headerBg: "#F4F6F8", borderColor: "#D7DEE7" },
          Menu: { itemSelectedBg: "#E8EFF6", itemSelectedColor: "#1F3A5F" },
        },
      }}
    >
      <AntdApp>{props.children}</AntdApp>
    </ConfigProvider>
  );
}
