/** Placeholder for a future server-side Django REST Framework transport. No backend is included. */
export function getBackendConfiguration() {
  return { mode: "mock" as const, backendConfigured: false };
}
