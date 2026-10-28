import React from "react";
import { Empty } from "antd";

export function EmptyPrimary(props: { title: string; description?: string }) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span>
          <strong>{props.title}</strong>
          {props.description ? (
            <small className="empty-description">{props.description}</small>
          ) : null}
        </span>
      }
    />
  );
}
