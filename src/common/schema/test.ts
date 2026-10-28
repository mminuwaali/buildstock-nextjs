import { describe, expect, it } from "vitest";
import {
  BasePaginationSchema,
  PageQuerySchema,
  ApiErrorSchema,
} from "@/common/schema";

describe("DRF-compatible schemas", function () {
  it("validates page-number pagination shape", async function () {
    const page = await BasePaginationSchema.validate({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: "fixture" }],
    });
    expect(page.count).toBe(1);
    expect(page.results).toHaveLength(1);
  });

  it("validates bounded page size and defaults", async function () {
    const query = await PageQuerySchema.validate({ page: 1, page_size: 20 });
    expect(query.page).toBe(1);
    expect(query.page_size).toBe(20);
  });

  it("recognizes DRF general and field validation errors", async function () {
    await expect(ApiErrorSchema.isValid({ detail: "Not found" })).resolves.toBe(
      true,
    );
    await expect(
      ApiErrorSchema.isValid({ sku: ["This field must be unique."] }),
    ).resolves.toBe(true);
  });
});
