"use client";

import React from "react";
import { Alert, Button, Divider, Switch, message } from "antd";
import {
  Database,
  MonitorCog,
  Palette,
  PlugZap,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  PageHeadingSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";

export function SettingsSection() {
  function loadSettings() {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem("buildstock:settings");
    if (raw) {
      try {
        return JSON.parse(raw) as {
          compact_tables?: boolean;
          sound_enabled?: boolean;
          low_stock_alerts?: boolean;
          terminal_integration?: boolean;
        };
      } catch {
        window.localStorage.removeItem("buildstock:settings");
      }
    }
    return {};
  }
  const saved = loadSettings();
  const [compactTables, setCompactTables] = React.useState(
    saved.compact_tables ?? true,
  );
  const [soundEnabled, setSoundEnabled] = React.useState(
    saved.sound_enabled ?? false,
  );
  const [lowStockAlerts, setLowStockAlerts] = React.useState(
    saved.low_stock_alerts ?? true,
  );
  const [terminalIntegration, setTerminalIntegration] = React.useState(
    saved.terminal_integration ?? false,
  );

  function saveSettings() {
    window.localStorage.setItem(
      "buildstock:settings",
      JSON.stringify({
        compact_tables: compactTables,
        sound_enabled: soundEnabled,
        low_stock_alerts: lowStockAlerts,
        terminal_integration: terminalIntegration,
      }),
    );
    message.success("Preferences saved in this browser.");
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Workspace configuration"
        title="Settings"
        description="Configure local demo preferences and review production integration boundaries."
        action={
          <Button
            type="primary"
            icon={<Save size={15} />}
            onClick={saveSettings}
          >
            Save preferences
          </Button>
        }
      />
      <Alert
        type="info"
        showIcon
        message="Local preferences only"
        description="Settings are saved in this browser's local storage and do not configure a shared server."
      />
      <SectionCardSecondary
        title="Workspace preferences"
        subtitle="Visual preferences and local notifications"
      >
        <div className="settings-list">
          <div className="settings-item">
            <span className="settings-item-icon">
              <MonitorCog size={18} />
            </span>
            <span>
              <strong>Compact tables</strong>
              <small>
                Use denser spacing for inventory and transaction registers.
              </small>
            </span>
            <Switch checked={compactTables} onChange={setCompactTables} />
          </div>
          <Divider />
          <div className="settings-item">
            <span className="settings-item-icon">
              <Database size={18} />
            </span>
            <span>
              <strong>Low stock alerts</strong>
              <small>Highlight balances at or below the reorder level.</small>
            </span>
            <Switch checked={lowStockAlerts} onChange={setLowStockAlerts} />
          </div>
          <Divider />
          <div className="settings-item">
            <span className="settings-item-icon">
              <Palette size={18} />
            </span>
            <span>
              <strong>Checkout sound</strong>
              <small>
                Enable an optional success sound on committed checkout (reserved
                for future refinement).
              </small>
            </span>
            <Switch checked={soundEnabled} onChange={setSoundEnabled} />
          </div>
        </div>
      </SectionCardSecondary>
      <SectionCardSecondary
        title="Optional integrations"
        subtitle="No live provider credentials are connected"
      >
        <div className="settings-item">
          <span className="settings-item-icon orange">
            <PlugZap size={18} />
          </span>
          <span>
            <strong>External POS terminal adapter</strong>
            <small>
              Enable this preference to show that the client wants an
              integration review. This does not connect to Paystack, Moniepoint
              or a physical terminal.
            </small>
          </span>
          <Switch
            checked={terminalIntegration}
            onChange={setTerminalIntegration}
          />
        </div>
        {terminalIntegration ? (
          <Alert
            className="settings-alert"
            type="warning"
            showIcon
            message="Integration requested, not connected"
            description="Before implementation, confirm exact terminal models, provider API access, merchant eligibility, payment status verification and reconciliation requirements."
          />
        ) : null}
      </SectionCardSecondary>
      <SectionCardSecondary
        title="Security & migration"
        subtitle="Production requirements"
      >
        <div className="policy-list">
          <div>
            <ShieldCheck size={17} />
            <span>
              <strong>Server-side branch isolation</strong>
              <small>
                The future Django API must authorize branch scope on every list,
                detail, report, export and sync endpoint.
              </small>
            </span>
          </div>
          <div>
            <Database size={17} />
            <span>
              <strong>DRF API contract</strong>
              <small>
                Snake-case fields, UUID identifiers, kobo integer amounts,
                standard pagination and field validation responses.
              </small>
            </span>
          </div>
        </div>
      </SectionCardSecondary>
    </div>
  );
}
