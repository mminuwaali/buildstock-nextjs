"use client";

import React from "react";
import { AntdProvider } from "@/components/providers/antd";
import { QueryProvider } from "@/components/providers/query";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ConnectivityProvider } from "@/components/providers/connectivity-provider";
import { DatabaseBootstrapper } from "@/components/providers/database-bootstrapper";

export function AppProviders(props: { children: React.ReactNode }) {
  return (
    <AntdProvider>
      <QueryProvider>
        <AuthProvider>
          <ConnectivityProvider>
            <DatabaseBootstrapper>{props.children}</DatabaseBootstrapper>
          </ConnectivityProvider>
        </AuthProvider>
      </QueryProvider>
    </AntdProvider>
  );
}
