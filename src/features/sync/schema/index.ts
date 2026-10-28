import * as yup from "yup";

export const OutboxOperationSchema = yup.object({
  id: yup.string().uuid().required(),
  operation_id: yup.string().uuid().required(),
  branch_id: yup.string().uuid().required(),
  device_id: yup.string().uuid().required(),
  operation_type: yup.string().required(),
  entity_id: yup.string().uuid().required(),
  payload: yup.mixed().required(),
  status: yup
    .mixed<"pending" | "syncing" | "synced" | "needs_review" | "rejected">()
    .oneOf(["pending", "syncing", "synced", "needs_review", "rejected"])
    .required(),
  review_status: yup
    .mixed<"open" | "resolved">()
    .oneOf(["open", "resolved"])
    .default("open"),
  created_at: yup.string().required(),
  synced_at: yup.string().nullable().default(null),
  last_error: yup.string().default(""),
});
export type OutboxOperationType = yup.InferType<typeof OutboxOperationSchema>;
