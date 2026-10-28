import React from "react";
import { Breadcrumb } from "antd";
import type { ReactNode } from "react";

export function PageHeadingSecondary(props: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: string[];
}) {
  return (
    <header className="page-heading">
      <div className="page-heading-copy">
        {props.breadcrumb ? (
          <Breadcrumb
            items={props.breadcrumb.map((item) => ({ title: item }))}
          />
        ) : null}
        {props.eyebrow ? (
          <span className="eyebrow">{props.eyebrow}</span>
        ) : null}
        <h1>{props.title}</h1>
        {props.description ? <p>{props.description}</p> : null}
      </div>
      {props.action ? (
        <div className="page-heading-action">{props.action}</div>
      ) : null}
    </header>
  );
}
