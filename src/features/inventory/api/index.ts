import {
  addStockAdjustment,
  listStockBalances,
  listStockMovements,
} from "@/libraries/mock-api/repository";

export function getStockBalances(branchId?: string) {
  return listStockBalances(branchId);
}

export function getStockMovements(branchId?: string) {
  return listStockMovements(branchId);
}

export function adjustStock(input: {
  branch_id: string;
  product_id: string;
  quantity_delta: number;
  reason: string;
  actor_id: string;
}) {
  return addStockAdjustment(input);
}
