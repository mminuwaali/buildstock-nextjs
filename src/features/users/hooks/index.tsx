"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDevices,
  getUsers,
  inviteUser,
  registerDevice,
} from "@/features/users/api";

export function useUsers(branchId?: string) {
  return useQuery({
    queryKey: ["users", branchId ?? "all"],
    queryFn: () => getUsers(branchId),
  });
}

export function useDevices(branchId?: string) {
  return useQuery({
    queryKey: ["devices", branchId ?? "all"],
    queryFn: () => getDevices(branchId),
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerDevice,
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
