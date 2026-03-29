import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const inventorySchema = new Schema(
  {
    clientId: { type: Types.ObjectId, required: true, ref: "Client", index: true },
    skuId: { type: Types.ObjectId, required: true, ref: "ClientSku", index: true },
    totalQuantity: { type: Number, required: true, min: 0, default: 0 },
    usedQuantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

inventorySchema.index({ clientId: 1, skuId: 1 }, { unique: true });

export type Inventory = InferSchemaType<typeof inventorySchema> & { _id: string };

export const InventoryModel = models.Inventory || model("Inventory", inventorySchema);
