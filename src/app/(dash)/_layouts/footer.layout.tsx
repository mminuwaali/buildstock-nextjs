import React from "react";

/** Footer composition boundary for page-specific actions and pagination. */
export function FooterLayout(props: { children: React.ReactNode }) {
  return <footer className="page-footer-layout">{props.children}</footer>;
}
