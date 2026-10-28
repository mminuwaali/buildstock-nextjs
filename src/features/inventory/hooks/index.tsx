"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustStock,
  getStockBalances,
  getStockMovements,
} from "@/features/inventory/api";
import { queryKeys } from "@/components/providers/query/keys";

export function useStockBalances(branchId: string | null) {
  return useQuery({
    queryKey: queryKeys.stock(branchId ?? undefined),
    queryFn: () => getStockBalances(branchId ?? undefined),
  });
}

export function useStockMovements(branchId: string | null) {
  return useQuery({
    queryKey: queryKeys.movements(branchId ?? undefined),
    queryFn: () => getStockMovements(branchId ?? undefined),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["stock"] });
      await queryClient.invalidateQueries({ queryKey: ["movements"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
