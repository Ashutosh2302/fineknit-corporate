import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AdminModel } from "@/models/Admin";

const schema = z.object({
  identifier: z.string().trim().min(1),
  newPassword: z.string().min(6),
});

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function getProvidedSecret(request: Request) {
  const headerSecret = request.headers.get("x-admin-secret")?.trim();
  if (headerSecret) return headerSecret;

  const authHeader = request.headers.get("authorization") ?? "";
  const bearerPrefix = "Bearer ";
  if (authHeader.startsWith(bearerPrefix)) {
    return authHeader.slice(bearerPrefix.length).trim();
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const requiredSecret = process.env.ADMIN_PASSWORD_UPDATE_SECRET;
    if (!requiredSecret) {
      return NextResponse.json(
        { error: "Secret admin password update API is not configured." },
        { status: 503 }
      );
    }

    const providedSecret = getProvidedSecret(request);
    if (!providedSecret || !safeEqual(providedSecret, requiredSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = schema.parse(await request.json());
    await connectToDatabase();

    const admin = await AdminModel.findOne({
      $or: [{ email: payload.identifier.toLowerCase() }, { phone: payload.identifier }],
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    admin.passwordHash = await hashPassword(payload.newPassword);
    admin.resetToken = null;
    admin.resetTokenExpiresAt = null;
    await admin.save();

    return NextResponse.json({
      ok: true,
      admin: {
        id: admin._id,
        email: admin.email,
        phone: admin.phone,
        type: admin.type,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to update admin password" }, { status: 500 });
  }
}
