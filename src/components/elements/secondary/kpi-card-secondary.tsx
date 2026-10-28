import React from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export function KpiCardSecondary(props: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "blue" | "orange" | "green" | "gray";
  trend?: "up" | "down";
}) {
  const Icon = props.icon;
  const Trend = props.trend === "down" ? ArrowDownRight : ArrowUpRight;
  return (
    <article className="kpi-card">
      <div className={`kpi-icon tone-${props.tone ?? "blue"}`}>
        <Icon size={19} />
      </div>
      <div className="kpi-content">
        <span>{props.label}</span>
        <strong>{props.value}</strong>
        <small>{props.hint}</small>
      </div>
      {props.trend ? (
        <Trend size={16} className={`kpi-trend trend-${props.trend}`} />
      ) : null}
    </article>
  );
}
