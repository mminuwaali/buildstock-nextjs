"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditEvents } from "@/features/audit/api";

export function useAuditEvents(branchId?: string) {
  return useQuery({
    queryKey: ["audit", branchId ?? "all"],
    queryFn: () => getAuditEvents(branchId),
  });
}
