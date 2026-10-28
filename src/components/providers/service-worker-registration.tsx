"use client";

import React from "react";

export function ServiceWorkerRegistration() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error: unknown) =>
          console.error("Service worker registration failed", error),
        );
  }, []);
  return null;
}
