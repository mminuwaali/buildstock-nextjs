import React from "react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return <DashboardShell>{props.children}</DashboardShell>;
}
