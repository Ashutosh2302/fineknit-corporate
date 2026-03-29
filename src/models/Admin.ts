import { model, models, Schema, type InferSchemaType } from "mongoose";

const adminSchema = new Schema(
  {
    phone: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
      required: true,
    },
    passwordHash: { type: String, required: true },
    resetToken: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type Admin = InferSchemaType<typeof adminSchema> & { _id: string };

export const AdminModel = models.Admin || model("Admin", adminSchema);
