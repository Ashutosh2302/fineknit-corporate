import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";
import { ClientModel } from "@/models/Client";

const schema = z.object({
  identifier: z.string().trim().min(1),
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await connectToDatabase();

    const client = await ClientModel.findOne({
      $or: [{ email: body.identifier.toLowerCase() }, { phoneNumber: body.identifier }],
    });

    if (!client || !(await verifyPassword(body.currentPassword, client.passwordHash))) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
    }

    const passwordExpiryDate = client.passwordExpiryDate
      ? new Date(client.passwordExpiryDate)
      : new Date(0);

    if (passwordExpiryDate.getTime() > Date.now()) {
      return NextResponse.json(
        { error: "Password is not expired. Please use normal login." },
        { status: 400 }
      );
    }

    client.passwordHash = await hashPassword(body.newPassword);
    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 100);
    client.passwordExpiryDate = newExpiryDate;
    await client.save();

    await setSessionCookie({
      sub: client._id.toString(),
      role: "client",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
