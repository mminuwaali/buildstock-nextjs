import * as yup from "yup";

export const DemoSignInSchema = yup.object({
  email: yup.string().email().required(),
  role: yup
    .mixed<
      "owner_admin" | "store_manager" | "cashier" | "stock_officer" | "auditor"
    >()
    .oneOf([
      "owner_admin",
      "store_manager",
      "cashier",
      "stock_officer",
      "auditor",
    ])
    .required(),
});
export type DemoSignInType = yup.InferType<typeof DemoSignInSchema>;
