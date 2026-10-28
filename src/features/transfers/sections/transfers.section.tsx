"use client";

import React from "react";
import { Button, InputNumber, Modal, Select, message } from "antd";
import { ArrowDownToLine, ArrowLeftRight, Plus, Truck } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { getBranches } from "@/features/branches/api";
import { getProducts } from "@/features/catalog/api";
import {
  createStockTransfer,
  dispatchStockTransfer,
  getTransfers,
  receiveStockTransfer,
} from "@/features/transfers/api";
import {
  PageHeadingSecondary,
  DataTableSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import { DEFAULT_BRANCH_ID } from "@/constants/settings";
import type { TransferType } from "@/features/transfers/schema";

function date(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function TransfersSection() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sourceBranchId, setSourceBranchId] = React.useState(
    auth.session.branch_id ?? DEFAULT_BRANCH_ID,
  );
  const [destinationBranchId, setDestinationBranchId] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState<number | null>(1);
  const branches = useQuery({
    queryKey: ["branches", "all"],
    queryFn: () => getBranches(undefined),
  });
  const products = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => getProducts({ page_size: 100 }),
  });
  const transfers = useQuery({
    queryKey: ["transfers", auth.session.branch_id],
    queryFn: () => getTransfers(auth.session.branch_id ?? undefined),
  });
  const invalidate = async function () {
    await queryClient.invalidateQueries({ queryKey: ["transfers"] });
    await queryClient.invalidateQueries({ queryKey: ["stock"] });
    await queryClient.invalidateQueries({ queryKey: ["movements"] });
    await queryClient.invalidateQueries({ queryKey: ["overview"] });
    await queryClient.invalidateQueries({ queryKey: ["audit"] });
  };
  const createTransfer = useMutation({
    mutationFn: createStockTransfer,
    onSuccess: async function () {
      await invalidate();
      message.success("Transfer draft created.");
      setModalOpen(false);
    },
  });
  const dispatchTransfer = useMutation({
    mutationFn: dispatchStockTransfer,
    onSuccess: async function () {
      await invalidate();
      message.success(
        "Transfer dispatched. Source stock was deducted and the goods are in transit.",
      );
    },
  });
  const receiveTransfer = useMutation({
    mutationFn: receiveStockTransfer,
    onSuccess: async function () {
      await invalidate();
      message.success(
        "Transfer received. Destination stock and ledger updated.",
      );
    },
  });

  const columns: ColumnsType<TransferType> = [
    {
      title: "Transfer",
      dataIndex: "reference",
      key: "reference",
      render: (value: string) => (
        <strong className="table-primary-value">{value}</strong>
      ),
    },
    {
      title: "From",
      dataIndex: "source_branch_id",
      key: "source_branch_id",
      render: (value: string) =>
        branches.data?.find((branch) => branch.id === value)?.name ?? "—",
    },
    {
      title: "To",
      dataIndex: "destination_branch_id",
      key: "destination_branch_id",
      render: (value: string) =>
        branches.data?.find((branch) => branch.id === value)?.name ?? "—",
    },
    {
      title: "Line items",
      dataIndex: "items_count",
      key: "items_count",
      align: "right",
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: date,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      title: "Action",
      key: "action",
      render: (_value, row) =>
        row.status === "draft" ? (
          <Button
            size="small"
            type="primary"
            ghost
            icon={<Truck size={14} />}
            loading={dispatchTransfer.isPending}
            onClick={() => dispatchTransfer.mutate(row.id)}
          >
            Dispatch
          </Button>
        ) : row.status === "dispatched" ? (
          <Button
            size="small"
            icon={<ArrowDownToLine size={14} />}
            loading={receiveTransfer.isPending}
            onClick={() => receiveTransfer.mutate(row.id)}
          >
            Receive
          </Button>
        ) : (
          <span className="muted-cell">Complete</span>
        ),
    },
  ];

  async function handleCreate() {
    if (!destinationBranchId || !productId || !quantity || quantity <= 0) {
      message.warning("Choose source, destination, product and quantity.");
      return;
    }
    try {
      await createTransfer.mutateAsync({
        source_branch_id: sourceBranchId,
        destination_branch_id: destinationBranchId,
        items: [{ product_id: productId, quantity }],
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not create transfer",
      );
    }
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Branch logistics"
        title="Stock transfers"
        description="Dispatch and receive branch-to-branch transfers as separate audited steps, with explicit in-transit stock."
        action={
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setSourceBranchId(auth.session.branch_id ?? DEFAULT_BRANCH_ID);
              setDestinationBranchId("");
              setProductId("");
              setQuantity(1);
              setModalOpen(true);
            }}
          >
            New transfer
          </Button>
        }
      />
      <div className="inventory-callout">
        <ArrowLeftRight size={19} />
        <div>
          <strong>Dispatch and receipt are separate.</strong>
          <p>
            Dispatch deducts stock at the source. Receipt adds stock at the
            destination. A transfer cannot be received twice.
          </p>
        </div>
      </div>
      <SectionCardSecondary
        title="Transfer register"
        subtitle="Monitor drafts, goods in transit and completed transfers."
      >
        <DataTableSecondary<TransferType>
          columns={columns}
          data={transfers.data ?? []}
          rowKey="id"
          loading={transfers.isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </SectionCardSecondary>
      <Modal
        title="Create stock transfer"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        okText="Create draft"
        confirmLoading={createTransfer.isPending}
        destroyOnHidden
      >
        <p className="modal-intro">
          This prototype supports one product line per transfer. Stock is not
          moved until dispatch.
        </p>
        <div className="dialog-form">
          <label>Source branch</label>
          <Select
            value={sourceBranchId}
            disabled={!auth.isAdmin}
            onChange={setSourceBranchId}
            options={(branches.data ?? []).map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          />
          <label>Destination branch</label>
          <Select
            value={destinationBranchId || undefined}
            onChange={setDestinationBranchId}
            placeholder="Choose destination"
            options={(branches.data ?? [])
              .filter((branch) => branch.id !== sourceBranchId)
              .map((branch) => ({ value: branch.id, label: branch.name }))}
          />
          <label>Product</label>
          <Select
            showSearch
            optionFilterProp="label"
            value={productId || undefined}
            onChange={setProductId}
            placeholder="Choose product"
            options={(products.data?.results ?? []).map((product) => ({
              value: product.id,
              label: `${product.name} · ${product.sku}`,
            }))}
          />
          <label>Quantity to transfer</label>
          <InputNumber
            style={{ width: "100%" }}
            min={0.01}
            value={quantity}
            onChange={setQuantity}
          />
        </div>
      </Modal>
    </div>
  );
}
