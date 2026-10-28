import {
  CompleteSaleRequestSchema,
  type CompleteSaleRequestType,
  SaleSchema,
  SaleItemSchema,
} from "@/features/sales/schema";
import {
  ProductCreateSchema,
  ProductSchema,
  type ProductCreateType,
} from "@/features/catalog/schema";
import type { ProductType } from "@/features/catalog/schema";
import type {
  StockBalanceType,
  StockMovementType,
} from "@/features/inventory/schema";
import type { SaleType, SaleItemType } from "@/features/sales/schema";
import type { OutboxOperationType } from "@/features/sync/schema";
import type { AuditEventType } from "@/features/audit/schema";
import {
  PurchaseItemSchema,
  type PurchaseItemType,
  type PurchaseType,
} from "@/features/purchases/schema";
import {
  TransferItemSchema,
  type TransferItemType,
  type TransferType,
} from "@/features/transfers/schema";
import {
  DemoUserSchema,
  InviteUserSchema,
  DeviceSchema,
  RegisterDeviceSchema,
  type InviteUserType,
  type RegisterDeviceType,
  type DeviceRecordType,
} from "@/features/users/schema";
import { BranchSchema, type BranchType } from "@/features/branches/schema";
import { db } from "@/libraries/offline/db";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/constants/settings";

export type DrfPageType<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type DashboardOverviewType = {
  branch_count: number;
  product_count: number;
  low_stock_count: number;
  stock_value_minor: number;
  sales_today_minor: number;
  sales_today_count: number;
  pending_sync_count: number;
  recent_sales: SaleType[];
  low_stock_products: Array<
    ProductType & { quantity: number; branch_name: string }
  >;
  branch_stock: Array<{
    branch_id: string;
    branch_name: string;
    product_count: number;
    stock_value_minor: number;
  }>;
};

export type ListParamsType = {
  page?: number;
  page_size?: number;
  search?: string;
  branch_id?: string;
  status?: string;
};

export function createId() {
  return crypto.randomUUID();
}

function paginate<T>(
  results: T[],
  params: ListParamsType,
  endpoint: string,
): DrfPageType<T> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.page_size ?? DEFAULT_PAGE_SIZE),
  );
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const query = `page_size=${pageSize}`;
  return {
    count: results.length,
    next: end < results.length ? `${endpoint}?page=${page + 1}&${query}` : null,
    previous: page > 1 ? `${endpoint}?page=${page - 1}&${query}` : null,
    results: results.slice(start, end),
  };
}

export async function listBranches(branchId?: string) {
  const branches = await db.branches.toArray();
  return branches.filter((branch) => !branchId || branch.id === branchId);
}

export async function createBranch(
  input: Omit<BranchType, "id" | "created_at" | "updated_at">,
) {
  const now = new Date().toISOString();
  const branch = BranchSchema.validateSync(
    { ...input, id: createId(), created_at: now, updated_at: now },
    { abortEarly: false },
  );
  const duplicateCode = await db.branches
    .where("code")
    .equals(branch.code)
    .first();
  if (duplicateCode) throw new Error("A branch with this code already exists");
  await db.transaction(
    "rw",
    db.branches,
    db.products,
    db.stockBalances,
    db.auditEvents,
    async function () {
      await db.branches.add(branch);
      const products = await db.products.toArray();
      await db.stockBalances.bulkAdd(
        products.map((product) => ({
          id: createId(),
          branch_id: branch.id,
          product_id: product.id,
          quantity: 0,
          updated_at: now,
        })),
      );
      await db.auditEvents.add({
        id: createId(),
        branch_id: null,
        actor_name: "Demo Admin",
        action: "branch.created",
        entity: "branch",
        entity_id: branch.id,
        created_at: now,
        detail: `Created branch ${branch.name} (${branch.code})`,
      });
    },
  );
  return branch;
}

export async function listProducts(params: ListParamsType = {}) {
  const query = (params.search ?? "").trim().toLowerCase();
  const items = await db.products.toArray();
  const filtered = items.filter(
    (product) =>
      !query ||
      `${product.name} ${product.sku} ${product.category}`
        .toLowerCase()
        .includes(query),
  );
  return paginate(filtered, params, "/api/products/");
}

export async function createProduct(payload: ProductCreateType) {
  const validated = ProductCreateSchema.validateSync(payload, {
    abortEarly: false,
  });
  const existingSku = await db.products
    .where("sku")
    .equals(validated.sku)
    .first();
  if (existingSku) throw new Error("A product with this SKU already exists");
  const now = new Date().toISOString();
  const product = ProductSchema.validateSync({
    id: createId(),
    sku: validated.sku,
    name: validated.name,
    category: validated.category,
    description: validated.description,
    unit: validated.unit,
    sale_price_minor: validated.sale_price_minor,
    reorder_level: validated.reorder_level,
    active: validated.active,
    created_at: now,
    updated_at: now,
  });
  await db.transaction(
    "rw",
    db.products,
    db.stockBalances,
    db.auditEvents,
    async function () {
      await db.products.add(product);
      const branches = await db.branches.toArray();
      const newBalances: StockBalanceType[] = branches.map((branch) => ({
        id: createId(),
        branch_id: branch.id,
        product_id: product.id,
        quantity: 0,
        updated_at: now,
      }));
      await db.stockBalances.bulkAdd(newBalances);
      const event: AuditEventType = {
        id: createId(),
        branch_id: null,
        actor_name: "Demo Admin",
        action: "product.created",
        entity: "product",
        entity_id: product.id,
        created_at: now,
        detail: `Created ${product.name} (${product.sku})`,
      };
      await db.auditEvents.add(event);
    },
  );
  return product;
}

export async function listStockBalances(branchId?: string) {
  const [balances, branches, products] = await Promise.all([
    db.stockBalances.toArray(),
    db.branches.toArray(),
    db.products.toArray(),
  ]);
  return balances
    .filter((balance) => !branchId || balance.branch_id === branchId)
    .map((balance) => ({
      ...balance,
      product: products.find((product) => product.id === balance.product_id),
      branch: branches.find((branch) => branch.id === balance.branch_id),
    }));
}

export async function listStockMovements(branchId?: string) {
  const movements = await db.stockMovements
    .orderBy("created_at")
    .reverse()
    .toArray();
  const [products, branches] = await Promise.all([
    db.products.toArray(),
    db.branches.toArray(),
  ]);
  return movements
    .filter((movement) => !branchId || movement.branch_id === branchId)
    .map((movement) => ({
      ...movement,
      product_name:
        products.find((product) => product.id === movement.product_id)?.name ??
        "Unknown product",
      branch_name:
        branches.find((branch) => branch.id === movement.branch_id)?.name ??
        "Unknown branch",
    }));
}

export async function listSales(
  branchId?: string,
  params: ListParamsType = {},
) {
  const query = (params.search ?? "").trim().toLowerCase();
  const sales = await db.sales.orderBy("created_at").reverse().toArray();
  const filtered = sales.filter(
    (sale) =>
      (!branchId || sale.branch_id === branchId) &&
      (!params.status || sale.sale_status === params.status) &&
      (!query ||
        `${sale.receipt_number} ${sale.customer_name} ${sale.payment_method}`
          .toLowerCase()
          .includes(query)),
  );
  return paginate(filtered, params, "/api/sales/");
}

export async function getSaleItems(saleId: string) {
  return db.saleItems.where("sale_id").equals(saleId).toArray();
}

export async function changeSaleStatus(
  saleId: string,
  targetStatus: "voided" | "returned",
  actorName: string,
) {
  const sale = await db.sales.get(saleId);
  if (!sale) throw new Error("Sale not found");
  if (sale.sale_status !== "completed")
    throw new Error("Only completed sales can be voided or returned");
  if (sale.payment_status === "awaiting_verification")
    throw new Error(
      "Verify the terminal payment before voiding or returning this sale",
    );
  const items = await db.saleItems.where("sale_id").equals(saleId).toArray();
  if (!items.length)
    throw new Error(
      "This historical sale has no saved line items and cannot be reversed in the demo",
    );
  const devices = await db.devices
    .where("branch_id")
    .equals(sale.branch_id)
    .toArray();
  if (!devices.length)
    throw new Error(
      "Register a cashier device for this branch before recording the reversal",
    );
  const now = new Date().toISOString();
  const operationId = createId();
  const operationType =
    targetStatus === "voided" ? "sale.voided" : "sale.returned";
  const outboxItem: OutboxOperationType = {
    id: createId(),
    operation_id: operationId,
    branch_id: sale.branch_id,
    device_id: devices[0].id,
    operation_type: operationType,
    entity_id: sale.id,
    payload: { sale_id: sale.id, target_status: targetStatus, items },
    status: "pending",
    review_status: "open",
    created_at: now,
    synced_at: null,
    last_error: "",
  };
  const nextSale: SaleType = {
    ...sale,
    sale_status: targetStatus,
    sync_status: "pending",
  };
  await db.transaction(
    "rw",
    db.sales,
    db.stockBalances,
    db.stockMovements,
    db.outbox,
    db.auditEvents,
    async function () {
      const currentSale = await db.sales.get(saleId);
      if (!currentSale || currentSale.sale_status !== "completed")
        throw new Error("This sale has already been changed");
      for (const item of items) {
        const balance = await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([sale.branch_id, item.product_id])
          .first();
        if (balance)
          await db.stockBalances.update(balance.id, {
            quantity: balance.quantity + item.quantity,
            updated_at: now,
          });
        else
          await db.stockBalances.add({
            id: createId(),
            branch_id: sale.branch_id,
            product_id: item.product_id,
            quantity: item.quantity,
            updated_at: now,
          });
        await db.stockMovements.add({
          id: createId(),
          branch_id: sale.branch_id,
          product_id: item.product_id,
          movement_type: "return",
          quantity_delta: item.quantity,
          reference: sale.receipt_number,
          reason:
            targetStatus === "voided"
              ? "Sale voided; goods returned to stock"
              : "Full goods return recorded",
          created_at: now,
          created_by: actorName,
        });
      }
      await db.sales.update(sale.id, {
        sale_status: targetStatus,
        sync_status: "pending",
      });
      await db.outbox.add(outboxItem);
      await db.auditEvents.add({
        id: createId(),
        branch_id: sale.branch_id,
        actor_name: actorName,
        action: operationType,
        entity: "sale",
        entity_id: sale.id,
        created_at: now,
        detail: `${targetStatus === "voided" ? "Voided" : "Returned"} sale ${sale.receipt_number}; physical stock restored. Payment refund, if required, remains a separate manual process.`,
      });
    },
  );
  return { sale: nextSale, operation_id: operationId };
}

export async function completeSale(input: CompleteSaleRequestType) {
  const payload = CompleteSaleRequestSchema.validateSync(input, {
    abortEarly: false,
  });
  const [products, branches] = await Promise.all([
    db.products.toArray(),
    db.branches.toArray(),
  ]);
  const branch = branches.find((item) => item.id === payload.branch_id);
  if (!branch) throw new Error("Branch not found");
  if (
    payload.payment_method === "external_pos" &&
    !payload.payment_reference.trim()
  )
    throw new Error("Enter the external terminal transaction reference");
  const resolvedItems = payload.items.map((item) => {
    const product = products.find(
      (entry) => entry.id === item.product_id && entry.active,
    );
    if (!product) throw new Error("A selected product is unavailable");
    return { product, quantity: item.quantity };
  });
  const subtotalMinor = resolvedItems.reduce(
    (total, item) =>
      total + Math.round(item.product.sale_price_minor * item.quantity),
    0,
  );
  if (payload.discount_minor > subtotalMinor)
    throw new Error("Discount cannot exceed the sale subtotal");
  const now = new Date().toISOString();
  const saleId = createId();
  const operationId = createId();
  const sale = SaleSchema.validateSync({
    id: saleId,
    receipt_number: `BS-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${saleId.slice(0, 5).toUpperCase()}`,
    branch_id: payload.branch_id,
    cashier_id: payload.cashier_id,
    customer_name: payload.customer_name || "Walk-in customer",
    subtotal_minor: subtotalMinor,
    discount_minor: payload.discount_minor,
    total_minor: subtotalMinor - payload.discount_minor,
    payment_method: payload.payment_method,
    payment_status:
      payload.payment_method === "external_pos"
        ? "awaiting_verification"
        : "confirmed",
    sale_status: "completed",
    sync_status: "pending",
    payment_reference: payload.payment_reference || "",
    created_at: now,
  });
  const items: SaleItemType[] = resolvedItems.map((item) =>
    SaleItemSchema.validateSync({
      id: createId(),
      sale_id: saleId,
      product_id: item.product.id,
      product_name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unit_price_minor: item.product.sale_price_minor,
      line_total_minor: Math.round(
        item.product.sale_price_minor * item.quantity,
      ),
    }),
  );
  const branchDevices = await db.devices
    .where("branch_id")
    .equals(payload.branch_id)
    .toArray();
  const registeredDevice = branchDevices[0];
  if (!registeredDevice)
    throw new Error(
      "Register a cashier device for this branch before completing a sale",
    );
  const outboxItem: OutboxOperationType = {
    id: createId(),
    operation_id: operationId,
    branch_id: payload.branch_id,
    device_id: registeredDevice.id,
    operation_type: "sale.completed",
    entity_id: saleId,
    payload: { sale, items },
    status: "pending",
    review_status: "open",
    created_at: now,
    synced_at: null,
    last_error: "",
  };
  await db.transaction(
    "rw",
    [
      db.sales,
      db.saleItems,
      db.stockBalances,
      db.stockMovements,
      db.outbox,
      db.auditEvents,
    ],
    async function () {
      for (const item of resolvedItems) {
        const balance = await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([payload.branch_id, item.product.id])
          .first();
        if (!balance || balance.quantity < item.quantity)
          throw new Error(
            `Insufficient recorded stock for ${item.product.name}`,
          );
      }
      await db.sales.add(sale);
      await db.saleItems.bulkAdd(items);
      for (const item of resolvedItems) {
        const balance = await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([payload.branch_id, item.product.id])
          .first();
        if (!balance)
          throw new Error(
            `Inventory balance is missing for ${item.product.name}`,
          );
        await db.stockBalances.update(balance.id, {
          quantity: balance.quantity - item.quantity,
          updated_at: now,
        });
        const movement: StockMovementType = {
          id: createId(),
          branch_id: payload.branch_id,
          product_id: item.product.id,
          movement_type: "sale",
          quantity_delta: -item.quantity,
          reference: sale.receipt_number,
          reason: "POS sale",
          created_at: now,
          created_by: payload.cashier_id,
        };
        await db.stockMovements.add(movement);
      }
      await db.outbox.add(outboxItem);
      const event: AuditEventType = {
        id: createId(),
        branch_id: payload.branch_id,
        actor_name: "Demo Cashier",
        action: "sale.completed",
        entity: "sale",
        entity_id: saleId,
        created_at: now,
        detail: `Sale ${sale.receipt_number} recorded locally`,
      };
      await db.auditEvents.add(event);
    },
  );
  return { sale, items, operation_id: operationId };
}

export async function getDashboardOverview(
  branchId?: string,
): Promise<DashboardOverviewType> {
  const [branches, products, balances, sales, outbox] = await Promise.all([
    db.branches.toArray(),
    db.products.toArray(),
    db.stockBalances.toArray(),
    db.sales.toArray(),
    db.outbox.toArray(),
  ]);
  const scopedBalances = balances.filter(
    (balance) => !branchId || balance.branch_id === branchId,
  );
  const scopedSales = sales.filter(
    (sale) => !branchId || sale.branch_id === branchId,
  );
  const today = new Date().toISOString().slice(0, 10);
  const salesToday = scopedSales.filter(
    (sale) =>
      sale.created_at.slice(0, 10) === today &&
      sale.sale_status === "completed",
  );
  const branchMap = new Map(branches.map((branch) => [branch.id, branch.name]));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const lowStockProducts = scopedBalances
    .filter((balance) => {
      const product = productMap.get(balance.product_id);
      return Boolean(product && balance.quantity <= product.reorder_level);
    })
    .map((balance) => {
      const product = productMap.get(balance.product_id);
      return {
        ...(product as ProductType),
        quantity: balance.quantity,
        branch_name: branchMap.get(balance.branch_id) ?? "Store",
      };
    })
    .filter((product) => Boolean(product.id));
  const branchStock = branches
    .filter((branch) => !branchId || branch.id === branchId)
    .map((branch) => {
      const branchBalances = balances.filter(
        (balance) => balance.branch_id === branch.id,
      );
      return {
        branch_id: branch.id,
        branch_name: branch.name,
        product_count: branchBalances.length,
        stock_value_minor: branchBalances.reduce(
          (total, balance) =>
            total +
            balance.quantity *
              (productMap.get(balance.product_id)?.sale_price_minor ?? 0),
          0,
        ),
      };
    });
  return {
    branch_count: branchId ? 1 : branches.length,
    product_count: products.filter((product) => product.active).length,
    low_stock_count: lowStockProducts.length,
    stock_value_minor: scopedBalances.reduce(
      (total, balance) =>
        total +
        balance.quantity *
          (productMap.get(balance.product_id)?.sale_price_minor ?? 0),
      0,
    ),
    sales_today_minor: salesToday.reduce(
      (total, sale) => total + sale.total_minor,
      0,
    ),
    sales_today_count: salesToday.length,
    pending_sync_count: outbox
      .filter(
        (item) =>
          item.status === "pending" ||
          (item.status === "needs_review" && item.review_status !== "resolved"),
      )
      .filter((item) => !branchId || item.branch_id === branchId).length,
    recent_sales: scopedSales
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6),
    low_stock_products: lowStockProducts.slice(0, 8),
    branch_stock: branchStock,
  };
}

export async function listOutbox(branchId?: string) {
  const items = await db.outbox.orderBy("created_at").reverse().toArray();
  return items.filter((item) => !branchId || item.branch_id === branchId);
}

export async function simulateSync(branchId?: string) {
  const pending = (await db.outbox.toArray()).filter(
    (item) =>
      item.status === "pending" && (!branchId || item.branch_id === branchId),
  );
  const now = new Date().toISOString();
  const results: Array<{ operation_id: string; status: string }> = [];
  for (const operation of pending) {
    const balances = await db.stockBalances
      .where("branch_id")
      .equals(operation.branch_id)
      .toArray();
    const hasNegative = balances.some((balance) => balance.quantity < 0);
    const status = hasNegative ? "needs_review" : "synced";
    await db.transaction(
      "rw",
      db.outbox,
      db.sales,
      db.auditEvents,
      async function () {
        await db.outbox.update(operation.id, {
          status,
          synced_at: now,
          review_status: "open",
          last_error: hasNegative
            ? "Local stock discrepancy needs manager review"
            : "",
        });
        const sale = await db.sales.get(operation.entity_id);
        if (sale)
          await db.sales.update(sale.id, {
            sync_status: status as SaleType["sync_status"],
          });
        const event: AuditEventType = {
          id: createId(),
          branch_id: operation.branch_id,
          actor_name: "Demo Sync Service",
          action: "sync.acknowledged",
          entity: "sync_operation",
          entity_id: operation.id,
          created_at: now,
          detail: `Simulated local acknowledgement: ${status}`,
        };
        await db.auditEvents.add(event);
      },
    );
    results.push({ operation_id: operation.operation_id, status });
  }
  return results;
}

export async function resolveSyncDiscrepancy(input: {
  operation_id: string;
  actor_name: string;
  note: string;
}) {
  const note = input.note.trim();
  if (!note)
    throw new Error("Add a review note before resolving this discrepancy");
  const operation = await db.outbox
    .where("operation_id")
    .equals(input.operation_id)
    .first();
  if (
    !operation ||
    operation.status !== "needs_review" ||
    operation.review_status === "resolved"
  )
    throw new Error("This operation does not have an open discrepancy");
  const now = new Date().toISOString();
  await db.transaction("rw", db.outbox, db.auditEvents, async function () {
    await db.outbox.update(operation.id, { review_status: "resolved" });
    await db.auditEvents.add({
      id: createId(),
      branch_id: operation.branch_id,
      actor_name: input.actor_name,
      action: "sync.discrepancy_resolved",
      entity: "sync_operation",
      entity_id: operation.id,
      created_at: now,
      detail: note,
    });
  });
  return { ...operation, review_status: "resolved" as const };
}

export async function listSuppliers(branchId?: string) {
  const suppliers = await db.suppliers.toArray();
  if (!branchId) return suppliers;
  const purchaseSupplierIds = new Set(
    (await listPurchases(branchId)).map((purchase) => purchase.supplier_id),
  );
  return suppliers.filter((supplier) => purchaseSupplierIds.has(supplier.id));
}

export async function listPurchases(branchId?: string) {
  const values = await db.purchases.orderBy("created_at").reverse().toArray();
  return values.filter(
    (purchase) => !branchId || purchase.branch_id === branchId,
  );
}

export async function listTransfers(branchId?: string) {
  const values = await db.transfers.orderBy("created_at").reverse().toArray();
  return values.filter(
    (transfer) =>
      !branchId ||
      transfer.source_branch_id === branchId ||
      transfer.destination_branch_id === branchId,
  );
}

export async function listAuditEvents(branchId?: string) {
  const values = await db.auditEvents.orderBy("created_at").reverse().toArray();
  return values.filter((event) => !branchId || event.branch_id === branchId);
}

export async function listUsers(branchId?: string) {
  const values = await db.users.toArray();
  return values.filter((user) => !branchId || user.branch_id === branchId);
}

export async function listDevices(branchId?: string) {
  const values = await db.devices.toArray();
  return values.filter((device) => !branchId || device.branch_id === branchId);
}

export async function inviteDemoUser(input: InviteUserType) {
  const payload = InviteUserSchema.validateSync(input, { abortEarly: false });
  if (payload.role !== "owner_admin" && !payload.branch_id)
    throw new Error("Select a branch for store-scoped staff");
  const existing = await db.users
    .where("email")
    .equals(payload.email.toLowerCase())
    .first();
  if (existing) throw new Error("A user with this email already exists");
  const user = DemoUserSchema.validateSync({
    id: createId(),
    full_name: payload.full_name,
    email: payload.email.toLowerCase(),
    role: payload.role,
    branch_id: payload.role === "owner_admin" ? null : payload.branch_id,
    status: "invited",
  });
  await db.transaction("rw", db.users, db.auditEvents, async function () {
    await db.users.add(user);
    await db.auditEvents.add({
      id: createId(),
      branch_id: user.branch_id,
      actor_name: "Demo Admin",
      action: "user.invited",
      entity: "user",
      entity_id: user.id,
      created_at: new Date().toISOString(),
      detail: `Created demo invitation for ${user.email}`,
    });
  });
  return user;
}

export async function registerDemoDevice(input: RegisterDeviceType) {
  const payload = RegisterDeviceSchema.validateSync(input, {
    abortEarly: false,
  });
  if (!(await db.branches.get(payload.branch_id)))
    throw new Error("Choose a valid branch");
  const device: DeviceRecordType = DeviceSchema.validateSync({
    id: createId(),
    name: payload.name,
    branch_id: payload.branch_id,
    status: "offline",
    last_seen_at: new Date().toISOString(),
  });
  await db.transaction("rw", db.devices, db.auditEvents, async function () {
    await db.devices.add(device);
    await db.auditEvents.add({
      id: createId(),
      branch_id: device.branch_id,
      actor_name: "Demo Admin",
      action: "device.registered",
      entity: "device",
      entity_id: device.id,
      created_at: new Date().toISOString(),
      detail: `Registered demo device ${device.name}`,
    });
  });
  return device;
}

export async function addStockAdjustment(input: {
  branch_id: string;
  product_id: string;
  quantity_delta: number;
  reason: string;
  actor_id: string;
}) {
  if (!input.reason.trim())
    throw new Error("A reason is required for stock adjustments");
  const now = new Date().toISOString();
  await db.transaction(
    "rw",
    db.stockBalances,
    db.stockMovements,
    db.auditEvents,
    async function () {
      const balance = await db.stockBalances
        .where("[branch_id+product_id]")
        .equals([input.branch_id, input.product_id])
        .first();
      if (balance)
        await db.stockBalances.update(balance.id, {
          quantity: balance.quantity + input.quantity_delta,
          updated_at: now,
        });
      else
        await db.stockBalances.add({
          id: createId(),
          branch_id: input.branch_id,
          product_id: input.product_id,
          quantity: input.quantity_delta,
          updated_at: now,
        });
      await db.stockMovements.add({
        id: createId(),
        branch_id: input.branch_id,
        product_id: input.product_id,
        movement_type: "adjustment",
        quantity_delta: input.quantity_delta,
        reference: `ADJ-${Date.now().toString().slice(-6)}`,
        reason: input.reason,
        created_at: now,
        created_by: input.actor_id,
      });
      await db.auditEvents.add({
        id: createId(),
        branch_id: input.branch_id,
        actor_name: "Demo Stock Officer",
        action: "inventory.adjusted",
        entity: "stock_balance",
        entity_id: input.product_id,
        created_at: now,
        detail: input.reason,
      });
    },
  );
}

export async function createPurchaseOrder(input: {
  branch_id: string;
  supplier_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_cost_minor: number;
  }>;
}) {
  if (!input.items.length) throw new Error("Add at least one purchase item");
  const supplier = await db.suppliers.get(input.supplier_id);
  const branch = await db.branches.get(input.branch_id);
  if (!supplier || !branch)
    throw new Error("Choose a valid branch and supplier");
  const products = await db.products.toArray();
  const resolved = input.items.map((item) => {
    const product = products.find((entry) => entry.id === item.product_id);
    if (!product || item.quantity <= 0 || item.unit_cost_minor < 0)
      throw new Error("Purchase item details are invalid");
    return {
      product,
      quantity: item.quantity,
      unit_cost_minor: item.unit_cost_minor,
    };
  });
  const now = new Date().toISOString();
  const purchaseId = createId();
  const purchase: PurchaseType = {
    id: purchaseId,
    reference: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
    branch_id: branch.id,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    status: "ordered",
    total_minor: resolved.reduce(
      (total, item) => total + Math.round(item.quantity * item.unit_cost_minor),
      0,
    ),
    created_at: now,
  };
  const items: PurchaseItemType[] = resolved.map((item) =>
    PurchaseItemSchema.validateSync({
      id: createId(),
      purchase_id: purchaseId,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_cost_minor: item.unit_cost_minor,
      line_total_minor: Math.round(item.quantity * item.unit_cost_minor),
    }),
  );
  await db.transaction(
    "rw",
    db.purchases,
    db.purchaseItems,
    db.auditEvents,
    async function () {
      await db.purchases.add(purchase);
      await db.purchaseItems.bulkAdd(items);
      await db.auditEvents.add({
        id: createId(),
        branch_id: branch.id,
        actor_name: "Demo Store Manager",
        action: "purchase.ordered",
        entity: "purchase",
        entity_id: purchase.id,
        created_at: now,
        detail: `Created purchase order ${purchase.reference}`,
      });
    },
  );
  return { purchase, items };
}

export async function receivePurchaseOrder(purchaseId: string) {
  const purchase = await db.purchases.get(purchaseId);
  if (!purchase) throw new Error("Purchase order not found");
  if (purchase.status !== "ordered")
    throw new Error("Only ordered purchase orders can be received");
  const items = await db.purchaseItems
    .where("purchase_id")
    .equals(purchaseId)
    .toArray();
  if (!items.length) throw new Error("Purchase order has no line items");
  const now = new Date().toISOString();
  await db.transaction(
    "rw",
    db.purchases,
    db.purchaseItems,
    db.stockBalances,
    db.stockMovements,
    db.auditEvents,
    async function () {
      for (const item of items) {
        const balance = await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([purchase.branch_id, item.product_id])
          .first();
        if (balance)
          await db.stockBalances.update(balance.id, {
            quantity: balance.quantity + item.quantity,
            updated_at: now,
          });
        else
          await db.stockBalances.add({
            id: createId(),
            branch_id: purchase.branch_id,
            product_id: item.product_id,
            quantity: item.quantity,
            updated_at: now,
          });
        await db.stockMovements.add({
          id: createId(),
          branch_id: purchase.branch_id,
          product_id: item.product_id,
          movement_type: "purchase_receipt",
          quantity_delta: item.quantity,
          reference: purchase.reference,
          reason: "Purchase order received",
          created_at: now,
          created_by: "Demo Store Manager",
        });
      }
      await db.purchases.update(purchase.id, { status: "received" });
      await db.auditEvents.add({
        id: createId(),
        branch_id: purchase.branch_id,
        actor_name: "Demo Store Manager",
        action: "purchase.received",
        entity: "purchase",
        entity_id: purchase.id,
        created_at: now,
        detail: `Received purchase order ${purchase.reference}`,
      });
    },
  );
  return { purchase: { ...purchase, status: "received" as const }, items };
}

export async function listPurchaseItems(purchaseId: string) {
  return db.purchaseItems.where("purchase_id").equals(purchaseId).toArray();
}

export async function createStockTransfer(input: {
  source_branch_id: string;
  destination_branch_id: string;
  items: Array<{ product_id: string; quantity: number }>;
}) {
  if (input.source_branch_id === input.destination_branch_id)
    throw new Error("Source and destination must be different branches");
  if (!input.items.length) throw new Error("Add at least one transfer item");
  const [source, destination, products] = await Promise.all([
    db.branches.get(input.source_branch_id),
    db.branches.get(input.destination_branch_id),
    db.products.toArray(),
  ]);
  if (!source || !destination)
    throw new Error("Choose valid source and destination branches");
  const items: TransferItemType[] = input.items.map((item) => {
    const product = products.find((entry) => entry.id === item.product_id);
    if (!product || item.quantity <= 0)
      throw new Error("Transfer item details are invalid");
    return TransferItemSchema.validateSync({
      id: createId(),
      transfer_id: "00000000-0000-4000-8000-000000000000",
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
    });
  });
  const now = new Date().toISOString();
  const transferId = createId();
  const transfer: TransferType = {
    id: transferId,
    reference: `TR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
    source_branch_id: source.id,
    destination_branch_id: destination.id,
    status: "draft",
    items_count: items.length,
    created_at: now,
  };
  const persistedItems = items.map((item) => ({
    ...item,
    transfer_id: transferId,
  }));
  await db.transaction(
    "rw",
    db.transfers,
    db.transferItems,
    db.auditEvents,
    async function () {
      await db.transfers.add(transfer);
      await db.transferItems.bulkAdd(persistedItems);
      await db.auditEvents.add({
        id: createId(),
        branch_id: source.id,
        actor_name: "Demo Store Manager",
        action: "transfer.created",
        entity: "transfer",
        entity_id: transfer.id,
        created_at: now,
        detail: `Created transfer ${transfer.reference} to ${destination.name}`,
      });
    },
  );
  return { transfer, items: persistedItems };
}

export async function dispatchStockTransfer(transferId: string) {
  const transfer = await db.transfers.get(transferId);
  if (!transfer || transfer.status !== "draft")
    throw new Error("Only draft transfers can be dispatched");
  const items = await db.transferItems
    .where("transfer_id")
    .equals(transferId)
    .toArray();
  const now = new Date().toISOString();
  await db.transaction(
    "rw",
    db.transfers,
    db.stockBalances,
    db.stockMovements,
    db.auditEvents,
    async function () {
      for (const item of items) {
        const balance = await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([transfer.source_branch_id, item.product_id])
          .first();
        if (!balance || balance.quantity < item.quantity)
          throw new Error(
            `Insufficient recorded stock for ${item.product_name}`,
          );
      }
      for (const item of items) {
        const balance = await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([transfer.source_branch_id, item.product_id])
          .first();
        if (balance)
          await db.stockBalances.update(balance.id, {
            quantity: balance.quantity - item.quantity,
            updated_at: now,
          });
        await db.stockMovements.add({
          id: createId(),
          branch_id: transfer.source_branch_id,
          product_id: item.product_id,
          movement_type: "transfer_out",
          quantity_delta: -item.quantity,
          reference: transfer.reference,
          reason: `Dispatched to branch ${transfer.destination_branch_id}`,
          created_at: now,
          created_by: "Demo Store Manager",
        });
      }
      await db.transfers.update(transfer.id, { status: "dispatched" });
      await db.auditEvents.add({
        id: createId(),
        branch_id: transfer.source_branch_id,
        actor_name: "Demo Store Manager",
        action: "transfer.dispatched",
        entity: "transfer",
        entity_id: transfer.id,
        created_at: now,
        detail: `Dispatched ${transfer.reference}`,
      });
    },
  );
  return { ...transfer, status: "dispatched" as const };
}

export async function receiveStockTransfer(transferId: string) {
  const transfer = await db.transfers.get(transferId);
  if (!transfer || transfer.status !== "dispatched")
    throw new Error("Only dispatched transfers can be received");
  const items = await db.transferItems
    .where("transfer_id")
    .equals(transferId)
    .toArray();
  const now = new Date().toISOString();
  await db.transaction(
    "rw",
    db.transfers,
    db.stockBalances,
    db.stockMovements,
    db.auditEvents,
    async function () {
      for (const item of items) {
        const balance = await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([transfer.destination_branch_id, item.product_id])
          .first();
        if (balance)
          await db.stockBalances.update(balance.id, {
            quantity: balance.quantity + item.quantity,
            updated_at: now,
          });
        else
          await db.stockBalances.add({
            id: createId(),
            branch_id: transfer.destination_branch_id,
            product_id: item.product_id,
            quantity: item.quantity,
            updated_at: now,
          });
        await db.stockMovements.add({
          id: createId(),
          branch_id: transfer.destination_branch_id,
          product_id: item.product_id,
          movement_type: "transfer_in",
          quantity_delta: item.quantity,
          reference: transfer.reference,
          reason: `Received from branch ${transfer.source_branch_id}`,
          created_at: now,
          created_by: "Demo Store Manager",
        });
      }
      await db.transfers.update(transfer.id, { status: "received" });
      await db.auditEvents.add({
        id: createId(),
        branch_id: transfer.destination_branch_id,
        actor_name: "Demo Store Manager",
        action: "transfer.received",
        entity: "transfer",
        entity_id: transfer.id,
        created_at: now,
        detail: `Received ${transfer.reference}`,
      });
    },
  );
  return { ...transfer, status: "received" as const };
}

export async function listTransferItems(transferId: string) {
  return db.transferItems.where("transfer_id").equals(transferId).toArray();
}
