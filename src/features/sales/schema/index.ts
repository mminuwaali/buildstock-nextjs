import * as yup from "yup";

export const SaleItemSchema = yup.object({
  id: yup.string().uuid().required(),
  sale_id: yup.string().uuid().required(),
  product_id: yup.string().uuid().required(),
  product_name: yup.string().required(),
  sku: yup.string().required(),
  quantity: yup.number().moreThan(0).required(),
  unit_price_minor: yup.number().integer().min(0).required(),
  line_total_minor: yup.number().integer().min(0).required(),
});

export const SaleSchema = yup.object({
  id: yup.string().uuid().required(),
  receipt_number: yup.string().required(),
  branch_id: yup.string().uuid().required(),
  cashier_id: yup.string().uuid().required(),
  customer_name: yup.string().default("Walk-in customer"),
  subtotal_minor: yup.number().integer().min(0).required(),
  discount_minor: yup.number().integer().min(0).required(),
  total_minor: yup.number().integer().min(0).required(),
  payment_method: yup
    .mixed<"cash" | "bank_transfer" | "external_pos">()
    .oneOf(["cash", "bank_transfer", "external_pos"])
    .required(),
  payment_status: yup
    .mixed<"confirmed" | "awaiting_verification" | "failed">()
    .oneOf(["confirmed", "awaiting_verification", "failed"])
    .required(),
  sale_status: yup
    .mixed<"completed" | "voided" | "returned">()
    .oneOf(["completed", "voided", "returned"])
    .required(),
  sync_status: yup
    .mixed<"pending" | "syncing" | "synced" | "needs_review" | "rejected">()
    .oneOf(["pending", "syncing", "synced", "needs_review", "rejected"])
    .required(),
  payment_reference: yup.string().default(""),
  created_at: yup.string().required(),
});

export const CompleteSaleRequestSchema = yup.object({
  branch_id: yup.string().uuid().required(),
  cashier_id: yup.string().uuid().required(),
  customer_name: yup.string().default("Walk-in customer"),
  discount_minor: yup.number().integer().min(0).default(0),
  payment_method: yup
    .mixed<"cash" | "bank_transfer" | "external_pos">()
    .oneOf(["cash", "bank_transfer", "external_pos"])
    .required(),
  payment_reference: yup.string().default(""),
  items: yup
    .array()
    .of(
      yup.object({
        product_id: yup.string().uuid().required(),
        quantity: yup.number().moreThan(0).required(),
      }),
    )
    .min(1)
    .required(),
});

export type SaleType = yup.InferType<typeof SaleSchema>;
export type SaleItemType = yup.InferType<typeof SaleItemSchema>;
export type CompleteSaleRequestType = yup.InferType<
  typeof CompleteSaleRequestSchema
>;
