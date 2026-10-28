"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPurchaseOrder,
  getPurchases,
  getSuppliers,
  receivePurchaseOrder,
} from "@/features/purchases/api";

export function usePurchases(branchId?: string) {
  return useQuery({
    queryKey: ["purchases", branchId ?? "all"],
    queryFn: () => getPurchases(branchId),
  });
}

export function useSuppliers() {
  return useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["purchases"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: receivePurchaseOrder,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["purchases"] });
      await queryClient.invalidateQueries({ queryKey: ["stock"] });
      await queryClient.invalidateQueries({ queryKey: ["movements"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
