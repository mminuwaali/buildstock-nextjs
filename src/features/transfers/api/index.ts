import { listTransfers } from "@/libraries/mock-api/repository";

export function getTransfers(branchId?: string) {
  return listTransfers(branchId);
}

export {
  createStockTransfer,
  dispatchStockTransfer,
  receiveStockTransfer,
  listTransferItems,
} from "@/libraries/mock-api/repository";
