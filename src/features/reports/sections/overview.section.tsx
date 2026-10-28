"use client";

import React from "react";
import Link from "next/link";
import { Button, Skeleton, Tag } from "antd";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleAlert,
  Coins,
  PackageSearch,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useAuth } from "@/components/providers/auth-provider";
import { useOverview } from "@/features/reports/hooks";
import {
  PageHeadingSecondary,
  SectionCardSecondary,
  KpiCardSecondary,
  DataTableSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import type { SaleType } from "@/features/sales/schema";
import { ROUTES } from "@/constants/routes";

function formatMoney(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function OverviewSection() {
  const auth = useAuth();
  const overview = useOverview(auth.session.branch_id);
  const saleColumns: ColumnsType<SaleType> = [
    {
      title: "Receipt",
      dataIndex: "receipt_number",
      key: "receipt_number",
      render: (value: string) => (
        <strong className="table-primary-value">{value}</strong>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customer_name",
      key: "customer_name",
      render: (value: string) => value || "Walk-in customer",
    },
    {
      title: "Payment",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (value: string) => (
        <span className="capitalize-text">{value.replaceAll("_", " ")}</span>
      ),
    },
    {
      title: "Total",
      dataIndex: "total_minor",
      key: "total_minor",
      align: "right",
      render: (value: number) => <strong>{formatMoney(value)}</strong>,
    },
    {
      title: "Status",
      dataIndex: "sync_status",
      key: "sync_status",
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Wednesday, 28 October 2026"
        title="Good work starts with a clear view."
        description="Here's how your stores are performing. Keep stock moving and every sale accounted for."
        action={
          <Link href={ROUTES.pos}>
            <Button type="primary" icon={<ShoppingCart size={16} />}>
              New sale
            </Button>
          </Link>
        }
      />
      <div className="dashboard-welcome-row">
        <div className="welcome-copy">
          <span className="welcome-label">
            <TrendingUp size={14} /> OPERATIONS SNAPSHOT
          </span>
          <h2>Every bag, every bar, every branch.</h2>
          <p>Your inventory is the foundation. Make today count.</p>
        </div>
        <div className="welcome-stat">
          <span>Branches in view</span>
          <strong>{overview.data?.branch_count ?? "—"}</strong>
          <small>Active locations</small>
        </div>
        <div className="welcome-stat">
          <span>Products tracked</span>
          <strong>{overview.data?.product_count ?? "—"}</strong>
          <small>Across the catalog</small>
        </div>
      </div>
      <div className="kpi-grid">
        {overview.isLoading ? (
          <>
            <Skeleton active />
            <Skeleton active />
            <Skeleton active />
            <Skeleton active />
          </>
        ) : (
          <>
            <KpiCardSecondary
              label="Sales today"
              value={formatMoney(overview.data?.sales_today_minor ?? 0)}
              hint={`${overview.data?.sales_today_count ?? 0} completed transactions`}
              icon={Coins}
              tone="blue"
              trend="up"
            />
            <KpiCardSecondary
              label="Stock value"
              value={formatMoney(overview.data?.stock_value_minor ?? 0)}
              hint="At current selling prices"
              icon={Boxes}
              tone="orange"
            />
            <KpiCardSecondary
              label="Low stock items"
              value={String(overview.data?.low_stock_count ?? 0)}
              hint="At or below reorder level"
              icon={CircleAlert}
              tone="green"
            />
            <KpiCardSecondary
              label="Pending sync"
              value={String(overview.data?.pending_sync_count ?? 0)}
              hint="Operations on this browser"
              icon={PackageSearch}
              tone="gray"
            />
          </>
        )}
      </div>
      <div className="dashboard-grid-main">
        <SectionCardSecondary
          title="Recent sales"
          subtitle="Latest receipts across your current view"
          action={
            <Link href={ROUTES.sales} className="text-link">
              All sales <ArrowRight size={14} />
            </Link>
          }
        >
          <DataTableSecondary<SaleType>
            columns={saleColumns}
            data={overview.data?.recent_sales ?? []}
            rowKey="id"
            loading={overview.isLoading}
            pagination={false}
            size="small"
          />
        </SectionCardSecondary>
        <SectionCardSecondary
          title="Stock needs attention"
          subtitle="Items that have reached their reorder level"
          action={
            <Link href={ROUTES.inventory} className="text-link">
              View inventory <ArrowRight size={14} />
            </Link>
          }
        >
          <div className="low-stock-list">
            {(overview.data?.low_stock_products ?? [])
              .slice(0, 5)
              .map((product) => (
                <div
                  className="low-stock-item"
                  key={`${product.id}-${product.branch_name}`}
                >
                  <div className="product-initial">
                    {product.name.slice(0, 1)}
                  </div>
                  <div className="low-stock-info">
                    <strong>{product.name}</strong>
                    <small>
                      {product.branch_name} · SKU {product.sku}
                    </small>
                  </div>
                  <div className="low-stock-quantity">
                    <strong>{product.quantity}</strong>
                    <small>
                      {product.unit}
                      {product.quantity === 1 ? "" : "s"} left
                    </small>
                  </div>
                </div>
              ))}
            {(overview.data?.low_stock_products ?? []).length === 0 ? (
              <div className="quiet-success">
                <Tag color="success">All clear</Tag>
                <span>No products are below their reorder level.</span>
              </div>
            ) : null}
          </div>
        </SectionCardSecondary>
      </div>
      <div className="dashboard-grid-bottom">
        <SectionCardSecondary
          title="Branch stock overview"
          subtitle="Estimated retail value of on-hand stock"
          action={
            <Link href={ROUTES.stores} className="text-link">
              Branches <ArrowRight size={14} />
            </Link>
          }
        >
          <div className="branch-list">
            {(overview.data?.branch_stock ?? []).map((branch, index) => (
              <div className="branch-stock-row" key={branch.branch_id}>
                <div className="branch-avatar">
                  {branch.branch_name.slice(0, 1)}
                </div>
                <div className="branch-stock-details">
                  <strong>{branch.branch_name}</strong>
                  <small>{branch.product_count} product balances</small>
                </div>
                <div className="branch-value">
                  <strong>{formatMoney(branch.stock_value_minor)}</strong>
                  <small>
                    {index === 0 ? (
                      <span className="trend-positive">
                        <ArrowUpRight size={12} /> Main
                      </span>
                    ) : (
                      <span className="trend-neutral">
                        <ArrowDownRight size={12} /> Branch
                      </span>
                    )}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </SectionCardSecondary>
        <SectionCardSecondary
          title="Quick actions"
          subtitle="Get straight to the task at hand"
        >
          <div className="quick-actions-grid">
            <Link href={ROUTES.pos} className="quick-action">
              <span className="quick-action-icon orange">
                <ShoppingCart size={18} />
              </span>
              <span>
                <strong>Start a sale</strong>
                <small>Open point of sale</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link href={ROUTES.products} className="quick-action">
              <span className="quick-action-icon blue">
                <PackageSearch size={18} />
              </span>
              <span>
                <strong>Find a product</strong>
                <small>Search catalog and SKU</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link href={ROUTES.inventory} className="quick-action">
              <span className="quick-action-icon green">
                <Boxes size={18} />
              </span>
              <span>
                <strong>Review stock</strong>
                <small>Balances and movements</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link href={ROUTES.sync} className="quick-action">
              <span className="quick-action-icon gray">
                <PackageSearch size={18} />
              </span>
              <span>
                <strong>Check sync queue</strong>
                <small>Pending local operations</small>
              </span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </SectionCardSecondary>
      </div>
      <div className="footnote-row">
        <CircleAlert size={15} />
        <span>
          Demo figures are illustrative. Stock valuation uses selling price, not
          accounting cost. Local sync acknowledgements do not reach other
          devices.
        </span>
      </div>
    </div>
  );
}
