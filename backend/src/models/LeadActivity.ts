import { Schema, model, type InferSchemaType } from "mongoose";

const leadActivitySchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leadName: { type: String, required: true, maxlength: 120 },
    action: { type: String, enum: ["created", "updated", "deleted"], required: true },
    changedFields: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

leadActivitySchema.index({ owner: 1, leadId: 1, createdAt: -1 });

export type LeadActivityDocument = InferSchemaType<typeof leadActivitySchema>;
export const LeadActivity = model("LeadActivity", leadActivitySchema);
