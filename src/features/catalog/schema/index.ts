import * as yup from "yup";

export const ProductSchema = yup.object({
  id: yup.string().uuid().required(),
  sku: yup.string().required(),
  name: yup.string().required(),
  category: yup.string().required(),
  description: yup.string().default(""),
  unit: yup.string().required(),
  sale_price_minor: yup.number().integer().min(0).required(),
  reorder_level: yup.number().min(0).required(),
  active: yup.boolean().required(),
  created_at: yup.string().required(),
  updated_at: yup.string().required(),
});

export const ProductCreateSchema = ProductSchema.omit([
  "id",
  "created_at",
  "updated_at",
]);
export type ProductType = yup.InferType<typeof ProductSchema>;
export type ProductCreateType = yup.InferType<typeof ProductCreateSchema>;
