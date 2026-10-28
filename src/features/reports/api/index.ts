import { getDashboardOverview } from "@/libraries/mock-api/repository";

export function getOverview(branchId?: string) {
  return getDashboardOverview(branchId);
}
