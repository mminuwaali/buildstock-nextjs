import { createBranch, listBranches } from "@/libraries/mock-api/repository";
import type { BranchType } from "@/features/branches/schema";

export function getBranches(branchId?: string) {
  return listBranches(branchId);
}

export function addBranch(
  payload: Omit<BranchType, "id" | "created_at" | "updated_at">,
) {
  return createBranch(payload);
}
