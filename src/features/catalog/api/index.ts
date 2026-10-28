import type { ProductCreateType } from "@/features/catalog/schema";
import {
  createProduct,
  listProducts,
  type ListParamsType,
} from "@/libraries/mock-api/repository";

export function getProducts(params: ListParamsType = {}) {
  return listProducts(params);
}

export function addProduct(payload: ProductCreateType) {
  return createProduct(payload);
}
