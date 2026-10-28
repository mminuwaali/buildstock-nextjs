"use client";

import { useQuery } from "@tanstack/react-query";

/** Small typed helper for features that already expose a schema-validating API function. */
export function useGetPage<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
) {
  return useQuery({ queryKey, queryFn, enabled });
}
