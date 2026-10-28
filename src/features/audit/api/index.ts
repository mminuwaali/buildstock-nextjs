import { listAuditEvents } from "@/libraries/mock-api/repository";

export function getAuditEvents(branchId?: string) {
  return listAuditEvents(branchId);
}
