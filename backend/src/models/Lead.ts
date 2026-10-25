import { Schema, model, type InferSchemaType } from "mongoose";

export const leadStatuses = ["New", "Contacted", "Qualified", "Converted", "Lost"] as const;

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    company: { type: String, trim: true, maxlength: 120, default: "" },
    serviceInterested: { type: String, trim: true, maxlength: 120, default: "" },
    status: { type: String, enum: leadStatuses, default: "New", required: true },
    followUpDate: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 5000, default: "" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

leadSchema.index({ owner: 1, createdAt: -1 });

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const Lead = model("Lead", leadSchema);
