"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSyncQueue,
  resolveSyncReview,
  syncPendingOperations,
} from "@/features/sync/api";
import { queryKeys } from "@/components/providers/query/keys";

export function useSyncQueue(branchId: string | null) {
  return useQuery({
    queryKey: queryKeys.sync(branchId),
    queryFn: () => getSyncQueue(branchId ?? undefined),
    refetchInterval: 10000,
  });
}

export function useSyncPending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncPendingOperations,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["sync"] });
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}

export function useResolveSyncReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveSyncReview,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["sync"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
