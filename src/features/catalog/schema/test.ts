import { describe, expect, it } from "vitest";
import { ProductSchema } from "@/features/catalog/schema";

const fixture = {
  id: "20000000-0000-4000-8000-000000000001",
  sku: "CEM-DAN-50",
  name: "Dangote Cement 50kg",
  category: "Cement & binders",
  description: "50kg bag",
  unit: "bag",
  sale_price_minor: 1050000,
  reorder_level: 80,
  active: true,
  created_at: "2026-10-28T09:00:00.000Z",
  updated_at: "2026-10-28T09:00:00.000Z",
};

describe("ProductSchema", function () {
  it("accepts construction catalog values using kobo integer prices", function () {
    expect(ProductSchema.isValidSync(fixture)).toBe(true);
  });

  it("rejects invalid UUIDs and negative price values", function () {
    expect(ProductSchema.isValidSync({ ...fixture, id: "not-a-uuid" })).toBe(
      false,
    );
    expect(
      ProductSchema.isValidSync({ ...fixture, sale_price_minor: -1 }),
    ).toBe(false);
  });
});
