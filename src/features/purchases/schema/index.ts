import * as yup from "yup";

export const SupplierSchema = yup.object({
  id: yup.string().uuid().required(),
  name: yup.string().required(),
  contact_name: yup.string().required(),
  phone: yup.string().required(),
  email: yup.string().email().required(),
  status: yup
    .mixed<"active" | "inactive">()
    .oneOf(["active", "inactive"])
    .required(),
});
export const PurchaseSchema = yup.object({
  id: yup.string().uuid().required(),
  reference: yup.string().required(),
  branch_id: yup.string().uuid().required(),
  supplier_id: yup.string().uuid().required(),
  supplier_name: yup.string().required(),
  status: yup
    .mixed<"draft" | "ordered" | "received" | "cancelled">()
    .oneOf(["draft", "ordered", "received", "cancelled"])
    .required(),
  total_minor: yup.number().integer().min(0).required(),
  created_at: yup.string().required(),
});
export type SupplierType = yup.InferType<typeof SupplierSchema>;
export type PurchaseType = yup.InferType<typeof PurchaseSchema>;

export const PurchaseItemSchema = yup.object({
  id: yup.string().uuid().required(),
  purchase_id: yup.string().uuid().required(),
  product_id: yup.string().uuid().required(),
  product_name: yup.string().required(),
  quantity: yup.number().moreThan(0).required(),
  unit_cost_minor: yup.number().integer().min(0).required(),
  line_total_minor: yup.number().integer().min(0).required(),
});
export type PurchaseItemType = yup.InferType<typeof PurchaseItemSchema>;
