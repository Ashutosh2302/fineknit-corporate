import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { ClientSkuModel } from "@/models/ClientSku";

const schema = z.object({
  clientId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId || !Types.ObjectId.isValid(clientId)) {
    return NextResponse.json({ error: "Valid clientId is required" }, { status: 400 });
  }

  await connectToDatabase();
  const skus = await ClientSkuModel.find({ clientId }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    skus: skus.map((sku) => ({
      id: sku._id,
      clientId: sku.clientId,
      name: sku.name,
      description: sku.description,
      imageUrl: sku.imageUrl,
      createdAt: sku.createdAt,
      updatedAt: sku.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const payload = schema.parse(await request.json());
    if (!Types.ObjectId.isValid(payload.clientId)) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }

    await connectToDatabase();
    const sku = await ClientSkuModel.create({
      clientId: payload.clientId,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl ?? "",
    });

    return NextResponse.json(
      {
        sku: {
          id: sku._id,
          clientId: sku.clientId,
          name: sku.name,
          description: sku.description,
          imageUrl: sku.imageUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create SKU" }, { status: 500 });
  }
}
