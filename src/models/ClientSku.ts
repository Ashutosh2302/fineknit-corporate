import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const clientSkuSchema = new Schema(
  {
    clientId: { type: Types.ObjectId, required: true, ref: "Client", index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export type ClientSku = InferSchemaType<typeof clientSkuSchema> & { _id: string };

export const ClientSkuModel = models.ClientSku || model("ClientSku", clientSkuSchema);
