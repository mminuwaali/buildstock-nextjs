"use client";

import React from "react";
import { Button, InputNumber, Modal, Select, message } from "antd";
import { Plus, Truck } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { getBranches } from "@/features/branches/api";
import { getProducts } from "@/features/catalog/api";
import {
  createPurchaseOrder,
  getPurchases,
  getSuppliers,
  receivePurchaseOrder,
} from "@/features/purchases/api";
import {
  PageHeadingSecondary,
  DataTableSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import { DEFAULT_BRANCH_ID } from "@/constants/settings";
import type { PurchaseType } from "@/features/purchases/schema";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
function date(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function PurchasesSection() {
  const auth = useAuth();
  const canManagePurchases =
    auth.session.role === "owner_admin" ||
    auth.session.role === "store_manager" ||
    auth.session.role === "stock_officer";
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [branchId, setBranchId] = React.useState(
    auth.session.branch_id ?? DEFAULT_BRANCH_ID,
  );
  const [supplierId, setSupplierId] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState<number | null>(1);
  const [unitCostNgn, setUnitCostNgn] = React.useState<number | null>(0);
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
  const suppliers = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });
  const purchases = useQuery({
    queryKey: ["purchases", auth.session.branch_id],
    queryFn: () => getPurchases(auth.session.branch_id ?? undefined),
  });
  const createPurchase = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["purchases"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
      message.success(
        "Purchase order created. Receive the delivery to update stock.",
      );
      setModalOpen(false);
    },
  });
  const receivePurchase = useMutation({
    mutationFn: receivePurchaseOrder,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["purchases"] });
      await queryClient.invalidateQueries({ queryKey: ["stock"] });
      await queryClient.invalidateQueries({ queryKey: ["movements"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      message.success("Delivery received and stock movements recorded.");
    },
  });

  const columns: ColumnsType<PurchaseType> = [
    {
      title: "Purchase order",
      dataIndex: "reference",
      key: "reference",
      render: (value: string) => (
        <strong className="table-primary-value">{value}</strong>
      ),
    },
    { title: "Supplier", dataIndex: "supplier_name", key: "supplier_name" },
    {
      title: "Branch",
      key: "branch",
      render: (_value, row) =>
        branches.data?.find((branch) => branch.id === row.branch_id)?.name ??
        "—",
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: date,
    },
    {
      title: "Total cost",
      dataIndex: "total_minor",
      key: "total_minor",
      align: "right",
      render: (value: number) => <strong>{money(value)}</strong>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    ...(canManagePurchases
      ? [
          {
            title: "Action",
            key: "action",
            render: (_value: unknown, row: PurchaseType) =>
              row.status === "ordered" ? (
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<Truck size={14} />}
                  loading={receivePurchase.isPending}
                  onClick={() => receivePurchase.mutate(row.id)}
                >
                  Receive delivery
                </Button>
              ) : (
                <span className="muted-cell">No action</span>
              ),
          },
        ]
      : []),
  ];

  async function handleCreate() {
    if (
      !supplierId ||
      !productId ||
      !quantity ||
      quantity <= 0 ||
      unitCostNgn === null ||
      unitCostNgn < 0
    ) {
      message.warning(
        "Choose a supplier and product, then enter a valid quantity and unit cost.",
      );
      return;
    }
    try {
      await createPurchase.mutateAsync({
        branch_id: branchId,
        supplier_id: supplierId,
        items: [
          {
            product_id: productId,
            quantity,
            unit_cost_minor: Math.round(unitCostNgn * 100),
          },
        ],
      });
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Could not create purchase order",
      );
    }
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Procurement"
        title="Purchases & receiving"
        description="Track supplier orders and update inventory only when deliveries are physically received."
        action={
          canManagePurchases ? (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setBranchId(auth.session.branch_id ?? DEFAULT_BRANCH_ID);
                setSupplierId("");
                setProductId("");
                setQuantity(1);
                setUnitCostNgn(0);
                setModalOpen(true);
              }}
            >
              New purchase order
            </Button>
          ) : null
        }
      />
      <div className="kpi-grid compact-kpi-grid">
        <article className="mini-stat">
          <span>Purchase orders</span>
          <strong>{purchases.data?.length ?? 0}</strong>
          <small>In current branch scope</small>
        </article>
        <article className="mini-stat">
          <span>Awaiting delivery</span>
          <strong>
            {purchases.data?.filter((purchase) => purchase.status === "ordered")
              .length ?? 0}
          </strong>
          <small>Ordered, not yet received</small>
        </article>
        <article className="mini-stat">
          <span>Suppliers</span>
          <strong>{suppliers.data?.length ?? 0}</strong>
          <small>Available supplier records</small>
        </article>
      </div>
      <SectionCardSecondary
        title="Purchase register"
        subtitle="Receiving a purchase writes stock movement records."
      >
        <DataTableSecondary<PurchaseType>
          columns={columns}
          data={purchases.data ?? []}
          rowKey="id"
          loading={purchases.isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </SectionCardSecondary>
      {canManagePurchases ? (
        <Modal
          title="Create purchase order"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleCreate}
          okText="Create order"
          confirmLoading={createPurchase.isPending}
          destroyOnHidden
        >
          <p className="modal-intro">
            This demo supports one line item per purchase order. Receiving the
            order adds stock to the selected branch and records a stock
            movement.
          </p>
          <div className="dialog-form">
            <label>Deliver to branch</label>
            <Select
              value={branchId}
              disabled={!auth.isAdmin}
              onChange={setBranchId}
              options={(branches.data ?? []).map((branch) => ({
                value: branch.id,
                label: branch.name,
              }))}
            />
            <label>Supplier</label>
            <Select
              value={supplierId || undefined}
              onChange={setSupplierId}
              placeholder="Choose supplier"
              options={(suppliers.data ?? []).map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              }))}
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
            <label>Quantity</label>
            <InputNumber
              style={{ width: "100%" }}
              min={0.01}
              value={quantity}
              onChange={setQuantity}
            />
            <label>Unit cost (NGN)</label>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              prefix="₦"
              value={unitCostNgn}
              onChange={setUnitCostNgn}
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
