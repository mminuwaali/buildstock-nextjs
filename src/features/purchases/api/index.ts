import { listPurchases, listSuppliers } from "@/libraries/mock-api/repository";

export function getSuppliers() {
  return listSuppliers();
}

export function getPurchases(branchId?: string) {
  return listPurchases(branchId);
}

export {
  createPurchaseOrder,
  receivePurchaseOrder,
  listPurchaseItems,
} from "@/libraries/mock-api/repository";
