import React from "react";
import type { ReactNode } from "react";

export function SectionCardSecondary(props: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section-card ${props.className ?? ""}`}>
      <header className="section-card-header">
        <div>
          <h2>{props.title}</h2>
          {props.subtitle ? <p>{props.subtitle}</p> : null}
        </div>
        {props.action ? <div>{props.action}</div> : null}
      </header>
      {props.children}
    </section>
  );
}
