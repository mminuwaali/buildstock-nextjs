"use client";

import { useMutation } from "@tanstack/react-query";
import { validateDemoSignIn } from "@/features/auth/api";
import type { DemoSignInType } from "@/features/auth/schema";

export function useValidateDemoSignIn() {
  return useMutation({
    mutationFn: (payload: DemoSignInType) => validateDemoSignIn(payload),
  });
}
