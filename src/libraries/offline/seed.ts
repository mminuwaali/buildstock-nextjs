import {
  seedAuditEvents,
  seedBranches,
  seedMovements,
  seedProducts,
  seedPurchaseItems,
  seedPurchases,
  seedSales,
  seedStock,
  seedSuppliers,
  seedTransferItems,
  seedTransfers,
} from "@/constants/mock-data";
import { BranchSchema } from "@/features/branches/schema";
import { AuditEventSchema } from "@/features/audit/schema";
import { ProductSchema } from "@/features/catalog/schema";
import {
  StockBalanceSchema,
  StockMovementSchema,
} from "@/features/inventory/schema";
import {
  PurchaseItemSchema,
  PurchaseSchema,
  SupplierSchema,
} from "@/features/purchases/schema";
import { SaleSchema } from "@/features/sales/schema";
import {
  TransferItemSchema,
  TransferSchema,
} from "@/features/transfers/schema";
import { DemoUserSchema, DeviceSchema } from "@/features/users/schema";
import { db } from "@/libraries/offline/db";

const demoUsers = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    full_name: "Amara Okeke",
    email: "owner@buildstock.demo",
    role: "owner_admin" as const,
    branch_id: null,
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    full_name: "Ibrahim Musa",
    email: "manager.central@buildstock.demo",
    role: "store_manager" as const,
    branch_id: "10000000-0000-4000-8000-000000000001",
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    full_name: "Grace Eze",
    email: "cashier.central@buildstock.demo",
    role: "cashier" as const,
    branch_id: "10000000-0000-4000-8000-000000000001",
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000004",
    full_name: "Musa Abdullahi",
    email: "stock.central@buildstock.demo",
    role: "stock_officer" as const,
    branch_id: "10000000-0000-4000-8000-000000000001",
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000005",
    full_name: "Nneka Daniels",
    email: "audit@buildstock.demo",
    role: "auditor" as const,
    branch_id: "10000000-0000-4000-8000-000000000001",
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000006",
    full_name: "Oluwaseun Adeyemi",
    email: "manager.west@buildstock.demo",
    role: "store_manager" as const,
    branch_id: "10000000-0000-4000-8000-000000000002",
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000007",
    full_name: "Fatima Sani",
    email: "cashier.west@buildstock.demo",
    role: "cashier" as const,
    branch_id: "10000000-0000-4000-8000-000000000002",
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000008",
    full_name: "Chinedu Okafor",
    email: "manager.riverside@buildstock.demo",
    role: "store_manager" as const,
    branch_id: "10000000-0000-4000-8000-000000000003",
    status: "active" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000009",
    full_name: "Aisha Bello",
    email: "cashier.riverside@buildstock.demo",
    role: "cashier" as const,
    branch_id: "10000000-0000-4000-8000-000000000003",
    status: "active" as const,
  },
];

export async function bootstrapDatabase() {
  await db.transaction(
    "rw",
    [
      db.branches,
      db.products,
      db.stockBalances,
      db.suppliers,
      db.users,
      db.devices,
      db.sales,
      db.stockMovements,
      db.purchases,
      db.purchaseItems,
      db.transfers,
      db.transferItems,
      db.auditEvents,
    ],
    async function () {
      if ((await db.branches.count()) === 0) {
        await db.branches.bulkPut(
          seedBranches.map((branch) => BranchSchema.validateSync(branch)),
        );
      }
      if ((await db.products.count()) === 0) {
        await db.products.bulkPut(
          seedProducts.map((product) => ProductSchema.validateSync(product)),
        );
      }
      if ((await db.stockBalances.count()) === 0) {
        await db.stockBalances.bulkPut(
          seedStock.map((balance) => StockBalanceSchema.validateSync(balance)),
        );
      }
      if ((await db.suppliers.count()) === 0) {
        await db.suppliers.bulkPut(
          seedSuppliers.map((supplier) =>
            SupplierSchema.validateSync(supplier),
          ),
        );
      }
      if ((await db.sales.count()) === 0)
        await db.sales.bulkPut(
          seedSales.map((sale) => SaleSchema.validateSync(sale)),
        );
      if ((await db.stockMovements.count()) === 0)
        await db.stockMovements.bulkPut(
          seedMovements.map((movement) =>
            StockMovementSchema.validateSync(movement),
          ),
        );
      if ((await db.purchases.count()) === 0)
        await db.purchases.bulkPut(
          seedPurchases.map((purchase) =>
            PurchaseSchema.validateSync(purchase),
          ),
        );
      if ((await db.purchaseItems.count()) === 0)
        await db.purchaseItems.bulkPut(
          seedPurchaseItems.map((item) =>
            PurchaseItemSchema.validateSync(item),
          ),
        );
      if ((await db.transfers.count()) === 0)
        await db.transfers.bulkPut(
          seedTransfers.map((transfer) =>
            TransferSchema.validateSync(transfer),
          ),
        );
      if ((await db.transferItems.count()) === 0)
        await db.transferItems.bulkPut(
          seedTransferItems.map((item) =>
            TransferItemSchema.validateSync(item),
          ),
        );
      if ((await db.auditEvents.count()) === 0)
        await db.auditEvents.bulkPut(
          seedAuditEvents.map((event) => AuditEventSchema.validateSync(event)),
        );
      if ((await db.users.count()) === 0) {
        await db.users.bulkPut(
          demoUsers.map((user) => DemoUserSchema.validateSync(user)),
        );
      }
      if ((await db.devices.count()) === 0) {
        await db.devices.bulkPut([
          DeviceSchema.validateSync({
            id: "60000000-0000-4000-8000-000000000001",
            name: "Front Counter POS",
            branch_id: "10000000-0000-4000-8000-000000000001",
            status: "online",
            last_seen_at: new Date().toISOString(),
          }),
          DeviceSchema.validateSync({
            id: "60000000-0000-4000-8000-000000000002",
            name: "Warehouse Desk",
            branch_id: "10000000-0000-4000-8000-000000000001",
            status: "offline",
            last_seen_at: "2026-10-27T18:10:00.000Z",
          }),
          DeviceSchema.validateSync({
            id: "60000000-0000-4000-8000-000000000003",
            name: "West Counter POS",
            branch_id: "10000000-0000-4000-8000-000000000002",
            status: "online",
            last_seen_at: new Date().toISOString(),
          }),
          DeviceSchema.validateSync({
            id: "60000000-0000-4000-8000-000000000004",
            name: "Riverside Sales Desk",
            branch_id: "10000000-0000-4000-8000-000000000003",
            status: "offline",
            last_seen_at: "2026-10-27T16:35:00.000Z",
          }),
        ]);
      }
    },
  );
}
