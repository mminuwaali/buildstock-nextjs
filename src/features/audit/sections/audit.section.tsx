"use client";

import React from "react";
import { Input } from "antd";
import { Search, ShieldCheck } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import { getAuditEvents } from "@/features/audit/api";
import { getBranches } from "@/features/branches/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PageHeadingSecondary,
  DataTableSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import type { AuditEventType } from "@/features/audit/schema";

function date(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
export function AuditSection() {
  const auth = useAuth();
  const [search, setSearch] = React.useState("");
  const events = useQuery({
    queryKey: ["audit", auth.session.branch_id],
    queryFn: () => getAuditEvents(auth.session.branch_id ?? undefined),
  });
  const branches = useQuery({
    queryKey: [
      "branches",
      auth.session.role === "owner_admin" ? "all" : auth.session.branch_id,
    ],
    queryFn: () =>
      getBranches(
        auth.session.role === "owner_admin"
          ? undefined
          : (auth.session.branch_id ?? undefined),
      ),
  });
  const filtered = (events.data ?? []).filter(
    (event) =>
      !search ||
      `${event.actor_name} ${event.action} ${event.entity} ${event.detail}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const columns: ColumnsType<AuditEventType> = [
    { title: "Time", dataIndex: "created_at", key: "created_at", render: date },
    {
      title: "Actor",
      dataIndex: "actor_name",
      key: "actor_name",
      render: (value: string) => <strong>{value}</strong>,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (value: string) => <span className="code-text">{value}</span>,
    },
    {
      title: "Entity",
      dataIndex: "entity",
      key: "entity",
      render: (value: string) => (
        <span className="capitalize-text">{value.replaceAll("_", " ")}</span>
      ),
    },
    {
      title: "Branch",
      dataIndex: "branch_id",
      key: "branch_id",
      render: (value: string | null) =>
        value
          ? (branches.data?.find((branch) => branch.id === value)?.name ?? "—")
          : "Organization",
    },
    { title: "Detail", dataIndex: "detail", key: "detail" },
  ];
  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Governance"
        title="Audit trail"
        description="Operational events are appended rather than silently rewriting historical transactions."
      />
      <div className="inventory-callout">
        <ShieldCheck size={19} />
        <div>
          <strong>Demo audit events are local and illustrative.</strong>
          <p>
            In production, the API should record actor identity, branch, action,
            entity, timestamp and relevant metadata server-side.
          </p>
        </div>
      </div>
      <SectionCardSecondary
        title="Recorded events"
        subtitle={`${filtered.length} events in scope`}
      >
        <div className="table-toolbar">
          <Input
            allowClear
            prefix={<Search size={16} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search actor, action or detail…"
          />
        </div>
        <DataTableSecondary<AuditEventType>
          columns={columns}
          data={filtered}
          rowKey="id"
          loading={events.isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </SectionCardSecondary>
    </div>
  );
}
