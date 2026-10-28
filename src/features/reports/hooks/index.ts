"use client";

import { useQuery } from "@tanstack/react-query";
import { getOverview } from "@/features/reports/api";
import { queryKeys } from "@/components/providers/query/keys";

export function useOverview(branchId: string | null) {
  return useQuery({
    queryKey: queryKeys.overview(branchId),
    queryFn: () => getOverview(branchId ?? undefined),
  });
}
