import {
  WorkspaceSettingsSchema,
  type WorkspaceSettingsType,
} from "@/features/profile/schema";

const SETTINGS_KEY = "buildstock:settings";

export function parseWorkspaceSettings(value: unknown) {
  return WorkspaceSettingsSchema.validate(value, {
    abortEarly: false,
    stripUnknown: true,
  });
}

/** Browser-only preference adapter, not a server settings endpoint. */
export function saveWorkspaceSettings(settings: WorkspaceSettingsType) {
  const validated = WorkspaceSettingsSchema.validateSync(settings, {
    abortEarly: false,
    stripUnknown: true,
  });
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(validated));
  return validated;
}
