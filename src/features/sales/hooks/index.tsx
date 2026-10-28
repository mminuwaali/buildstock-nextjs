"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSale, getSales, updateSaleStatus } from "@/features/sales/api";
import type { CompleteSaleRequestType } from "@/features/sales/schema";
import { queryKeys } from "@/components/providers/query/keys";

export function useSales(
  branchId: string | null,
  search: string,
  page: number,
) {
  return useQuery({
    queryKey: queryKeys.sales(branchId, search, page),
    queryFn: () =>
      getSales(branchId ?? undefined, { search, page, page_size: 10 }),
  });
}

export function useCompleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompleteSaleRequestType) => createSale(payload),
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
      await queryClient.invalidateQueries({ queryKey: ["stock"] });
      await queryClient.invalidateQueries({ queryKey: ["movements"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      await queryClient.invalidateQueries({ queryKey: ["sync"] });
    },
  });
}

export function useChangeSaleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      sale_id: string;
      status: "voided" | "returned";
      actor_name: string;
    }) => updateSaleStatus(input.sale_id, input.status, input.actor_name),
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
      await queryClient.invalidateQueries({ queryKey: ["stock"] });
      await queryClient.invalidateQueries({ queryKey: ["movements"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      await queryClient.invalidateQueries({ queryKey: ["sync"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
