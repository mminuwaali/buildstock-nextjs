"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addProduct, getProducts } from "@/features/catalog/api";
import type { ProductCreateType } from "@/features/catalog/schema";
import { queryKeys } from "@/components/providers/query/keys";

export function useProducts(search: string, page: number, pageSize = 10) {
  return useQuery({
    queryKey: queryKeys.products(search, page, pageSize),
    queryFn: () => getProducts({ search, page, page_size: pageSize }),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductCreateType) => addProduct(payload),
    onSuccess: async function () {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
