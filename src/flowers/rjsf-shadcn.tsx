"use client";

import { ChangeEvent } from "react";
import type {
  WidgetProps,
  RegistryWidgetsType,
  RegistryFieldsType,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
} from "@rjsf/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function TextWidget({ id, value, onChange, placeholder, disabled, readonly, required }: WidgetProps) {
  return (
    <Input
      id={id}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readonly}
      required={required}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value === "" ? undefined : e.target.value)
      }
    />
  );
}

function TextareaWidget({ id, value, onChange, placeholder, disabled, readonly, required, options }: WidgetProps) {
  const rows = (options?.rows as number | undefined) ?? 4;
  return (
    <Textarea
      id={id}
      value={value ?? ""}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readonly}
      required={required}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
        onChange(e.target.value === "" ? undefined : e.target.value)
      }
    />
  );
}

function NumberWidget({ id, value, onChange, placeholder, disabled, readonly, required }: WidgetProps) {
  return (
    <Input
      id={id}
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readonly}
      required={required}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") return onChange(undefined);
        const n = Number(raw);
        onChange(Number.isNaN(n) ? undefined : n);
      }}
    />
  );
}

function SelectWidget({ id, value, onChange, options, disabled, readonly, placeholder }: WidgetProps) {
  const enumOptions = (options.enumOptions ?? []) as { label: string; value: string }[];
  return (
    <Select
      value={value == null ? "" : String(value)}
      disabled={disabled || readonly}
      onValueChange={(v) => onChange(v === "" ? undefined : v)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder ?? "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {enumOptions.map((opt) => (
          <SelectItem key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FieldTemplate(props: FieldTemplateProps) {
  const { id, label, required, children, errors, help, description, hidden, displayLabel } = props;
  if (hidden) return <div className="hidden">{children}</div>;
  return (
    <div className="space-y-1.5">
      {displayLabel && label && (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
      )}
      {description}
      {children}
      {errors}
      {help}
    </div>
  );
}

function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { title, description, properties } = props;
  const isRoot = props.idSchema?.$id === "root";
  const body = (
    <div className="space-y-4">
      {title && !isRoot && <h3 className="text-base font-medium">{title}</h3>}
      {description}
      <div className="space-y-4">
        {properties.map((p) => (
          <div key={p.name}>{p.content}</div>
        ))}
      </div>
    </div>
  );
  if (isRoot) return body;
  return (
    <Card>
      <CardContent className="pt-6">{body}</CardContent>
    </Card>
  );
}

function ArrayFieldItemTemplate(props: ArrayFieldTemplateItemType) {
  const { children, hasRemove, onDropIndexClick, index, hasMoveDown, hasMoveUp, onReorderClick } = props;
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {children}
        <div className="flex gap-2">
          {hasMoveUp && (
            <Button type="button" variant="outline" size="sm" onClick={onReorderClick(index, index - 1)}>
              Up
            </Button>
          )}
          {hasMoveDown && (
            <Button type="button" variant="outline" size="sm" onClick={onReorderClick(index, index + 1)}>
              Down
            </Button>
          )}
          {hasRemove && (
            <Button type="button" variant="destructive" size="sm" onClick={onDropIndexClick(index)}>
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { title, items, canAdd, onAddClick } = props;
  return (
    <div className="space-y-3">
      {title && <h3 className="text-base font-medium">{title}</h3>}
      <div className="space-y-3">
        {items.map((item) => (
          <ArrayFieldItemTemplate key={item.key} {...item} />
        ))}
      </div>
      {canAdd && (
        <Button type="button" variant="secondary" onClick={onAddClick}>
          Add item
        </Button>
      )}
    </div>
  );
}

export const shadcnWidgets: RegistryWidgetsType = {
  TextWidget,
  TextareaWidget: TextareaWidget,
  EmailWidget: TextWidget,
  URLWidget: TextWidget,
  PasswordWidget: TextWidget,
  UpDownWidget: NumberWidget,
  RangeWidget: NumberWidget,
  SelectWidget,
};

export const shadcnFields: RegistryFieldsType = {};

export const shadcnTemplates = {
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
  ArrayFieldItemTemplate,
  ButtonTemplates: {
    SubmitButton: () => (
      <Button type="submit" className="mt-4">
        Submit
      </Button>
    ),
  },
};
