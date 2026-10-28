"use client";

import React from "react";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("BuildStock runtime error", props.error);
  }, [props.error]);
  return (
    <html lang="en">
      <body>
        <main className="global-error-page">
          <h1>Something went wrong</h1>
          <p>
            BuildStock could not complete that action. Your locally saved
            transactions should remain in browser storage.
          </p>
          <button onClick={props.reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
