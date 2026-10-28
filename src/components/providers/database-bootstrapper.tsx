"use client";

import React from "react";
import { Alert, Spin } from "antd";
import { bootstrapDatabase } from "@/libraries/offline/seed";

export function DatabaseBootstrapper(props: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    bootstrapDatabase()
      .then(() => setReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not initialize local demo storage",
        );
      });
  }, []);

  if (error)
    return (
      <main className="bootstrap-error">
        <Alert
          type="error"
          showIcon
          message="Local storage could not be initialized"
          description={error}
        />
      </main>
    );
  if (!ready)
    return (
      <main className="bootstrap-screen">
        <Spin size="large" />
        <span>Preparing your local workspace…</span>
      </main>
    );
  return props.children;
}
