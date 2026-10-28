"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStockTransfer,
  dispatchStockTransfer,
  getTransfers,
  receiveStockTransfer,
} from "@/features/transfers/api";

export function useTransfers(branchId?: string) {
  return useQuery({
    queryKey: ["transfers", branchId ?? "all"],
    queryFn: () => getTransfers(branchId),
  });
}

export function useTransferActions() {
  const queryClient = useQueryClient();
  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["transfers"] });
    await queryClient.invalidateQueries({ queryKey: ["stock"] });
    await queryClient.invalidateQueries({ queryKey: ["movements"] });
    await queryClient.invalidateQueries({ queryKey: ["overview"] });
    await queryClient.invalidateQueries({ queryKey: ["audit"] });
  }
  const create = useMutation({
    mutationFn: createStockTransfer,
    onSuccess: invalidate,
  });
  const dispatch = useMutation({
    mutationFn: dispatchStockTransfer,
    onSuccess: invalidate,
  });
  const receive = useMutation({
    mutationFn: receiveStockTransfer,
    onSuccess: invalidate,
  });
  return { create, dispatch, receive };
}
