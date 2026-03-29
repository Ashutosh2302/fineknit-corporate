import { model, models, Schema, type InferSchemaType } from "mongoose";

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    address: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordExpiryDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

export type Client = InferSchemaType<typeof clientSchema> & { _id: string };

export const ClientModel = models.Client || model("Client", clientSchema);
