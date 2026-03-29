import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/api-auth";
import { ClientModel } from "@/models/Client";

const createClientSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().min(6),
  address: z.string().trim().min(1),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const clients = await ClientModel.find().sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    clients: clients.map((client) => ({
      id: client._id,
      name: client.name,
      email: client.email,
      phoneNumber: client.phoneNumber,
      address: client.address,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const payload = createClientSchema.parse(await request.json());
    await connectToDatabase();

    const existing = await ClientModel.findOne({
      $or: [{ email: payload.email.toLowerCase() }, { phoneNumber: payload.phoneNumber }],
    }).lean();

    if (existing) {
      return NextResponse.json({ error: "Client already exists with same email or phone" }, { status: 409 });
    }

    const initialPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(initialPassword);

    const client = await ClientModel.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      passwordHash,
      passwordExpiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    return NextResponse.json(
      {
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          phoneNumber: client.phoneNumber,
          address: client.address,
        },
        initialPassword,
        message: "Client created. Share the initial password with the client manually.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
