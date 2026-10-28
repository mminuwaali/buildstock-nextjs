"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Select, Tooltip } from "antd";
import {
  ArrowLeftRight,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  Cloud,
  FileClock,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import { useSyncQueue } from "@/features/sync/hooks";
import { useQuery } from "@tanstack/react-query";
import { getBranches } from "@/features/branches/api";
import { ROUTES } from "@/constants/routes";
import type { UserRoleType } from "@/common/types";

const navigation = [
  {
    label: "Overview",
    href: ROUTES.overview,
    icon: LayoutDashboard,
    section: "Workspace",
    roles: [
      "owner_admin",
      "store_manager",
      "cashier",
      "stock_officer",
      "auditor",
    ],
  },
  {
    label: "Point of sale",
    href: ROUTES.pos,
    icon: ShoppingCart,
    section: "Workspace",
    roles: ["owner_admin", "store_manager", "cashier"],
  },
  {
    label: "Sales",
    href: ROUTES.sales,
    icon: ReceiptText,
    section: "Workspace",
    roles: ["owner_admin", "store_manager", "cashier", "auditor"],
  },
  {
    label: "Products",
    href: ROUTES.products,
    icon: Package,
    section: "Inventory",
    roles: [
      "owner_admin",
      "store_manager",
      "cashier",
      "stock_officer",
      "auditor",
    ],
  },
  {
    label: "Stock & movements",
    href: ROUTES.inventory,
    icon: Boxes,
    section: "Inventory",
    roles: ["owner_admin", "store_manager", "stock_officer", "auditor"],
  },
  {
    label: "Purchases",
    href: ROUTES.purchases,
    icon: PackagePlus,
    section: "Inventory",
    roles: ["owner_admin", "store_manager", "stock_officer", "auditor"],
  },
  {
    label: "Transfers",
    href: ROUTES.transfers,
    icon: ArrowLeftRight,
    section: "Inventory",
    roles: ["owner_admin"],
  },
  {
    label: "Reports",
    href: ROUTES.reports,
    icon: ChartNoAxesCombined,
    section: "Insights",
    roles: ["owner_admin", "store_manager", "auditor"],
  },
  {
    label: "Stores & branches",
    href: ROUTES.stores,
    icon: Building2,
    section: "Administration",
    roles: ["owner_admin"],
  },
  {
    label: "Team & access",
    href: ROUTES.team,
    icon: Users,
    section: "Administration",
    roles: ["owner_admin", "store_manager"],
  },
  {
    label: "Devices",
    href: ROUTES.devices,
    icon: HardDrive,
    section: "Administration",
    roles: ["owner_admin", "store_manager"],
  },
  {
    label: "Sync center",
    href: ROUTES.sync,
    icon: Cloud,
    section: "Administration",
    roles: ["owner_admin", "store_manager", "cashier", "stock_officer"],
  },
  {
    label: "Audit trail",
    href: ROUTES.audit,
    icon: FileClock,
    section: "Administration",
    roles: ["owner_admin", "auditor"],
  },
  {
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings,
    section: "Administration",
    roles: ["owner_admin"],
  },
] as const;

const roleLabels: Record<UserRoleType, string> = {
  owner_admin: "Owner / Admin",
  store_manager: "Store Manager",
  cashier: "Cashier",
  stock_officer: "Stock Officer",
  auditor: "Auditor / Accountant",
};

export function DashboardShell(props: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const connectivity = useConnectivity();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const branches = useQuery({
    queryKey: [
      "branches",
      auth.session.role === "owner_admin" ? "all" : auth.session.branch_id,
    ],
    queryFn: () =>
      getBranches(
        auth.session.role === "owner_admin"
          ? undefined
          : (auth.session.branch_id ?? undefined),
      ),
  });
  const syncQueue = useSyncQueue(auth.session.branch_id);
  const pendingCount =
    syncQueue.data?.filter(
      (item) =>
        item.status === "pending" ||
        (item.status === "needs_review" && item.review_status !== "resolved"),
    ).length ?? 0;
  const visibleNavigation = navigation.filter((item) =>
    item.roles.some((role) => role === auth.session.role),
  );
  const activeNavigation = navigation.find(
    (item) =>
      item.href === pathname ||
      (item.href !== ROUTES.overview && pathname.startsWith(`${item.href}/`)),
  );
  const routeForbidden = Boolean(
    activeNavigation &&
    !activeNavigation.roles.some((role) => role === auth.session.role),
  );
  const sections = ["Workspace", "Inventory", "Insights", "Administration"];

  function handleRoleChange(value: UserRoleType) {
    auth.setRole(value);
    if (value === "cashier") router.push(ROUTES.pos);
    else router.push(ROUTES.overview);
  }

  function handleSignOut() {
    router.push(ROUTES.signIn);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <Link
          className="brand-lockup"
          href={ROUTES.overview}
          onClick={() => setMobileNavOpen(false)}
        >
          <span className="brand-mark">
            <Wrench size={21} strokeWidth={2.5} />
          </span>
          <span className="brand-text">
            <strong>BuildStock</strong>
            <small>SUPPLY OPERATIONS</small>
          </span>
        </Link>
        <div className="sidebar-workspace">
          <span className="workspace-symbol">
            <Store size={16} />
          </span>
          <span>
            <strong>
              {auth.session.role === "owner_admin"
                ? "Company workspace"
                : (branches.data?.find(
                    (branch) => branch.id === auth.session.branch_id,
                  )?.name ?? "Store workspace")}
            </strong>
            <small>
              {auth.session.role === "owner_admin"
                ? "All branches"
                : "Branch operations"}
            </small>
          </span>
          <ChevronDown size={15} />
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {sections.map((section) => {
            const items = visibleNavigation.filter(
              (item) => item.section === section,
            );
            if (!items.length) return null;
            return (
              <div className="nav-section" key={section}>
                <span className="nav-section-label">{section}</span>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== ROUTES.overview &&
                      pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`nav-link ${active ? "nav-link-active" : ""}`}
                    >
                      <Icon size={17} strokeWidth={1.9} />
                      <span>{item.label}</span>
                      {item.href === ROUTES.sync && pendingCount > 0 ? (
                        <span className="nav-count">{pendingCount}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon">
              <ShieldCheck size={16} />
            </div>
            <strong>Built for the worksite</strong>
            <p>Keep stock moving, even when the network is down.</p>
          </div>
          <div className="sidebar-version">
            <span>BUILDSTOCK DEMO</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </aside>
      {mobileNavOpen ? (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              className="mobile-menu-button"
              type="text"
              icon={<Menu size={19} />}
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen((value) => !value)}
            />
            <div className="breadcrumb-line">
              <span>Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <strong>
                {navigation.find((item) => item.href === pathname)?.label ??
                  "Operations"}
              </strong>
            </div>
          </div>
          <div className="topbar-right">
            {auth.session.role === "owner_admin" ? (
              <Select
                aria-label="Selected branch"
                className="branch-select"
                value={auth.session.branch_id ?? "all"}
                onChange={(value) =>
                  auth.setBranch(value === "all" ? null : value)
                }
                options={[
                  { value: "all", label: "All branches" },
                  ...(branches.data ?? []).map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  })),
                ]}
              />
            ) : (
              <span className="topbar-branch">
                <Store size={15} />
                {branches.data?.find(
                  (branch) => branch.id === auth.session.branch_id,
                )?.name ?? "Assigned store"}
              </span>
            )}
            <Tooltip
              title={
                connectivity.isOnline
                  ? "Toggle simulated offline mode"
                  : "Toggle online mode"
              }
            >
              <Button
                className={`connection-toggle ${connectivity.isOnline ? "is-online" : "is-offline"}`}
                icon={
                  connectivity.isOnline ? (
                    <Wifi size={16} />
                  ) : (
                    <WifiOff size={16} />
                  )
                }
                onClick={connectivity.toggleSimulatedOffline}
              >
                <span>{connectivity.isOnline ? "Online" : "Offline"}</span>
              </Button>
            </Tooltip>
            <Link
              className="topbar-sync"
              href={ROUTES.sync}
              aria-label={`Synchronization center with ${pendingCount} pending operations`}
            >
              <Cloud size={17} />
              <span>{pendingCount}</span>
            </Link>
            <Select
              aria-label="Demo role"
              className="role-select"
              value={auth.session.role}
              onChange={handleRoleChange}
              options={Object.entries(roleLabels).map((entry) => ({
                value: entry[0],
                label: entry[1],
              }))}
            />
            <div className="user-menu">
              <Avatar size={34} className="user-avatar">
                {auth.session.full_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </Avatar>
              <div className="user-meta">
                <strong>{auth.session.full_name}</strong>
                <small>{roleLabels[auth.session.role]}</small>
              </div>
              <Button
                icon={<LogOut size={15} />}
                type="text"
                aria-label="Go to demo sign in"
                onClick={handleSignOut}
              />
            </div>
          </div>
        </header>
        <div className="demo-mode-strip">
          <span className="demo-pulse" />
          DEMO MODE <span>•</span> Local browser data only. Sync is simulated
          across this browser, not separate devices.
        </div>
        <div className="page-content">
          {routeForbidden ? (
            <section className="access-denied">
              <ShieldCheck size={28} />
              <h1>Access restricted</h1>
              <p>
                This workspace role does not have access to this section. Switch
                to an authorized demo role to continue.
              </p>
            </section>
          ) : (
            props.children
          )}
        </div>
      </main>
    </div>
  );
}
