import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const clientOrderSchema = new Schema(
  {
    orderCode: { type: String, required: true, index: true },
    clientId: { type: Types.ObjectId, required: true, ref: "Client", index: true },
    skuId: { type: Types.ObjectId, required: true, ref: "ClientSku", index: true },
    invoiceUrl: { type: String, default: "", trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    delivered: { type: Boolean, default: false, index: true },
    deliveryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export type ClientOrder = InferSchemaType<typeof clientOrderSchema> & { _id: string };

export const ClientOrderModel = models.ClientOrder || model("ClientOrder", clientOrderSchema);
