"use client";

import React from "react";
import { Alert } from "antd";

export function DemoBanner() {
  return (
    <Alert
      className="demo-banner"
      type="info"
      showIcon
      message="Demo workspace · Local-only prototype"
      description="Changes persist in this browser. Sync acknowledgements are simulated; separate devices do not share data until a real Django API is connected."
    />
  );
}
