import * as yup from "yup";

export const TransferSchema = yup.object({
  id: yup.string().uuid().required(),
  reference: yup.string().required(),
  source_branch_id: yup.string().uuid().required(),
  destination_branch_id: yup.string().uuid().required(),
  status: yup
    .mixed<"draft" | "dispatched" | "received" | "cancelled">()
    .oneOf(["draft", "dispatched", "received", "cancelled"])
    .required(),
  items_count: yup.number().integer().min(1).required(),
  created_at: yup.string().required(),
});
export type TransferType = yup.InferType<typeof TransferSchema>;

export const TransferItemSchema = yup.object({
  id: yup.string().uuid().required(),
  transfer_id: yup.string().uuid().required(),
  product_id: yup.string().uuid().required(),
  product_name: yup.string().required(),
  quantity: yup.number().moreThan(0).required(),
});
export type TransferItemType = yup.InferType<typeof TransferItemSchema>;
