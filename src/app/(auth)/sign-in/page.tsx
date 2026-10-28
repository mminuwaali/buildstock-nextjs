"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import {
  ArrowRight,
  Boxes,
  Building2,
  ClipboardList,
  ShieldCheck,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRoleType } from "@/common/types";

const demoRoles: Array<{
  role: UserRoleType;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
}> = [
  {
    role: "owner_admin",
    title: "Owner / Admin",
    subtitle: "All branches and consolidated reports",
    Icon: Building2,
  },
  {
    role: "store_manager",
    title: "Store Manager",
    subtitle: "One assigned branch and its operations",
    Icon: ShieldCheck,
  },
  {
    role: "cashier",
    title: "Cashier",
    subtitle: "Fast checkout and sales history",
    Icon: ShoppingCart,
  },
  {
    role: "stock_officer",
    title: "Stock Officer",
    subtitle: "Receiving, counts and adjustments",
    Icon: Boxes,
  },
  {
    role: "auditor",
    title: "Auditor / Accountant",
    subtitle: "Read-only review experience",
    Icon: ClipboardList,
  },
];

export default function SignInPage() {
  const auth = useAuth();
  const router = useRouter();
  function continueAs(role: UserRoleType) {
    auth.setRole(role);
    router.push(role === "cashier" ? "/pos" : "/overview");
  }
  return (
    <main className="sign-in-page">
      <section className="sign-in-aside">
        <LinkLogo />
        <div className="signin-message">
          <span className="welcome-label">
            <Wrench size={14} /> BUILT FOR CONSTRUCTION SUPPLY
          </span>
          <h1>
            Your stockroom.
            <br />
            Under control.
          </h1>
          <p>
            Inventory, sales and branch operations in one dependable workspace —
            designed for the realities of the worksite.
          </p>
          <div className="signin-points">
            <span>
              <ShieldCheck size={16} /> Branch-aware operations
            </span>
            <span>
              <Boxes size={16} /> Stock movement history
            </span>
            <span>
              <ShoppingCart size={16} /> Local-first checkout
            </span>
          </div>
        </div>
        <div className="signin-footer">
          BUILDSTOCK · FRONTEND DEMO · OCT 2026
        </div>
      </section>
      <section className="sign-in-main">
        <div className="sign-in-card">
          <span className="eyebrow">DEMO ACCESS</span>
          <h2>Choose your workspace</h2>
          <p className="sign-in-intro">
            No password is required in this local prototype. Choose a role to
            explore the experience.
          </p>
          <div className="demo-role-list">
            {demoRoles.map((item) => {
              const Icon = item.Icon;
              return (
                <button
                  className="demo-role-option"
                  key={item.role}
                  onClick={() => continueAs(item.role)}
                >
                  <span className="demo-role-icon">
                    <Icon size={19} />
                  </span>
                  <span className="demo-role-copy">
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              );
            })}
          </div>
          <div className="demo-warning">
            <ShieldCheck size={16} />
            <span>
              This is a demo role switcher, not production authentication. A
              real backend must enforce permissions.
            </span>
          </div>
          <Button block type="text" onClick={() => router.push("/overview")}>
            Continue as current demo user
          </Button>
        </div>
      </section>
    </main>
  );
}

function LinkLogo() {
  return (
    <Link href="/overview" className="brand-lockup sign-in-logo">
      <span className="brand-mark">
        <Wrench size={21} strokeWidth={2.5} />
      </span>
      <span className="brand-text">
        <strong>BuildStock</strong>
        <small>SUPPLY OPERATIONS</small>
      </span>
    </Link>
  );
}
