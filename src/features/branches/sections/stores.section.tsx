"use client";

import React from "react";
import { Button, Input, Modal, Tag, message } from "antd";
import { Building2, MapPin, Plus, Store } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addBranch, getBranches } from "@/features/branches/api";
import { getOverview } from "@/features/reports/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PageHeadingSecondary,
  SectionCardSecondary,
  DataTableSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import type { BranchType } from "@/features/branches/schema";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function StoresSection() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [city, setCity] = React.useState("");
  const branches = useQuery({
    queryKey: ["branches", "all"],
    queryFn: () => getBranches(),
  });
  const overview = useQuery({
    queryKey: ["overview", "all"],
    queryFn: () => getOverview(),
  });
  const createBranch = useMutation({
    mutationFn: addBranch,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
      setModalOpen(false);
      setName("");
      setCode("");
      setCity("");
      message.success(
        "Branch created with zero opening stock for the current catalog.",
      );
    },
  });
  const columns: ColumnsType<BranchType> = [
    {
      title: "Branch",
      dataIndex: "name",
      key: "name",
      render: (value: string, row: BranchType) => (
        <div className="product-cell">
          <span className="product-thumb-small">
            <Store size={17} />
          </span>
          <span>
            <strong>{value}</strong>
            <small>{row.code}</small>
          </span>
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "city",
      key: "city",
      render: (value: string) => (
        <span className="table-location">
          <MapPin size={14} />
          {value}
        </span>
      ),
    },
    {
      title: "Tracked product balances",
      key: "balances",
      render: (_value, row) =>
        overview.data?.branch_stock.find(
          (branch) => branch.branch_id === row.id,
        )?.product_count ?? 0,
    },
    {
      title: "Estimated retail stock value",
      key: "stock_value",
      align: "right",
      render: (_value, row) =>
        money(
          overview.data?.branch_stock.find(
            (branch) => branch.branch_id === row.id,
          )?.stock_value_minor ?? 0,
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  async function handleCreateBranch() {
    if (!name.trim() || !code.trim() || !city.trim()) {
      message.warning("Enter a branch name, unique code and city.");
      return;
    }
    try {
      await createBranch.mutateAsync({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        city: city.trim(),
        status: "active",
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not create branch",
      );
    }
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Organization"
        title="Stores & branches"
        description="Each branch maintains its own stock and transaction history. Central admins can review the consolidated view."
        action={
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => setModalOpen(true)}
          >
            Add branch
          </Button>
        }
      />
      <div className="store-cards-grid">
        {(branches.data ?? []).map((branch, index) => (
          <article className="store-card" key={branch.id}>
            <div className="store-card-top">
              <span className="store-card-icon">
                <Building2 size={20} />
              </span>
              <StatusBadge status={branch.status} />
            </div>
            <h2>{branch.name}</h2>
            <p>
              <MapPin size={14} />
              {branch.city} · {branch.code}
            </p>
            <div className="store-card-stats">
              <div>
                <small>Product balances</small>
                <strong>
                  {overview.data?.branch_stock.find(
                    (item) => item.branch_id === branch.id,
                  )?.product_count ?? 0}
                </strong>
              </div>
              <div>
                <small>Estimated stock</small>
                <strong>
                  {money(
                    overview.data?.branch_stock.find(
                      (item) => item.branch_id === branch.id,
                    )?.stock_value_minor ?? 0,
                  )}
                </strong>
              </div>
            </div>
            <Tag color="blue">
              {index === 0 ? "Central branch" : "Store branch"}
            </Tag>
          </article>
        ))}
      </div>
      <SectionCardSecondary
        title="Branch register"
        subtitle="Only Owner/Admin can access consolidated branch data."
      >
        <DataTableSecondary<BranchType>
          columns={columns}
          data={
            auth.isAdmin
              ? (branches.data ?? [])
              : (branches.data ?? []).filter(
                  (branch) => branch.id === auth.session.branch_id,
                )
          }
          rowKey="id"
          loading={branches.isLoading}
          pagination={false}
        />
      </SectionCardSecondary>
      <Modal
        title="Create store branch"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateBranch}
        confirmLoading={createBranch.isPending}
        okText="Create branch"
      >
        <p className="modal-intro">
          The new branch starts with zero stock for every product in the shared
          catalog. Receive deliveries or record opening adjustments to add
          stock.
        </p>
        <div className="dialog-form">
          <label htmlFor="branch-name">Branch name</label>
          <Input
            id="branch-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Northside Building Depot"
          />
          <label htmlFor="branch-code">Branch code</label>
          <Input
            id="branch-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. NBD-04"
          />
          <label htmlFor="branch-city">City</label>
          <Input
            id="branch-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="e.g. Maiduguri"
          />
        </div>
      </Modal>
    </div>
  );
}
