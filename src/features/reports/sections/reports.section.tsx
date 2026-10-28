"use client";

import React from "react";
import { Button, Select } from "antd";
import { Download, FileSpreadsheet, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { getSales } from "@/features/sales/api";
import { getOverview } from "@/features/reports/api";
import {
  PageHeadingSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";

function money(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
export function ReportsSection() {
  const auth = useAuth();
  const [period, setPeriod] = React.useState("7");
  const overview = useQuery({
    queryKey: ["overview", auth.session.branch_id],
    queryFn: () => getOverview(auth.session.branch_id ?? undefined),
  });
  const sales = useQuery({
    queryKey: ["sales-report", auth.session.branch_id],
    queryFn: () =>
      getSales(auth.session.branch_id ?? undefined, { page_size: 100 }),
  });
  const days = Number(period);
  const bars = React.useMemo(
    () =>
      Array.from({ length: days }, (_value, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - index - 1));
        const key = date.toISOString().slice(0, 10);
        const total = (sales.data?.results ?? [])
          .filter(
            (sale) =>
              sale.created_at.slice(0, 10) === key &&
              sale.sale_status === "completed",
          )
          .reduce((sum, sale) => sum + sale.total_minor, 0);
        return {
          label: new Intl.DateTimeFormat("en-NG", {
            weekday: "short",
            day: "numeric",
          }).format(date),
          key,
          total,
        };
      }),
    [days, sales.data],
  );
  const maximum = Math.max(...bars.map((bar) => bar.total), 1);

  function exportReport() {
    const csv = [
      "Date,Label,Sales NGN",
      ...bars.map((bar) => `${bar.key},${bar.label},${bar.total / 100}`),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "buildstock-sales-summary.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Business intelligence"
        title="Reports & performance"
        description="Track sales, store inventory and operational signals. Stock value is an indicative retail value, not accounting cost."
        action={
          <Button icon={<Download size={15} />} onClick={exportReport}>
            Export sales CSV
          </Button>
        }
      />
      <div className="kpi-grid compact-kpi-grid">
        <article className="mini-stat">
          <span>Sales in view</span>
          <strong>{(sales.data?.results ?? []).length}</strong>
          <small>Loaded transactions, maximum 100</small>
        </article>
        <article className="mini-stat">
          <span>Revenue in view</span>
          <strong>
            {money(
              (sales.data?.results ?? []).reduce(
                (sum, sale) => sum + sale.total_minor,
                0,
              ),
            )}
          </strong>
          <small>Completed and recorded sales</small>
        </article>
        <article className="mini-stat">
          <span>Stock valuation</span>
          <strong>{money(overview.data?.stock_value_minor ?? 0)}</strong>
          <small>At selling price</small>
        </article>
      </div>
      <SectionCardSecondary
        title="Sales trend"
        subtitle="Local demo sales grouped by the selected day range"
        action={
          <Select
            value={period}
            onChange={setPeriod}
            options={[
              { value: "7", label: "Last 7 days" },
              { value: "14", label: "Last 14 days" },
            ]}
          />
        }
      >
        <div className="sales-chart">
          {bars.map((bar) => (
            <div className="sales-chart-column" key={bar.key}>
              <div className="sales-chart-value">
                {bar.total ? money(bar.total) : "—"}
              </div>
              <div className="sales-chart-track">
                <div
                  className="sales-chart-bar"
                  style={{
                    height: `${Math.max(4, (bar.total / maximum) * 100)}%`,
                  }}
                />
              </div>
              <span>{bar.label}</span>
            </div>
          ))}
        </div>
        <div className="chart-footnote">
          <TrendingUp size={15} />
          <span>
            Only transactions retained in this browser&rsquo;s demo dataset are
            included. It is not a consolidated live business report.
          </span>
        </div>
      </SectionCardSecondary>
      <div className="dashboard-grid-bottom">
        <SectionCardSecondary
          title="Operational indicators"
          subtitle="Current branch scope"
        >
          <div className="report-metric-row">
            <span>Branches in scope</span>
            <strong>{overview.data?.branch_count ?? 0}</strong>
          </div>
          <div className="report-metric-row">
            <span>Active catalog items</span>
            <strong>{overview.data?.product_count ?? 0}</strong>
          </div>
          <div className="report-metric-row">
            <span>Low stock balances</span>
            <strong>{overview.data?.low_stock_count ?? 0}</strong>
          </div>
          <div className="report-metric-row">
            <span>Pending local sync</span>
            <strong>{overview.data?.pending_sync_count ?? 0}</strong>
          </div>
        </SectionCardSecondary>
        <SectionCardSecondary
          title="Report definitions"
          subtitle="Be clear about what each number means"
        >
          <div className="policy-list">
            <div>
              <FileSpreadsheet size={17} />
              <span>
                <strong>Revenue</strong>
                <small>Sum of completed sale totals; not profit.</small>
              </span>
            </div>
            <div>
              <TrendingUp size={17} />
              <span>
                <strong>Stock valuation</strong>
                <small>
                  Current on-hand quantity multiplied by selling price; use cost
                  prices for accounting valuation.
                </small>
              </span>
            </div>
          </div>
        </SectionCardSecondary>
      </div>
    </div>
  );
}
