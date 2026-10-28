"use client";

import React from "react";
import { Button, Input, InputNumber, Modal, Select, Tabs, message } from "antd";
import { ClipboardCheck, PackagePlus, Plus, Search } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useStockBalances,
  useStockMovements,
  useAdjustStock,
} from "@/features/inventory/hooks";
import { useQuery } from "@tanstack/react-query";
import { getBranches } from "@/features/branches/api";
import { getProducts } from "@/features/catalog/api";
import {
  PageHeadingSecondary,
  DataTableSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import { DEFAULT_BRANCH_ID } from "@/constants/settings";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function InventorySection() {
  const auth = useAuth();
  const canAdjustStock =
    auth.session.role === "owner_admin" ||
    auth.session.role === "store_manager" ||
    auth.session.role === "stock_officer";
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("balances");
  const [adjustmentOpen, setAdjustmentOpen] = React.useState(false);
  const [selectedBranch, setSelectedBranch] = React.useState(
    auth.session.branch_id ?? DEFAULT_BRANCH_ID,
  );
  const [selectedProduct, setSelectedProduct] = React.useState("");
  const [quantityDelta, setQuantityDelta] = React.useState<number | null>(0);
  const [reason, setReason] = React.useState("");
  const balances = useStockBalances(auth.session.branch_id);
  const movements = useStockMovements(auth.session.branch_id);
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
  const products = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => getProducts({ page_size: 100 }),
  });
  const adjustStock = useAdjustStock();
  const balanceRows = (balances.data ?? []).filter(
    (row) =>
      !search ||
      `${row.product?.name ?? ""} ${row.product?.sku ?? ""} ${row.branch?.name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const balanceColumns: ColumnsType<(typeof balanceRows)[number]> = [
    {
      title: "Product",
      key: "product",
      render: (_value, row) => (
        <div className="product-cell">
          <span className="product-thumb-small">
            <PackagePlus size={16} />
          </span>
          <span>
            <strong>{row.product?.name ?? "Unknown product"}</strong>
            <small>{row.product?.sku ?? "—"}</small>
          </span>
        </div>
      ),
    },
    {
      title: "Branch",
      key: "branch",
      render: (_value, row) => row.branch?.name ?? "—",
    },
    {
      title: "On hand",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      render: (value: number, row) => (
        <strong
          className={
            value <= (row.product?.reorder_level ?? 0) ? "quantity-low" : ""
          }
        >
          {value.toLocaleString("en-NG")}{" "}
          <small>{row.product?.unit ?? "units"}</small>
        </strong>
      ),
    },
    {
      title: "Reorder at",
      key: "reorder",
      align: "right",
      render: (_value, row) => row.product?.reorder_level ?? 0,
    },
    {
      title: "Status",
      key: "status",
      render: (_value, row) => (
        <StatusBadge
          status={
            row.quantity < 0
              ? "needs_review"
              : row.quantity <= (row.product?.reorder_level ?? 0)
                ? "low_stock"
                : "in_stock"
          }
        />
      ),
    },
    ...(canAdjustStock
      ? [
          {
            title: "",
            key: "actions",
            render: (_value: unknown, row: (typeof balanceRows)[number]) => (
              <Button
                size="small"
                onClick={() => {
                  setSelectedBranch(row.branch_id);
                  setSelectedProduct(row.product_id);
                  setQuantityDelta(0);
                  setReason("");
                  setAdjustmentOpen(true);
                }}
              >
                Adjust
              </Button>
            ),
          },
        ]
      : []),
  ];
  const movementColumns: ColumnsType<
    NonNullable<typeof movements.data>[number]
  > = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) => formatDate(value),
    },
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
      render: (value: string) => <strong>{value}</strong>,
    },
    { title: "Branch", dataIndex: "branch_name", key: "branch_name" },
    {
      title: "Movement",
      dataIndex: "movement_type",
      key: "movement_type",
      render: (value: string) => (
        <span className="capitalize-text">{value.replaceAll("_", " ")}</span>
      ),
    },
    {
      title: "Change",
      dataIndex: "quantity_delta",
      key: "quantity_delta",
      align: "right",
      render: (value: number) => (
        <strong
          className={value < 0 ? "quantity-negative" : "quantity-positive"}
        >
          {value > 0 ? "+" : ""}
          {value}
        </strong>
      ),
    },
    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
      render: (value: string) => <span className="code-text">{value}</span>,
    },
    { title: "Reason", dataIndex: "reason", key: "reason" },
  ];

  async function handleAdjustment() {
    if (!selectedProduct || !quantityDelta || !reason.trim()) {
      message.warning(
        "Choose a product, enter a non-zero quantity change and provide a reason.",
      );
      return;
    }
    try {
      await adjustStock.mutateAsync({
        branch_id: selectedBranch,
        product_id: selectedProduct,
        quantity_delta: quantityDelta,
        reason,
        actor_id: auth.session.user_id,
      });
      setAdjustmentOpen(false);
      message.success("Stock adjustment recorded in the movement ledger.");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not adjust stock",
      );
    }
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Inventory control"
        title="Stock & movements"
        description="Branch-level balances backed by an auditable movement ledger. A sale only changes the stock at its physical store."
        action={
          canAdjustStock ? (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setSelectedBranch(auth.session.branch_id ?? DEFAULT_BRANCH_ID);
                setSelectedProduct("");
                setQuantityDelta(0);
                setReason("");
                setAdjustmentOpen(true);
              }}
            >
              Stock adjustment
            </Button>
          ) : null
        }
      />
      <div className="inventory-callout">
        <ClipboardCheck size={19} />
        <div>
          <strong>Stock integrity starts with a clear record.</strong>
          <p>
            Every adjustment requires a reason. Corrections are recorded as new
            movements instead of deleting history.
          </p>
        </div>
      </div>
      <SectionCardSecondary
        title="Inventory register"
        subtitle={`${balanceRows.length} branch-product balances`}
      >
        <div className="table-toolbar">
          <Input
            allowClear
            prefix={<Search size={16} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, SKU or branch…"
          />
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "balances", label: "Stock balances" },
              { key: "movements", label: "Movement ledger" },
            ]}
          />
        </div>
        {activeTab === "balances" ? (
          <DataTableSecondary
            columns={balanceColumns}
            data={balanceRows}
            rowKey="id"
            loading={balances.isLoading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        ) : (
          <DataTableSecondary
            columns={movementColumns}
            data={(movements.data ?? []).filter(
              (row) =>
                !search ||
                `${row.product_name} ${row.reference} ${row.branch_name}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )}
            rowKey="id"
            loading={movements.isLoading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        )}
      </SectionCardSecondary>
      {canAdjustStock ? (
        <Modal
          title="Record stock adjustment"
          open={adjustmentOpen}
          onCancel={() => setAdjustmentOpen(false)}
          onOk={handleAdjustment}
          okText="Record adjustment"
          confirmLoading={adjustStock.isPending}
          destroyOnHidden
        >
          <p className="modal-intro">
            Use a positive amount to add stock or a negative amount to record a
            shortage. This creates a permanent ledger entry.
          </p>
          <div className="dialog-form">
            <label>Branch</label>
            <Select
              value={selectedBranch}
              disabled={!auth.isAdmin}
              onChange={setSelectedBranch}
              options={(branches.data ?? []).map((branch) => ({
                value: branch.id,
                label: branch.name,
              }))}
            />
            <label>Product</label>
            <Select
              showSearch
              optionFilterProp="label"
              value={selectedProduct || undefined}
              onChange={setSelectedProduct}
              placeholder="Choose product"
              options={(products.data?.results ?? []).map((product) => ({
                value: product.id,
                label: `${product.name} · ${product.sku}`,
              }))}
            />
            <label>Quantity change</label>
            <InputNumber
              style={{ width: "100%" }}
              value={quantityDelta}
              onChange={setQuantityDelta}
              placeholder="e.g. 20 or -3"
            />
            <label>Reason (required)</label>
            <Input.TextArea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Physical count confirmed 3 damaged bags"
              rows={3}
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
