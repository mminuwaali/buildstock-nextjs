import React from "react";

/** Header composition boundary for standalone page headers. */
export function HeaderLayout(props: { children: React.ReactNode }) {
  return <header className="page-header-layout">{props.children}</header>;
}
