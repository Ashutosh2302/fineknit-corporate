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

const clientOrderSchema = new Schema(
  {
    orderCode: { type: String, required: true, index: true },
    clientId: { type: Types.ObjectId, required: true, ref: "Client", index: true },
    skuId: { type: Types.ObjectId, required: true, ref: "ClientSku", index: true },
    invoiceUrl: { type: String, default: "", trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    quantities: { type: sizeQuantitiesSchema, default: () => ({}) },
    delivered: { type: Boolean, default: false, index: true },
    deliveryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export type ClientOrder = InferSchemaType<typeof clientOrderSchema> & { _id: string };

export const ClientOrderModel = models.ClientOrder || model("ClientOrder", clientOrderSchema);
