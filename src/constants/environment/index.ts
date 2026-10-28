import { z } from "zod";

const EnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("BuildStock"),
  NEXT_PUBLIC_DATA_MODE: z.literal("mock").default("mock"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
});

export const environment = EnvironmentSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
});

export type EnvironmentType = z.infer<typeof EnvironmentSchema>;
