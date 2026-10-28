export const queryKeys = {
  branches: ["branches"] as const,
  products: (search: string, page: number, pageSize: number) =>
    ["products", search, page, pageSize] as const,
  stock: (branchId?: string) => ["stock", branchId] as const,
  movements: (branchId?: string) => ["movements", branchId] as const,
  sales: (branchId: string | null, search: string, page: number) =>
    ["sales", branchId, search, page] as const,
  overview: (branchId?: string | null) => ["overview", branchId] as const,
  sync: (branchId?: string | null) => ["sync", branchId] as const,
  purchases: (branchId?: string | null) => ["purchases", branchId] as const,
  transfers: (branchId?: string | null) => ["transfers", branchId] as const,
  audit: (branchId?: string | null) => ["audit", branchId] as const,
};
