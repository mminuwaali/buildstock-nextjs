"use client";

import React from "react";
import * as yup from "yup";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  message,
} from "antd";
import { Formik } from "formik";
import { Download, PackagePlus, Plus, Search } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useProducts, useCreateProduct } from "@/features/catalog/hooks";
import type { ProductType } from "@/features/catalog/schema";
import {
  PageHeadingSecondary,
  DataTableSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import { useAuth } from "@/components/providers/auth-provider";

const productFormSchema = yup.object({
  sku: yup.string().trim().required("SKU is required"),
  name: yup.string().trim().required("Product name is required"),
  category: yup.string().required("Choose a category"),
  description: yup.string().default(""),
  unit: yup.string().required("Choose a unit"),
  sale_price_ngn: yup
    .number()
    .moreThan(0, "Price must be greater than zero")
    .required("Selling price is required"),
  reorder_level: yup.number().min(0).required("Reorder level is required"),
  active: yup.boolean().required(),
});
type ProductFormType = yup.InferType<typeof productFormSchema>;
const categories = [
  "Cement & binders",
  "Steel & reinforcement",
  "Blocks & masonry",
  "Aggregates",
  "Paint & finishing",
  "Tiles & flooring",
  "Hardware",
  "Roofing",
  "Plumbing",
  "Electrical",
  "Timber & boards",
  "Tools & safety",
];
const units = [
  "bag",
  "length",
  "piece",
  "truckload",
  "tonne",
  "bucket",
  "box",
  "coil",
  "kg",
  "sheet",
  "litre",
  "m³",
  "pack",
];
function money(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function ProductsSection() {
  const auth = useAuth();
  const canManageCatalog =
    auth.session.role === "owner_admin" ||
    auth.session.role === "store_manager" ||
    auth.session.role === "stock_officer";
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [modalOpen, setModalOpen] = React.useState(false);
  const products = useProducts(search, page, 10);
  const createProduct = useCreateProduct();
  const initialValues = React.useMemo<ProductFormType>(
    () => ({
      sku: "",
      name: "",
      category: categories[0],
      description: "",
      unit: "bag",
      sale_price_ngn: 0,
      reorder_level: 10,
      active: true,
    }),
    [],
  );

  const columns: ColumnsType<ProductType> = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (value: string, record: ProductType) => (
        <div className="product-cell">
          <span className="product-thumb-small">
            <PackagePlus size={17} />
          </span>
          <span>
            <strong>{value}</strong>
            <small>{record.description || record.category}</small>
          </span>
        </div>
      ),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      render: (value: string) => <span className="code-text">{value}</span>,
    },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      render: (value: string) => (
        <span className="capitalize-text">{value}</span>
      ),
    },
    {
      title: "Selling price",
      dataIndex: "sale_price_minor",
      key: "sale_price_minor",
      align: "right",
      render: (value: number) => <strong>{money(value)}</strong>,
    },
    {
      title: "Reorder at",
      dataIndex: "reorder_level",
      key: "reorder_level",
      align: "right",
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (value: boolean) => (
        <StatusBadge status={value ? "active" : "inactive"} />
      ),
    },
  ];

  async function handleCreate(values: ProductFormType) {
    try {
      await createProduct.mutateAsync({
        ...values,
        sale_price_minor: Math.round(values.sale_price_ngn * 100),
      });
      setModalOpen(false);
      message.success(
        "Product added to the catalog. Opening stock is zero in each branch.",
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not create product",
      );
    }
  }

  function exportCsv() {
    const rows = products.data?.results ?? [];
    const csv = [
      "SKU,Name,Category,Unit,Price NGN,Reorder Level,Active",
      ...rows.map((product) =>
        [
          product.sku,
          product.name,
          product.category,
          product.unit,
          product.sale_price_minor / 100,
          product.reorder_level,
          product.active,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = "buildstock-products.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Catalog management"
        title="Products"
        description="A shared catalog with consistent SKUs, units and selling prices. Stock remains specific to each branch."
        action={
          <div className="heading-actions">
            <Button icon={<Download size={15} />} onClick={exportCsv}>
              Export CSV
            </Button>
            {canManageCatalog ? (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setModalOpen(true)}
              >
                Add product
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="kpi-grid compact-kpi-grid">
        <article className="mini-stat">
          <span>Catalog items</span>
          <strong>{products.data?.count ?? 0}</strong>
          <small>Active sellable products</small>
        </article>
        <article className="mini-stat">
          <span>Categories</span>
          <strong>{categories.length}</strong>
          <small>Construction supply groups</small>
        </article>
        <article className="mini-stat">
          <span>Currency</span>
          <strong>NGN</strong>
          <small>Prices stored in kobo</small>
        </article>
      </div>
      <SectionCardSecondary
        title="Product catalog"
        subtitle="Search by product name, SKU or category"
      >
        <div className="table-toolbar">
          <Input
            allowClear
            prefix={<Search size={16} />}
            placeholder="Search catalog…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <span className="table-result-count">
            {products.data?.count ?? 0} products
          </span>
        </div>
        <DataTableSecondary<ProductType>
          columns={columns}
          data={products.data?.results ?? []}
          rowKey="id"
          loading={products.isLoading}
          pagination={{
            current: page,
            pageSize: 10,
            total: products.data?.count ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </SectionCardSecondary>
      {canManageCatalog ? (
        <Modal
          title="Add catalog product"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          footer={null}
          destroyOnHidden
          width={600}
        >
          <p className="modal-intro">
            New catalog items start with zero stock at every branch. Receive a
            purchase or record an opening balance to put stock on hand.
          </p>
          <Formik
            initialValues={initialValues}
            validationSchema={productFormSchema}
            onSubmit={handleCreate}
            enableReinitialize
          >
            {(formikCtx) => (
              <Form layout="vertical" onFinish={formikCtx.handleSubmit}>
                <div className="form-two-column">
                  <Form.Item
                    label="Product name"
                    required
                    validateStatus={
                      formikCtx.touched.name && formikCtx.errors.name
                        ? "error"
                        : ""
                    }
                    help={formikCtx.touched.name ? formikCtx.errors.name : ""}
                  >
                    <Input
                      name="name"
                      value={formikCtx.values.name}
                      onChange={formikCtx.handleChange}
                      onBlur={formikCtx.handleBlur}
                      placeholder="e.g. Portland cement 50kg"
                    />
                  </Form.Item>
                  <Form.Item
                    label="SKU / product code"
                    required
                    validateStatus={
                      formikCtx.touched.sku && formikCtx.errors.sku
                        ? "error"
                        : ""
                    }
                    help={formikCtx.touched.sku ? formikCtx.errors.sku : ""}
                  >
                    <Input
                      name="sku"
                      value={formikCtx.values.sku}
                      onChange={formikCtx.handleChange}
                      onBlur={formikCtx.handleBlur}
                      placeholder="e.g. CEM-50-001"
                    />
                  </Form.Item>
                </div>
                <div className="form-two-column">
                  <Form.Item label="Category" required>
                    <Select
                      value={formikCtx.values.category}
                      onChange={(value) =>
                        formikCtx.setFieldValue("category", value)
                      }
                      options={categories.map((category) => ({
                        value: category,
                        label: category,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item label="Unit of measure" required>
                    <Select
                      value={formikCtx.values.unit}
                      onChange={(value) =>
                        formikCtx.setFieldValue("unit", value)
                      }
                      options={units.map((unit) => ({
                        value: unit,
                        label: unit,
                      }))}
                    />
                  </Form.Item>
                </div>
                <Form.Item label="Description">
                  <Input
                    name="description"
                    value={formikCtx.values.description}
                    onChange={formikCtx.handleChange}
                    placeholder="Optional product details"
                  />
                </Form.Item>
                <div className="form-two-column">
                  <Form.Item
                    label="Selling price (NGN)"
                    required
                    validateStatus={
                      formikCtx.touched.sale_price_ngn &&
                      formikCtx.errors.sale_price_ngn
                        ? "error"
                        : ""
                    }
                    help={
                      formikCtx.touched.sale_price_ngn
                        ? formikCtx.errors.sale_price_ngn
                        : ""
                    }
                  >
                    <InputNumber
                      min={0.01}
                      precision={2}
                      style={{ width: "100%" }}
                      value={formikCtx.values.sale_price_ngn}
                      onChange={(value) =>
                        formikCtx.setFieldValue("sale_price_ngn", value ?? 0)
                      }
                      prefix="₦"
                    />
                  </Form.Item>
                  <Form.Item label="Reorder level" required>
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      value={formikCtx.values.reorder_level}
                      onChange={(value) =>
                        formikCtx.setFieldValue("reorder_level", value ?? 0)
                      }
                    />
                  </Form.Item>
                </div>
                <Form.Item label="Available for sale">
                  <Switch
                    checked={formikCtx.values.active}
                    onChange={(value) =>
                      formikCtx.setFieldValue("active", value)
                    }
                  />
                </Form.Item>
                <div className="modal-footer">
                  <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createProduct.isPending}
                  >
                    Save product
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      ) : null}
    </div>
  );
}
