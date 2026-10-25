import { Schema, model, type InferSchemaType } from "mongoose";

const reminderDeliverySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    claimedAt: { type: Date, default: Date.now, required: true },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reminderDeliverySchema.index({ owner: 1, date: 1 }, { unique: true });

export type ReminderDeliveryDocument = InferSchemaType<typeof reminderDeliverySchema>;
export const ReminderDelivery = model("ReminderDelivery", reminderDeliverySchema);
