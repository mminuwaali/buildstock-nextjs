import { DemoSignInSchema, type DemoSignInType } from "@/features/auth/schema";

/** Demo-only role selection. Production sign-in must be implemented by Django. */
export function validateDemoSignIn(input: DemoSignInType) {
  return DemoSignInSchema.validate(input, {
    abortEarly: false,
    stripUnknown: true,
  });
}
