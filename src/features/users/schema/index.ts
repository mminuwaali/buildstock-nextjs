import * as yup from "yup";

export const UserRoleSchema = yup
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
  .required();

export const DemoUserSchema = yup.object({
  id: yup.string().uuid().required(),
  full_name: yup.string().trim().required(),
  email: yup.string().email().required(),
  role: UserRoleSchema,
  branch_id: yup.string().uuid().nullable().defined(),
  status: yup
    .mixed<"active" | "invited" | "inactive">()
    .oneOf(["active", "invited", "inactive"])
    .required(),
});
export const InviteUserSchema = yup.object({
  full_name: yup.string().trim().min(2).required(),
  email: yup.string().email().required(),
  role: UserRoleSchema,
  branch_id: yup.string().uuid().nullable().defined(),
});
export const DeviceSchema = yup.object({
  id: yup.string().uuid().required(),
  name: yup.string().trim().required(),
  branch_id: yup.string().uuid().required(),
  status: yup
    .mixed<"online" | "offline" | "attention">()
    .oneOf(["online", "offline", "attention"])
    .required(),
  last_seen_at: yup.string().required(),
});
export const RegisterDeviceSchema = yup.object({
  name: yup.string().trim().min(2).required(),
  branch_id: yup.string().uuid().required(),
});
export type DemoUserType = yup.InferType<typeof DemoUserSchema>;
export type InviteUserType = yup.InferType<typeof InviteUserSchema>;
export type DeviceRecordType = yup.InferType<typeof DeviceSchema>;
export type RegisterDeviceType = yup.InferType<typeof RegisterDeviceSchema>;
