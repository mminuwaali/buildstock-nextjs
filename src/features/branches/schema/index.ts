import * as yup from "yup";

export const BranchSchema = yup.object({
  id: yup.string().uuid().required(),
  name: yup.string().required(),
  code: yup.string().required(),
  city: yup.string().required(),
  status: yup
    .mixed<"active" | "inactive">()
    .oneOf(["active", "inactive"])
    .required(),
  created_at: yup.string().required(),
  updated_at: yup.string().required(),
});

export type BranchType = yup.InferType<typeof BranchSchema>;
