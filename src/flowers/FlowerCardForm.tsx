"use client";

import { useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { zodToJsonSchema } from "zod-to-json-schema";
import { FlowerCardSchema, type FlowerCard } from "./schema";
import { FlowerCardPreview } from "./index";
import { shadcnWidgets, shadcnFields, shadcnTemplates } from "./rjsf-shadcn";

const jsonSchema = zodToJsonSchema(FlowerCardSchema, {
  $refStrategy: "none",
}) as Record<string, unknown>;

const uiSchema = {
  content: {
    htmlContent: {
      "ui:widget": "textarea",
      "ui:options": { rows: 6 },
    },
  },
  bouquet: {
    flowers: {
      "ui:options": { orderable: false },
    },
  },
};

const initialFormData: FlowerCard = {
  content: {
    htmlContent: "<p>Happy Mother's Day! 💐</p>",
  },
  bouquet: {
    flowers: [
      { color: "#ff66b2", type: "rose", size: "medium", quantity: 5 },
      { color: "#ffd166", type: "tulip", size: "medium", quantity: 3 },
    ],
  },
};

function safeParse(data: unknown): FlowerCard | null {
  const result = FlowerCardSchema.safeParse(data);
  return result.success ? result.data : null;
}

export default function FlowerCardForm() {
  const [formData, setFormData] = useState<FlowerCard>(initialFormData);
  const validCard = safeParse(formData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <aside className="border-r p-6 overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-6">FlowerCard form</h1>
        <Form
          schema={jsonSchema}
          uiSchema={uiSchema}
          validator={validator}
          widgets={shadcnWidgets}
          fields={shadcnFields}
          templates={shadcnTemplates}
          formData={formData}
          onChange={({ formData: next }) => setFormData(next as FlowerCard)}
          liveValidate
        />
      </aside>

      <section className="p-6 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6">Preview</h2>
        {validCard ? (
          <FlowerCardPreview card={validCard} />
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Fill in the form to see a valid FlowerCard preview. The current data
            doesn&apos;t satisfy the schema yet.
          </div>
        )}
      </section>
    </div>
  );
}
