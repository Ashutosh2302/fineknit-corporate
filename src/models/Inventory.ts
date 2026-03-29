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

const inventorySchema = new Schema(
  {
    clientId: { type: Types.ObjectId, required: true, ref: "Client", index: true },
    skuId: { type: Types.ObjectId, required: true, ref: "ClientSku", index: true },
    totalQuantities: { type: sizeQuantitiesSchema, default: () => ({}) },
    usedQuantities: { type: sizeQuantitiesSchema, default: () => ({}) },
    totalQuantity: { type: Number, required: true, min: 0, default: 0 },
    usedQuantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

inventorySchema.index({ clientId: 1, skuId: 1 }, { unique: true });

export type Inventory = InferSchemaType<typeof inventorySchema> & { _id: string };

export const InventoryModel = models.Inventory || model("Inventory", inventorySchema);
