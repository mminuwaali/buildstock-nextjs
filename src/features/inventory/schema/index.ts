import * as yup from "yup";

export const StockBalanceSchema = yup.object({
  id: yup.string().uuid().required(),
  branch_id: yup.string().uuid().required(),
  product_id: yup.string().uuid().required(),
  quantity: yup.number().required(),
  updated_at: yup.string().required(),
});

export const StockMovementSchema = yup.object({
  id: yup.string().uuid().required(),
  branch_id: yup.string().uuid().required(),
  product_id: yup.string().uuid().required(),
  movement_type: yup
    .mixed<
      | "opening"
      | "sale"
      | "purchase_receipt"
      | "return"
      | "adjustment"
      | "transfer_out"
      | "transfer_in"
    >()
    .oneOf([
      "opening",
      "sale",
      "purchase_receipt",
      "return",
      "adjustment",
      "transfer_out",
      "transfer_in",
    ])
    .required(),
  quantity_delta: yup.number().required(),
  reference: yup.string().required(),
  reason: yup.string().default(""),
  created_at: yup.string().required(),
  created_by: yup.string().required(),
});

export type StockBalanceType = yup.InferType<typeof StockBalanceSchema>;
export type StockMovementType = yup.InferType<typeof StockMovementSchema>;
