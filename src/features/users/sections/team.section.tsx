"use client";

import React from "react";
import { Button, Input, Modal, Select, message } from "antd";
import { Plus } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inviteUser, getUsers } from "@/features/users/api";
import { getBranches } from "@/features/branches/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PageHeadingSecondary,
  DataTableSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import type { DemoUserType } from "@/features/users/schema";

const roleNames: Record<DemoUserType["role"], string> = {
  owner_admin: "Owner / Admin",
  store_manager: "Store Manager",
  cashier: "Cashier",
  stock_officer: "Stock Officer",
  auditor: "Auditor / Accountant",
};
export function TeamSection() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<DemoUserType["role"]>("cashier");
  const [branchId, setBranchId] = React.useState(auth.session.branch_id ?? "");
  const users = useQuery({
    queryKey: ["users", auth.session.branch_id],
    queryFn: () => getUsers(auth.session.branch_id ?? undefined),
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
  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
      setModalOpen(false);
      setFullName("");
      setEmail("");
      message.success(
        "Demo invitation created. No email was sent in this frontend-only prototype.",
      );
    },
  });
  const columns: ColumnsType<DemoUserType> = [
    {
      title: "Team member",
      dataIndex: "full_name",
      key: "full_name",
      render: (value: string, row: DemoUserType) => (
        <div className="product-cell">
          <span className="team-avatar">
            {value
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </span>
          <span>
            <strong>{value}</strong>
            <small>{row.email}</small>
          </span>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (value: DemoUserType["role"]) => roleNames[value],
    },
    {
      title: "Assigned branch",
      dataIndex: "branch_id",
      key: "branch_id",
      render: (value: string | null) =>
        value
          ? (branches.data?.find((branch) => branch.id === value)?.name ?? "—")
          : "All branches",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  async function handleInvite() {
    if (!fullName.trim() || !email.trim()) {
      message.warning("Enter a name and valid email address.");
      return;
    }
    if (role !== "owner_admin" && !branchId) {
      message.warning("Choose a branch for this staff member.");
      return;
    }
    try {
      await inviteMutation.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        branch_id: role === "owner_admin" ? null : branchId,
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not create invitation",
      );
    }
  }

  const roleOptions = [
    { value: "store_manager", label: "Store Manager" },
    { value: "cashier", label: "Cashier" },
    { value: "stock_officer", label: "Stock Officer" },
    { value: "auditor", label: "Auditor / Accountant" },
    ...(auth.isAdmin ? [{ value: "owner_admin", label: "Owner / Admin" }] : []),
  ] as Array<{ value: DemoUserType["role"]; label: string }>;
  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="People & permissions"
        title="Team & access"
        description="The demo illustrates role-based branch views. A real Django API must enforce permissions on every request."
        action={
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setBranchId(
                auth.session.branch_id ?? branches.data?.[0]?.id ?? "",
              );
              setModalOpen(true);
            }}
          >
            Invite staff
          </Button>
        }
      />
      <div className="kpi-grid compact-kpi-grid">
        <article className="mini-stat">
          <span>Users in view</span>
          <strong>{users.data?.length ?? 0}</strong>
          <small>Based on selected branch scope</small>
        </article>
        <article className="mini-stat">
          <span>Access roles</span>
          <strong>5</strong>
          <small>Admin, manager, cashier, stock, auditor</small>
        </article>
        <article className="mini-stat">
          <span>Security mode</span>
          <strong>Demo</strong>
          <small>UI simulation only</small>
        </article>
      </div>
      <SectionCardSecondary
        title="Team directory"
        subtitle="Only users assigned to the active store appear for store-scoped roles."
      >
        <DataTableSecondary<DemoUserType>
          columns={columns}
          data={users.data ?? []}
          rowKey="id"
          loading={users.isLoading}
          pagination={false}
        />
      </SectionCardSecondary>
      <Modal
        title="Invite team member"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleInvite}
        confirmLoading={inviteMutation.isPending}
        okText="Create demo invitation"
      >
        <p className="modal-intro">
          This creates a local demo user with an invited status. No email or
          real account is created.
        </p>
        <div className="dialog-form">
          <label htmlFor="team-name">Full name</label>
          <Input
            id="team-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Staff member name"
          />
          <label htmlFor="team-email">Email address</label>
          <Input
            id="team-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
          <label>Role</label>
          <Select
            value={role}
            onChange={(value) => setRole(value)}
            options={roleOptions}
          />
          <label>Assigned branch</label>
          <Select
            value={role === "owner_admin" ? undefined : branchId || undefined}
            disabled={role === "owner_admin"}
            onChange={setBranchId}
            placeholder="Choose branch"
            options={(branches.data ?? []).map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}
