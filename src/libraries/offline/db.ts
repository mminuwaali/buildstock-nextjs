import Dexie, { type EntityTable } from "dexie";

import type { BranchType } from "@/features/branches/schema";
import type { AuditEventType } from "@/features/audit/schema";
import type { ProductType } from "@/features/catalog/schema";
import type {
  StockBalanceType,
  StockMovementType,
} from "@/features/inventory/schema";
import type {
  PurchaseItemType,
  PurchaseType,
  SupplierType,
} from "@/features/purchases/schema";
import type { SaleItemType, SaleType } from "@/features/sales/schema";
import type { OutboxOperationType } from "@/features/sync/schema";
import type {
  TransferItemType,
  TransferType,
} from "@/features/transfers/schema";
import type { DemoUserType, DeviceRecordType } from "@/features/users/schema";

export class BuildStockDatabase extends Dexie {
  branches!: EntityTable<BranchType, "id">;
  products!: EntityTable<ProductType, "id">;
  stockBalances!: EntityTable<StockBalanceType, "id">;
  sales!: EntityTable<SaleType, "id">;
  saleItems!: EntityTable<SaleItemType, "id">;
  stockMovements!: EntityTable<StockMovementType, "id">;
  outbox!: EntityTable<OutboxOperationType, "id">;
  suppliers!: EntityTable<SupplierType, "id">;
  purchases!: EntityTable<PurchaseType, "id">;
  purchaseItems!: EntityTable<PurchaseItemType, "id">;
  transfers!: EntityTable<TransferType, "id">;
  transferItems!: EntityTable<TransferItemType, "id">;
  auditEvents!: EntityTable<AuditEventType, "id">;
  users!: EntityTable<DemoUserType, "id">;
  devices!: EntityTable<DeviceRecordType, "id">;

  constructor() {
    super("BuildStockLocalDB");
    this.version(1).stores({
      branches: "id, code, status",
      products: "id, sku, category, active, name",
      stockBalances: "id, [branch_id+product_id], branch_id, product_id",
      sales: "id, branch_id, created_at, sync_status, receipt_number",
      saleItems: "id, sale_id, product_id",
      stockMovements: "id, branch_id, product_id, created_at, movement_type, reference",
      outbox: "id, operation_id, branch_id, status, created_at",
      suppliers: "id, name, status",
      purchases: "id, branch_id, supplier_id, status, created_at",
      purchaseItems: "id, purchase_id, product_id",
      transfers:
        "id, source_branch_id, destination_branch_id, status, created_at",
      transferItems: "id, transfer_id, product_id",
      auditEvents: "id, branch_id, created_at, entity, action",
      users: "id, branch_id, role, status",
      devices: "id, branch_id, status, last_seen_at",
    });
    this.version(2).stores({
      branches: "id, &code, status",
      products: "id, &sku, category, active, name",
      stockBalances: "id, &[branch_id+product_id], branch_id, product_id",
      sales: "id, branch_id, created_at, sync_status, receipt_number",
      saleItems: "id, sale_id, product_id",
      stockMovements: "id, branch_id, product_id, created_at, movement_type, reference",
      outbox: "id, &operation_id, branch_id, status, created_at",
      suppliers: "id, name, status",
      purchases: "id, branch_id, supplier_id, status, created_at",
      purchaseItems: "id, purchase_id, product_id",
      transfers:
        "id, source_branch_id, destination_branch_id, status, created_at",
      transferItems: "id, transfer_id, product_id",
      auditEvents: "id, branch_id, created_at, entity, action",
      users: "id, branch_id, role, status, &email",
      devices: "id, branch_id, status, last_seen_at",
    });
  }
}

export const db = new BuildStockDatabase();
