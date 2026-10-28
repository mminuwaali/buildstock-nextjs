"use client";

import React from "react";
import type { UserRoleType } from "@/common/types";
import { DEFAULT_BRANCH_ID } from "@/constants/settings";

export type DemoSessionType = {
  role: UserRoleType;
  branch_id: string | null;
  user_id: string;
  full_name: string;
  email: string;
};

type AuthContextType = {
  session: DemoSessionType;
  setRole: (role: UserRoleType) => void;
  setBranch: (branchId: string | null) => void;
  isAdmin: boolean;
};

const defaultSession: DemoSessionType = {
  role: "owner_admin",
  branch_id: null,
  user_id: "50000000-0000-4000-8000-000000000001",
  full_name: "Amara Okeke",
  email: "owner@buildstock.demo",
};

const AuthContext = React.createContext<AuthContextType | null>(null);

const roleSession: Record<UserRoleType, DemoSessionType> = {
  owner_admin: defaultSession,
  store_manager: {
    role: "store_manager",
    branch_id: DEFAULT_BRANCH_ID,
    user_id: "50000000-0000-4000-8000-000000000002",
    full_name: "Ibrahim Musa",
    email: "manager.central@buildstock.demo",
  },
  cashier: {
    role: "cashier",
    branch_id: DEFAULT_BRANCH_ID,
    user_id: "50000000-0000-4000-8000-000000000003",
    full_name: "Grace Eze",
    email: "cashier.central@buildstock.demo",
  },
  stock_officer: {
    role: "stock_officer",
    branch_id: DEFAULT_BRANCH_ID,
    user_id: "50000000-0000-4000-8000-000000000004",
    full_name: "Musa Abdullahi",
    email: "stock.central@buildstock.demo",
  },
  auditor: {
    role: "auditor",
    branch_id: DEFAULT_BRANCH_ID,
    user_id: "50000000-0000-4000-8000-000000000005",
    full_name: "Nneka Daniels",
    email: "audit@buildstock.demo",
  },
};

export function AuthProvider(props: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<DemoSessionType>(() => {
    if (typeof window === "undefined") return defaultSession;
    const saved = window.localStorage.getItem("buildstock:demo-session");
    if (saved) {
      try {
        return JSON.parse(saved) as DemoSessionType;
      } catch {
        window.localStorage.removeItem("buildstock:demo-session");
      }
    }
    return defaultSession;
  });

  function persist(nextSession: DemoSessionType) {
    setSession(nextSession);
    window.localStorage.setItem(
      "buildstock:demo-session",
      JSON.stringify(nextSession),
    );
  }

  function setRole(role: UserRoleType) {
    persist(roleSession[role]);
  }

  function setBranch(branchId: string | null) {
    if (session.role === "owner_admin")
      persist({ ...session, branch_id: branchId });
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        setRole,
        setBranch,
        isAdmin: session.role === "owner_admin",
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
