import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const usedInventorySchema = new Schema(
  {
    inventoryId: { type: Types.ObjectId, required: true, ref: "Inventory", index: true },
    employeeName: { type: String, required: true, trim: true },
    employeeId: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export type UsedInventory = InferSchemaType<typeof usedInventorySchema> & { _id: string };

export const UsedInventoryModel =
  models.UsedInventory || model("UsedInventory", usedInventorySchema);
