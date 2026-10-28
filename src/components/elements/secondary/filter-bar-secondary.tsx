"use client";

import React from "react";
import { Input, Select } from "antd";
import { Search } from "lucide-react";

export function FilterBarSecondary(props: {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  category?: string;
  categories?: string[];
  onCategory?: (value: string) => void;
}) {
  return (
    <div className="filter-bar">
      <Input
        allowClear
        prefix={<Search size={16} />}
        value={props.search}
        onChange={(event) => props.onSearch(event.target.value)}
        placeholder={props.placeholder ?? "Search records…"}
      />
      {props.categories && props.onCategory ? (
        <Select
          value={props.category ?? "all"}
          onChange={props.onCategory}
          options={[
            { value: "all", label: "All categories" },
            ...props.categories.map((category) => ({
              value: category,
              label: category,
            })),
          ]}
        />
      ) : null}
    </div>
  );
}
