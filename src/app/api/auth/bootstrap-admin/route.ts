import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AdminModel } from "@/models/Admin";

const schema = z.object({
  email: z.string().email(),
  phone: z.string().trim().min(6),
  password: z.string().min(6),
  type: z.enum(["super_admin", "admin"]).default("super_admin"),
  setupKey: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await connectToDatabase();

    const adminCount = await AdminModel.countDocuments();
    const requiredSetupKey = process.env.ADMIN_SETUP_KEY;

    if (adminCount > 0 && (!requiredSetupKey || payload.setupKey !== requiredSetupKey)) {
      return NextResponse.json(
        { error: "Admin already exists. Provide valid setupKey to add another admin." },
        { status: 403 }
      );
    }

    const existing = await AdminModel.findOne({ email: payload.email.toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json({ error: "Admin email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(payload.password);

    const admin = await AdminModel.create({
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      type: payload.type,
      passwordHash,
    });

    return NextResponse.json(
      {
        admin: {
          id: admin._id,
          email: admin.email,
          phone: admin.phone,
          type: admin.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create admin" }, { status: 500 });
  }
}
