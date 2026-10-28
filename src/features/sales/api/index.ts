import type { CompleteSaleRequestType } from "@/features/sales/schema";
import {
  changeSaleStatus,
  completeSale,
  getSaleItems,
  listSales,
  type ListParamsType,
} from "@/libraries/mock-api/repository";

export function getSales(branchId?: string, params: ListParamsType = {}) {
  return listSales(branchId, params);
}

export function createSale(payload: CompleteSaleRequestType) {
  return completeSale(payload);
}

export function updateSaleStatus(
  saleId: string,
  status: "voided" | "returned",
  actorName: string,
) {
  return changeSaleStatus(saleId, status, actorName);
}

export function getItemsForSale(saleId: string) {
  return getSaleItems(saleId);
}
