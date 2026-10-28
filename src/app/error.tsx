"use client";

import React from "react";

export default function ErrorBoundary(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("BuildStock route error", props.error);
  }, [props.error]);
  return (
    <main className="global-error-page">
      <h1>We hit a snag</h1>
      <p>
        This screen did not load. Your locally saved transactions should remain
        in browser storage.
      </p>
      <button onClick={props.reset}>Try again</button>
    </main>
  );
}
