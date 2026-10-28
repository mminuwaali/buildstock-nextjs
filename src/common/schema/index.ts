import * as yup from "yup";

export const UuidSchema = yup.string().uuid().required();
export const IsoDateTimeSchema = yup
  .string()
  .datetime({ allowOffset: true })
  .required();

export const BaseModelSchema = yup.object({
  id: UuidSchema,
  created_at: IsoDateTimeSchema,
  updated_at: IsoDateTimeSchema,
});

export const BasePaginationSchema = yup.object({
  count: yup.number().integer().min(0).required(),
  next: yup.string().nullable().defined(),
  previous: yup.string().nullable().defined(),
  results: yup.array().of(yup.mixed().required()).required(),
});

export const ApiErrorSchema = yup
  .object({
    detail: yup.string().optional(),
  })
  .test("api-error", "Expected a DRF error body", function (value) {
    return (
      Boolean(value?.detail) ||
      Boolean(value && Object.keys(value).some((key) => key !== "detail"))
    );
  });

export const PageQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  page_size: yup.number().integer().min(1).max(100).default(20),
  search: yup.string().optional(),
  ordering: yup.string().optional(),
});

export type UuidType = yup.InferType<typeof UuidSchema>;
export type BasePaginationType = yup.InferType<typeof BasePaginationSchema>;
export type PageQueryType = yup.InferType<typeof PageQuerySchema>;
