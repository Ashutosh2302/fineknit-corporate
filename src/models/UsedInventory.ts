import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const sizeQuantitiesSchema = new Schema(
  {
    s: { type: Number, min: 0, default: 0 },
    m: { type: Number, min: 0, default: 0 },
    l: { type: Number, min: 0, default: 0 },
    xl: { type: Number, min: 0, default: 0 },
    xxl: { type: Number, min: 0, default: 0 },
    free_size: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const usedInventorySchema = new Schema(
  {
    inventoryId: { type: Types.ObjectId, required: true, ref: "Inventory", index: true },
    employeeName: { type: String, required: true, trim: true },
    employeeId: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    quantities: { type: sizeQuantitiesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export type UsedInventory = InferSchemaType<typeof usedInventorySchema> & { _id: string };

export const UsedInventoryModel =
  models.UsedInventory || model("UsedInventory", usedInventorySchema);
