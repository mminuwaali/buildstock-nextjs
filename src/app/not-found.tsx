import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="global-error-page">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/overview">Return to overview</Link>
    </main>
  );
}
