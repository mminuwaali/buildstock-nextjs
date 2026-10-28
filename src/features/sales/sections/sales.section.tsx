"use client";

import React from "react";
import {
  Alert,
  Button,
  Input,
  Modal,
  Descriptions,
  Empty,
  message,
} from "antd";
import { Printer, Search, ShoppingCart } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useAuth } from "@/components/providers/auth-provider";
import { useChangeSaleStatus, useSales } from "@/features/sales/hooks";
import { getItemsForSale } from "@/features/sales/api";
import type { SaleType, SaleItemType } from "@/features/sales/schema";
import { useQuery } from "@tanstack/react-query";
import {
  PageHeadingSecondary,
  DataTableSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function SalesSection() {
  const auth = useAuth();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedSale, setSelectedSale] = React.useState<SaleType | null>(null);
  const changeSaleStatus = useChangeSaleStatus();
  const canReverseSale =
    auth.session.role === "owner_admin" ||
    auth.session.role === "store_manager";
  const sales = useSales(auth.session.branch_id, search, page);
  const saleItems = useQuery({
    queryKey: ["sale-items", selectedSale?.id],
    queryFn: () => getItemsForSale(selectedSale?.id ?? ""),
    enabled: Boolean(selectedSale?.id),
  });

  const columns: ColumnsType<SaleType> = [
    {
      title: "Receipt",
      dataIndex: "receipt_number",
      key: "receipt_number",
      render: (value: string) => (
        <strong className="table-primary-value">{value}</strong>
      ),
    },
    {
      title: "Date & time",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) => formatDate(value),
    },
    { title: "Customer", dataIndex: "customer_name", key: "customer_name" },
    {
      title: "Payment method",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (value: string) => (
        <span className="capitalize-text">{value.replaceAll("_", " ")}</span>
      ),
    },
    {
      title: "Payment status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      title: "Total",
      dataIndex: "total_minor",
      key: "total_minor",
      align: "right",
      render: (value: number) => <strong>{money(value)}</strong>,
    },
    {
      title: "Sync",
      dataIndex: "sync_status",
      key: "sync_status",
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      title: "",
      key: "actions",
      render: (_value, record) => (
        <Button size="small" onClick={() => setSelectedSale(record)}>
          View receipt
        </Button>
      ),
    },
  ];

  function printReceipt() {
    window.print();
  }

  function requestSaleStatusChange(status: "voided" | "returned") {
    if (!selectedSale) return;
    const actionLabel =
      status === "voided"
        ? "void this sale and return the goods to stock"
        : "record a full goods return and restore the stock";
    Modal.confirm({
      title: status === "voided" ? "Void sale?" : "Record full return?",
      content: `This will ${actionLabel}. It will not send a payment refund or cancel an external POS transaction. Continue only after the physical goods and payment situation have been checked.`,
      okText: status === "voided" ? "Void sale" : "Record return",
      okButtonProps: { danger: status === "voided" },
      onOk: async function () {
        try {
          const result = await changeSaleStatus.mutateAsync({
            sale_id: selectedSale.id,
            status,
            actor_name: auth.session.full_name,
          });
          setSelectedSale(result.sale);
          message.success(
            status === "voided"
              ? "Sale voided and stock reversal recorded locally."
              : "Full goods return recorded locally.",
          );
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : "Could not update sale status",
          );
        }
      },
    });
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Transaction register"
        title="Sales"
        description="Every sale is retained with its payment status and local synchronization state."
        action={
          <Link href={ROUTES.pos}>
            <Button type="primary" icon={<ShoppingCart size={16} />}>
              New sale
            </Button>
          </Link>
        }
      />
      <SectionCardSecondary
        title="All transactions"
        subtitle="Use the receipt record to inspect payment and sync state."
      >
        <div className="table-toolbar">
          <Input
            allowClear
            prefix={<Search size={16} />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search receipt, customer or payment reference…"
          />
          <span className="table-result-count">
            {sales.data?.count ?? 0} records
          </span>
        </div>
        <DataTableSecondary<SaleType>
          columns={columns}
          data={sales.data?.results ?? []}
          rowKey="id"
          loading={sales.isLoading}
          pagination={{
            current: page,
            pageSize: 10,
            total: sales.data?.count ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </SectionCardSecondary>
      <Modal
        title="Sale receipt"
        open={Boolean(selectedSale)}
        onCancel={() => setSelectedSale(null)}
        footer={
          <div className="receipt-modal-actions">
            {canReverseSale && selectedSale?.sale_status === "completed" ? (
              <>
                <Button
                  danger
                  onClick={() => requestSaleStatusChange("voided")}
                  loading={changeSaleStatus.isPending}
                >
                  Void sale
                </Button>
                <Button
                  onClick={() => requestSaleStatusChange("returned")}
                  loading={changeSaleStatus.isPending}
                >
                  Record full return
                </Button>
              </>
            ) : null}
            <Button icon={<Printer size={15} />} onClick={printReceipt}>
              Print receipt
            </Button>
          </div>
        }
        width={680}
      >
        {selectedSale ? (
          <div className="receipt-paper">
            <div className="receipt-brand">
              <span className="brand-mark">
                <ShoppingCart size={18} />
              </span>
              <div>
                <h2>BuildStock</h2>
                <small>CONSTRUCTION SUPPLY RECEIPT</small>
              </div>
            </div>
            <div className="receipt-reference">
              <strong>{selectedSale.receipt_number}</strong>
              <span>{formatDate(selectedSale.created_at)}</span>
            </div>
            <Descriptions
              column={2}
              size="small"
              items={[
                {
                  key: "customer",
                  label: "Customer",
                  children: selectedSale.customer_name,
                },
                {
                  key: "payment",
                  label: "Payment",
                  children: selectedSale.payment_method.replaceAll("_", " "),
                },
                {
                  key: "payment-status",
                  label: "Payment status",
                  children: (
                    <StatusBadge status={selectedSale.payment_status} />
                  ),
                },
                {
                  key: "sync",
                  label: "Sync status",
                  children: <StatusBadge status={selectedSale.sync_status} />,
                },
              ]}
            />
            <div className="receipt-items">
              {saleItems.data && saleItems.data.length ? (
                saleItems.data.map((item: SaleItemType) => (
                  <div className="receipt-line" key={item.id}>
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <strong>{money(item.line_total_minor)}</strong>
                  </div>
                ))
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Line items are not present for this seeded historical receipt."
                />
              )}
            </div>
            <div className="receipt-total">
              <span>Total</span>
              <strong>{money(selectedSale.total_minor)}</strong>
            </div>
            {selectedSale.payment_status === "awaiting_verification" ? (
              <p className="receipt-warning">
                Electronic payment awaiting verification. This receipt is not
                proof of terminal settlement.
              </p>
            ) : null}
            {selectedSale.sale_status !== "completed" ? (
              <Alert
                className="receipt-action-note"
                type="warning"
                showIcon
                message={`Sale status: ${selectedSale.sale_status}. Goods were returned to stock locally.`}
                description="The prototype does not process an actual customer refund or reverse a terminal transaction."
              />
            ) : null}
            <p className="receipt-thanks">Thank you for your business.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
