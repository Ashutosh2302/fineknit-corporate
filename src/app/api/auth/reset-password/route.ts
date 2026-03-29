import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AdminModel } from "@/models/Admin";

const schema = z.object({
  token: z.string().trim().min(1),
  newPassword: z.string().min(6),
  portal: z.enum(["admin", "client"]),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await connectToDatabase();

    const now = new Date();

    if (body.portal === "admin") {
      const admin = await AdminModel.findOne({
        resetToken: body.token,
        resetTokenExpiresAt: { $gt: now },
      });

      if (!admin) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
      }

      admin.passwordHash = await hashPassword(body.newPassword);
      admin.resetToken = null;
      admin.resetTokenExpiresAt = null;
      await admin.save();

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      {
        error:
          "Client reset token flow is disabled. Login with current password and update when prompted.",
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
}
