"use client";

import React from "react";
import { Alert, Button, Input, InputNumber, Select, Tag, message } from "antd";
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  WifiOff,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import { useProducts } from "@/features/catalog/hooks";
import { useStockBalances } from "@/features/inventory/hooks";
import { useCompleteSale } from "@/features/sales/hooks";
import type { ProductType } from "@/features/catalog/schema";
import { DEFAULT_BRANCH_ID } from "@/constants/settings";
import { PageHeadingSecondary } from "@/components/elements/secondary";

type CartItemType = { product: ProductType; quantity: number };
function money(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function PosSection() {
  const auth = useAuth();
  const connectivity = useConnectivity();
  const branchId = auth.session.branch_id ?? DEFAULT_BRANCH_ID;
  const [search, setSearch] = React.useState("");
  const [cart, setCart] = React.useState<CartItemType[]>([]);
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "bank_transfer" | "external_pos"
  >("cash");
  const [paymentReference, setPaymentReference] = React.useState("");
  const [customerName, setCustomerName] = React.useState("Walk-in customer");
  const [lastReceipt, setLastReceipt] = React.useState("");
  const products = useProducts(search, 1, 100);
  const balances = useStockBalances(branchId);
  const completeSale = useCompleteSale();
  const cartSubtotal = cart.reduce(
    (total, item) =>
      total + Math.round(item.product.sale_price_minor * item.quantity),
    0,
  );
  const balanceRows = balances.data ?? [];

  function quantityFor(productId: string) {
    return (
      balanceRows.find((row) => row.product_id === productId)?.quantity ?? 0
    );
  }

  function addProduct(product: ProductType) {
    if (quantityFor(product.id) <= 0) {
      message.warning("No available stock recorded at this store.");
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing)
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(quantityFor(product.id), item.quantity + 1),
              }
            : item,
        );
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number | null) {
    if (!quantity || quantity <= 0) {
      setCart((current) =>
        current.filter((item) => item.product.id !== productId),
      );
      return;
    }
    setCart((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantityFor(productId), quantity) }
          : item,
      ),
    );
  }

  async function handleCompleteSale() {
    if (auth.isAdmin && !auth.session.branch_id) {
      message.warning(
        "Choose a store in the top bar before completing a sale.",
      );
      return;
    }
    if (!cart.length) {
      message.warning("Add at least one product to the cart.");
      return;
    }
    try {
      const result = await completeSale.mutateAsync({
        branch_id: branchId,
        cashier_id: auth.session.user_id,
        customer_name: customerName || "Walk-in customer",
        discount_minor: 0,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });
      setLastReceipt(result.sale.receipt_number);
      setCart([]);
      setPaymentReference("");
      setCustomerName("Walk-in customer");
      message.success(
        paymentMethod === "external_pos"
          ? "Sale recorded. Terminal payment is awaiting verification."
          : "Sale recorded locally and queued for sync.",
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not complete sale",
      );
    }
  }

  return (
    <div className="page-stack pos-page">
      <PageHeadingSecondary
        eyebrow="Point of sale"
        title="Make the next sale count."
        description="Fast checkout for construction materials. Stock is deducted only from the selected store."
        action={
          <span
            className={`connection-pill ${connectivity.isOnline ? "online" : "offline"}`}
          >
            {connectivity.isOnline ? (
              <CheckCircle2 size={15} />
            ) : (
              <WifiOff size={15} />
            )}
            {connectivity.isOnline ? "Online" : "Offline sale mode"}
          </span>
        }
      />
      {auth.isAdmin && !auth.session.branch_id ? (
        <Alert
          type="info"
          showIcon
          message="Select a store before checkout"
          description="Choose a physical store from the branch selector in the top bar. This prevents an all-branches admin view from accidentally recording a sale against the default branch."
        />
      ) : null}
      {!connectivity.isOnline ? (
        <Alert
          type="warning"
          showIcon
          message="You are offline"
          description="Sales will be stored on this device and remain pending until the demo sync is run after connectivity returns. This prototype does not sync to other devices."
        />
      ) : null}
      {lastReceipt ? (
        <Alert
          type="success"
          showIcon
          closable
          message={`Sale ${lastReceipt} was saved on this device.`}
          description="Print-ready receipt details are available in Sales. The transaction is pending simulated synchronization."
        />
      ) : null}
      <div className="pos-layout">
        <section className="pos-catalog-panel">
          <div className="pos-catalog-head">
            <div>
              <h2>Product catalog</h2>
              <p>Select products to add them to the sale.</p>
            </div>
            <Tag>{products.data?.count ?? 0} products</Tag>
          </div>
          <Input
            size="large"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            prefix={<Search size={17} />}
            placeholder="Search product, SKU or category…"
            allowClear
          />
          <div className="pos-product-grid">
            {(products.data?.results ?? [])
              .filter((product) => product.active)
              .map((product) => (
                <button
                  className="pos-product-card"
                  key={product.id}
                  onClick={() => addProduct(product)}
                  disabled={quantityFor(product.id) <= 0}
                >
                  <span className="pos-product-thumb">
                    <Package size={24} />
                  </span>
                  <span className="pos-product-category">
                    {product.category}
                  </span>
                  <strong>{product.name}</strong>
                  <small>
                    {product.sku} · {product.unit}
                  </small>
                  <span className="pos-product-footer">
                    <b>{money(product.sale_price_minor)}</b>
                    <i>{quantityFor(product.id)} in stock</i>
                  </span>
                </button>
              ))}
          </div>
          {products.isLoading ? (
            <div className="loading-inline">Loading cached products…</div>
          ) : null}
        </section>
        <aside className="pos-cart-panel">
          <div className="pos-cart-heading">
            <span className="pos-cart-icon">
              <ShoppingCart size={19} />
            </span>
            <div>
              <h2>Current sale</h2>
              <p>
                {cart.length} line item{cart.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="pos-cart-customer">
            <label htmlFor="customer-name">Customer / site name</label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Walk-in customer"
            />
          </div>
          <div className="pos-cart-items">
            {cart.map((item) => (
              <div className="pos-cart-item" key={item.product.id}>
                <div className="pos-cart-item-main">
                  <strong>{item.product.name}</strong>
                  <small>
                    {money(item.product.sale_price_minor)} / {item.product.unit}
                  </small>
                  <div className="quantity-stepper">
                    <Button
                      type="text"
                      size="small"
                      icon={<Minus size={13} />}
                      aria-label={`Decrease ${item.product.name}`}
                      onClick={() =>
                        changeQuantity(item.product.id, item.quantity - 1)
                      }
                    />
                    <InputNumber
                      size="small"
                      min={1}
                      max={quantityFor(item.product.id)}
                      value={item.quantity}
                      onChange={(value) =>
                        changeQuantity(item.product.id, value)
                      }
                      controls={false}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<Plus size={13} />}
                      aria-label={`Increase ${item.product.name}`}
                      onClick={() =>
                        changeQuantity(item.product.id, item.quantity + 1)
                      }
                    />
                  </div>
                </div>
                <div className="pos-cart-item-total">
                  <strong>
                    {money(item.product.sale_price_minor * item.quantity)}
                  </strong>
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<Trash2 size={14} />}
                    aria-label={`Remove ${item.product.name}`}
                    onClick={() =>
                      setCart((current) =>
                        current.filter(
                          (entry) => entry.product.id !== item.product.id,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            {cart.length === 0 ? (
              <div className="empty-cart">
                <span>
                  <ShoppingCart size={25} />
                </span>
                <strong>Your sale is empty</strong>
                <p>Choose products from the catalog to get started.</p>
              </div>
            ) : null}
          </div>
          <div className="pos-payment-section">
            <label>Payment method</label>
            <Select
              value={paymentMethod}
              onChange={setPaymentMethod}
              options={[
                { value: "cash", label: "Cash" },
                { value: "bank_transfer", label: "Bank transfer" },
                { value: "external_pos", label: "External POS terminal" },
              ]}
            />
            {paymentMethod === "external_pos" ? (
              <>
                <label htmlFor="payment-reference">
                  Terminal transaction reference
                </label>
                <Input
                  id="payment-reference"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Enter terminal reference"
                />
                <Alert
                  type="info"
                  showIcon
                  message="Manual terminal record"
                  description="Payment stays awaiting verification in this prototype. No live terminal connection is configured."
                />
              </>
            ) : null}
          </div>
          <div className="pos-total-area">
            <div>
              <span>Subtotal</span>
              <strong>{money(cartSubtotal)}</strong>
            </div>
            <div className="pos-grand-total">
              <span>Total due</span>
              <strong>{money(cartSubtotal)}</strong>
            </div>
            <Button
              type="primary"
              block
              size="large"
              disabled={
                !cart.length || (auth.isAdmin && !auth.session.branch_id)
              }
              loading={completeSale.isPending}
              onClick={handleCompleteSale}
            >
              Complete sale · {money(cartSubtotal)}
            </Button>
            <small className="pos-footer-note">
              Local-first checkout. Sale, items, stock movement and sync queue
              save together.
            </small>
          </div>
        </aside>
      </div>
    </div>
  );
}
