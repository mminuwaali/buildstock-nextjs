import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_BRANCH_ID } from "@/constants/settings";
import { bootstrapDatabase } from "@/libraries/offline/seed";
import { db } from "@/libraries/offline/db";
import {
  changeSaleStatus,
  completeSale,
  getSaleItems,
  listOutbox,
  listSales,
  simulateSync,
  dispatchStockTransfer,
  receiveStockTransfer,
  listTransfers,
} from "@/libraries/mock-api/repository";

const CEMENT_ID = "20000000-0000-4000-8000-000000000001";
const SECOND_BRANCH_ID = "10000000-0000-4000-8000-000000000002";
const CASHIER_ID = "50000000-0000-4000-8000-000000000003";
const DRAFT_TRANSFER_ID = "90000000-0000-4000-8000-000000000001";

beforeEach(async function () {
  await db.delete();
  await db.open();
  await bootstrapDatabase();
});

describe("local-first transaction repository", function () {
  it("commits a sale, sale lines, branch stock movement and outbox together", async function () {
    const centralBefore = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
      .first();
    const otherBranchBefore = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([SECOND_BRANCH_ID, CEMENT_ID])
      .first();
    expect(centralBefore).toBeDefined();
    expect(otherBranchBefore).toBeDefined();

    const result = await completeSale({
      branch_id: DEFAULT_BRANCH_ID,
      cashier_id: CASHIER_ID,
      customer_name: "Test site",
      discount_minor: 0,
      payment_method: "cash",
      payment_reference: "",
      items: [{ product_id: CEMENT_ID, quantity: 2 }],
    });

    const centralAfter = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
      .first();
    const otherBranchAfter = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([SECOND_BRANCH_ID, CEMENT_ID])
      .first();
    expect(centralAfter?.quantity).toBe((centralBefore?.quantity ?? 0) - 2);
    expect(otherBranchAfter?.quantity).toBe(otherBranchBefore?.quantity);
    expect(await getSaleItems(result.sale.id)).toHaveLength(1);
    expect(
      (await listOutbox(DEFAULT_BRANCH_ID)).some(
        (item) => item.operation_id === result.operation_id,
      ),
    ).toBe(true);
    expect(
      (await listSales(DEFAULT_BRANCH_ID)).results.some(
        (sale) => sale.id === result.sale.id,
      ),
    ).toBe(true);
  });

  it("requires an external terminal reference and never marks that payment confirmed", async function () {
    await expect(
      completeSale({
        branch_id: DEFAULT_BRANCH_ID,
        cashier_id: CASHIER_ID,
        customer_name: "Test site",
        discount_minor: 0,
        payment_method: "external_pos",
        payment_reference: "",
        items: [{ product_id: CEMENT_ID, quantity: 1 }],
      }),
    ).rejects.toThrow("Enter the external terminal transaction reference");

    const result = await completeSale({
      branch_id: DEFAULT_BRANCH_ID,
      cashier_id: CASHIER_ID,
      customer_name: "Test site",
      discount_minor: 0,
      payment_method: "external_pos",
      payment_reference: "POS-REF-TEST-1",
      items: [{ product_id: CEMENT_ID, quantity: 1 }],
    });
    expect(result.sale.payment_status).toBe("awaiting_verification");
  });

  it("records a full return as a new stock movement and queues an auditable sync operation", async function () {
    const result = await completeSale({
      branch_id: DEFAULT_BRANCH_ID,
      cashier_id: CASHIER_ID,
      customer_name: "Return test",
      discount_minor: 0,
      payment_method: "cash",
      payment_reference: "",
      items: [{ product_id: CEMENT_ID, quantity: 3 }],
    });
    const beforeReturn = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
      .first();
    const reversed = await changeSaleStatus(
      result.sale.id,
      "returned",
      "Store Manager Test",
    );
    const afterReturn = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
      .first();
    expect(reversed.sale.sale_status).toBe("returned");
    expect(afterReturn?.quantity).toBe((beforeReturn?.quantity ?? 0) + 3);
    expect(
      (
        await db.stockMovements
          .where("reference")
          .equals(result.sale.receipt_number)
          .toArray()
      ).some(
        (movement) =>
          movement.movement_type === "return" && movement.quantity_delta === 3,
      ),
    ).toBe(true);
    expect(
      (await listOutbox(DEFAULT_BRANCH_ID)).some(
        (item) =>
          item.operation_id === reversed.operation_id &&
          item.operation_type === "sale.returned",
      ),
    ).toBe(true);
    await expect(
      changeSaleStatus(result.sale.id, "returned", "Store Manager Test"),
    ).rejects.toThrow("Only completed sales");
  });

  it("keeps the sync operation idempotent when an acknowledged queue is retried", async function () {
    await completeSale({
      branch_id: DEFAULT_BRANCH_ID,
      cashier_id: CASHIER_ID,
      customer_name: "Test site",
      discount_minor: 0,
      payment_method: "cash",
      payment_reference: "",
      items: [{ product_id: CEMENT_ID, quantity: 1 }],
    });
    const before = await db.sales.count();
    const first = await simulateSync(DEFAULT_BRANCH_ID);
    const second = await simulateSync(DEFAULT_BRANCH_ID);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    expect(await db.sales.count()).toBe(before);
  });

  it("rejects a sale beyond this device's recorded branch stock without partial writes", async function () {
    const balance = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
      .first();
    expect(balance).toBeDefined();
    const salesBefore = await db.sales.count();
    const movementsBefore = await db.stockMovements.count();
    const outboxBefore = await db.outbox.count();
    await expect(
      completeSale({
        branch_id: DEFAULT_BRANCH_ID,
        cashier_id: CASHIER_ID,
        customer_name: "Oversized order",
        discount_minor: 0,
        payment_method: "cash",
        payment_reference: "",
        items: [
          { product_id: CEMENT_ID, quantity: (balance?.quantity ?? 0) + 1 },
        ],
      }),
    ).rejects.toThrow("Insufficient recorded stock");
    expect(await db.sales.count()).toBe(salesBefore);
    expect(await db.stockMovements.count()).toBe(movementsBefore);
    expect(await db.outbox.count()).toBe(outboxBefore);
    expect(
      (
        await db.stockBalances
          .where("[branch_id+product_id]")
          .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
          .first()
      )?.quantity,
    ).toBe(balance?.quantity);
  });

  it("returns only transfers involving the requested branch in branch-scoped queries", async function () {
    const centralTransfers = await listTransfers(DEFAULT_BRANCH_ID);
    expect(centralTransfers.length).toBe(2);
    expect(
      centralTransfers.every(
        (transfer) =>
          transfer.source_branch_id === DEFAULT_BRANCH_ID ||
          transfer.destination_branch_id === DEFAULT_BRANCH_ID,
      ),
    ).toBe(true);
    expect(
      await listTransfers("10000000-0000-4000-8000-000000000003"),
    ).toHaveLength(1);
    expect(await listTransfers()).toHaveLength(2);
  });

  it("moves branch stock only on transfer dispatch and receipt", async function () {
    const sourceBefore = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
      .first();
    const destinationBefore = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([SECOND_BRANCH_ID, CEMENT_ID])
      .first();
    await dispatchStockTransfer(DRAFT_TRANSFER_ID);
    const sourceAfterDispatch = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([DEFAULT_BRANCH_ID, CEMENT_ID])
      .first();
    expect(sourceAfterDispatch?.quantity).toBe(
      (sourceBefore?.quantity ?? 0) - 12,
    );
    expect((await db.transfers.get(DRAFT_TRANSFER_ID))?.status).toBe(
      "dispatched",
    );
    await receiveStockTransfer(DRAFT_TRANSFER_ID);
    const destinationAfter = await db.stockBalances
      .where("[branch_id+product_id]")
      .equals([SECOND_BRANCH_ID, CEMENT_ID])
      .first();
    expect(destinationAfter?.quantity).toBe(
      (destinationBefore?.quantity ?? 0) + 12,
    );
    await expect(receiveStockTransfer(DRAFT_TRANSFER_ID)).rejects.toThrow(
      "Only dispatched transfers can be received",
    );
  });
});
