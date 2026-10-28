"use client";

import { useQuery } from "@tanstack/react-query";
import { getBranches } from "@/features/branches/api";

export function useBranches(branchId?: string) {
  return useQuery({
    queryKey: ["branches", branchId ?? "all"],
    queryFn: () => getBranches(branchId),
  });
}
