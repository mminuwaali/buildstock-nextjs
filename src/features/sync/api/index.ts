import {
  listOutbox,
  resolveSyncDiscrepancy,
  simulateSync,
} from "@/libraries/mock-api/repository";

export function getSyncQueue(branchId?: string) {
  return listOutbox(branchId);
}

export function syncPendingOperations(branchId?: string) {
  return simulateSync(branchId);
}

export function resolveSyncReview(input: {
  operation_id: string;
  actor_name: string;
  note: string;
}) {
  return resolveSyncDiscrepancy(input);
}
