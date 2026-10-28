import * as yup from "yup";

export const WorkspaceSettingsSchema = yup.object({
  compact_tables: yup.boolean().default(true),
  sound_enabled: yup.boolean().default(false),
  low_stock_alerts: yup.boolean().default(true),
  terminal_integration: yup.boolean().default(false),
});
export type WorkspaceSettingsType = yup.InferType<
  typeof WorkspaceSettingsSchema
>;
