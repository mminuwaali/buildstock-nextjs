"use client";

import React from "react";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

export function DataTableSecondary<T extends object>(props: {
  columns: ColumnsType<T>;
  data: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  pagination?: false | TablePaginationConfig;
  size?: "small" | "middle" | "large";
  onRowClick?: (record: T) => void;
}) {
  return (
    <Table<T>
      columns={props.columns}
      dataSource={props.data}
      rowKey={props.rowKey}
      loading={props.loading}
      pagination={props.pagination}
      size={props.size ?? "middle"}
      onRow={
        props.onRowClick
          ? function (record) {
              return {
                onClick: () => props.onRowClick?.(record),
                className: "clickable-row",
              };
            }
          : undefined
      }
      scroll={{ x: "max-content" }}
    />
  );
}
