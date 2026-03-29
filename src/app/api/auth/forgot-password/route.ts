import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { generateResetToken } from "@/lib/auth";
import { RESET_TOKEN_TTL_MS } from "@/lib/constants";
import { AdminModel } from "@/models/Admin";

const schema = z.object({
  identifier: z.string().trim().min(1),
  portal: z.enum(["admin", "client"]),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await connectToDatabase();

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    if (body.portal === "admin") {
      const admin = await AdminModel.findOne({
        $or: [{ email: body.identifier.toLowerCase() }, { phone: body.identifier }],
      });

      if (admin) {
        admin.resetToken = token;
        admin.resetTokenExpiresAt = expiresAt;
        await admin.save();
      }

      return NextResponse.json({
        ok: true,
        message: "If account exists, a reset token has been generated.",
        resetTokenForDev: admin ? token : undefined,
      });
    }

    return NextResponse.json(
      {
        error:
          "Client password reset token flow is disabled. Login with current password and update when prompted.",
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}
