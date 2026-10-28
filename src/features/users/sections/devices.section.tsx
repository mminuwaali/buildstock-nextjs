"use client";

import React from "react";
import { Button, Input, Modal, Select, message } from "antd";
import { HardDrive, Laptop, Plus, Smartphone } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDevices, registerDevice } from "@/features/users/api";
import { getBranches } from "@/features/branches/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PageHeadingSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
export function DevicesSection() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [branchId, setBranchId] = React.useState(auth.session.branch_id ?? "");
  const devices = useQuery({
    queryKey: ["devices", auth.session.branch_id],
    queryFn: () => getDevices(auth.session.branch_id ?? undefined),
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
  const createDevice = useMutation({
    mutationFn: registerDevice,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
      setModalOpen(false);
      setName("");
      message.success(
        "Demo device registered. It begins offline until a sync is run.",
      );
    },
  });
  async function handleRegister() {
    if (!name.trim() || !branchId) {
      message.warning("Enter a device name and select its assigned branch.");
      return;
    }
    try {
      await createDevice.mutateAsync({
        name: name.trim(),
        branch_id: branchId,
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not register device",
      );
    }
  }
  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Offline readiness"
        title="Registered devices"
        description="This demo registry shows device-to-branch assignments. A production sync protocol must validate the device and branch on the server."
        action={
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => {
              setBranchId(
                auth.session.branch_id ?? branches.data?.[0]?.id ?? "",
              );
              setModalOpen(true);
            }}
          >
            Register device
          </Button>
        }
      />
      <div className="device-cards-grid">
        {(devices.data ?? []).map((device) => (
          <article className="device-card" key={device.id}>
            <div className="device-card-top">
              <span className="device-list-icon">
                <Laptop size={18} />
              </span>
              <StatusBadge status={device.status} />
            </div>
            <h2>{device.name}</h2>
            <p>
              {branches.data?.find((branch) => branch.id === device.branch_id)
                ?.name ?? "Assigned branch"}
            </p>
            <div className="device-card-meta">
              <span>
                <HardDrive size={14} /> {device.id.slice(0, 8).toUpperCase()}
              </span>
              <span>Last seen {formatDate(device.last_seen_at)}</span>
            </div>
          </article>
        ))}
      </div>
      <SectionCardSecondary
        title="Device policy"
        subtitle="Operational rules to preserve during Django migration"
      >
        <div className="policy-list">
          <div>
            <Smartphone size={17} />
            <span>
              <strong>Branch-bound registration</strong>
              <small>
                Devices submit operations only for their assigned store.
              </small>
            </span>
          </div>
          <div>
            <HardDrive size={17} />
            <span>
              <strong>Local outbox</strong>
              <small>
                Pending transactions remain on the device until acknowledged or
                reviewed.
              </small>
            </span>
          </div>
          <div>
            <StatusBadge status="needs_review" />
            <span>
              <strong>Discrepancy handling</strong>
              <small>
                Negative balance and stock-count conflicts are flagged, never
                silently discarded.
              </small>
            </span>
          </div>
        </div>
      </SectionCardSecondary>
      <Modal
        title="Register demo device"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleRegister}
        confirmLoading={createDevice.isPending}
        okText="Register device"
      >
        <p className="modal-intro">
          Registration is simulated in local browser storage. A production
          server must issue/validate device credentials.
        </p>
        <div className="dialog-form">
          <label htmlFor="device-name">Device name</label>
          <Input
            id="device-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Front Counter POS 2"
          />
          <label>Assigned branch</label>
          <Select
            value={branchId || undefined}
            disabled={!auth.isAdmin}
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
