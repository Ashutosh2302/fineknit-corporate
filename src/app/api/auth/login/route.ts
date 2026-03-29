import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { AdminModel } from "@/models/Admin";
import { ClientModel } from "@/models/Client";

const schema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(6),
  portal: z.enum(["admin", "client"]),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await connectToDatabase();

    if (body.portal === "admin") {
      const admin = await AdminModel.findOne({
        $or: [
          { email: body.identifier.toLowerCase() },
          { phone: body.identifier },
        ],
      });

      if (
        !admin ||
        !(await verifyPassword(body.password, admin.passwordHash))
      ) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }

      await setSessionCookie({
        sub: admin._id.toString(),
        role: "admin",
        type: admin.type,
      });

      return NextResponse.json({
        user: {
          id: admin._id,
          email: admin.email,
          phone: admin.phone,
          type: admin.type,
          role: "admin",
        },
      });
    }

    const client = await ClientModel.findOne({
      $or: [
        { email: body.identifier.toLowerCase() },
        { phoneNumber: body.identifier },
      ],
    });

    if (
      !client ||
      !(await verifyPassword(body.password, client.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const passwordExpiryDate = client.passwordExpiryDate
      ? new Date(client.passwordExpiryDate)
      : new Date(0);
    if (passwordExpiryDate.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          error: "Password expired. Update your password to continue.",
          code: "PASSWORD_EXPIRED",
        },
        { status: 403 },
      );
    }

    await setSessionCookie({
      sub: client._id.toString(),
      role: "client",
    });

    return NextResponse.json({
      user: {
        id: client._id,
        name: client.name,
        email: client.email,
        phoneNumber: client.phoneNumber,
        role: "client",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    console.error("Login failed:", error);

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
