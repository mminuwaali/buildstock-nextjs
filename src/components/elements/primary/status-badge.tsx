import React from "react";
import { Badge, Tag } from "antd";

export function StatusBadge(props: { status: string }) {
  const status = props.status.toLowerCase();
  const color =
    status === "synced" ||
    status === "confirmed" ||
    status === "received" ||
    status === "completed" ||
    status === "active" ||
    status === "online"
      ? "success"
      : status === "pending" ||
          status === "ordered" ||
          status === "syncing" ||
          status === "awaiting_verification" ||
          status === "dispatched" ||
          status === "invited"
        ? "warning"
        : status === "rejected" ||
            status === "voided" ||
            status === "cancelled" ||
            status === "inactive" ||
            status === "offline"
          ? "error"
          : "processing";
  const label = status.replaceAll("_", " ");
  return (
    <Tag color={color} className="status-tag">
      {label}
    </Tag>
  );
}

export function SyncDot(props: { online: boolean }) {
  return (
    <Badge
      status={props.online ? "success" : "warning"}
      text={props.online ? "Online" : "Offline mode"}
    />
  );
}
