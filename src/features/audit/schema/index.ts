import * as yup from "yup";

export const AuditEventSchema = yup.object({
  id: yup.string().uuid().required(),
  branch_id: yup.string().uuid().nullable().defined(),
  actor_name: yup.string().required(),
  action: yup.string().required(),
  entity: yup.string().required(),
  entity_id: yup.string().required(),
  created_at: yup.string().required(),
  detail: yup.string().required(),
});
export type AuditEventType = yup.InferType<typeof AuditEventSchema>;
