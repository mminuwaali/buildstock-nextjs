"use client";

import React from "react";
import { Button, Input, Select } from "antd";
import type { ButtonProps, InputProps, SelectProps } from "antd";

export function ButtonForm(props: ButtonProps) {
  return <Button {...props} />;
}

export function InputForm(props: InputProps) {
  return <Input {...props} />;
}

export function SelectForm(props: SelectProps) {
  return <Select {...props} />;
}

export function FormFieldLabel(props: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="form-field-label" htmlFor={props.htmlFor}>
      {props.children}
      {props.required ? <span aria-hidden="true"> *</span> : null}
    </label>
  );
}
