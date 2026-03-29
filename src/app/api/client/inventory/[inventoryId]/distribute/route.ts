import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { InventoryModel } from "@/models/Inventory";
import { UsedInventoryModel } from "@/models/UsedInventory";

const schema = z.object({
  employeeName: z.string().trim().min(1),
  employeeId: z.string().trim().optional().default(""),
  quantity: z.number().int().positive(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ inventoryId: string }> }
) {
  const auth = requireRole(request, "client");
  if (auth instanceof NextResponse) return auth;

  const { inventoryId } = await context.params;
  if (!Types.ObjectId.isValid(inventoryId)) {
    return NextResponse.json({ error: "Invalid inventory id" }, { status: 400 });
  }

  try {
    const payload = schema.parse(await request.json());
    await connectToDatabase();

    const inventory = await InventoryModel.findOne({ _id: inventoryId, clientId: auth.sub });
    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }

    const available = inventory.totalQuantity - inventory.usedQuantity;
    if (payload.quantity > available) {
      return NextResponse.json({ error: "Insufficient available inventory" }, { status: 400 });
    }

    inventory.usedQuantity += payload.quantity;
    await inventory.save();

    const usage = await UsedInventoryModel.create({
      inventoryId: inventory._id,
      employeeName: payload.employeeName,
      employeeId: payload.employeeId,
      quantity: payload.quantity,
    });

    return NextResponse.json(
      {
        usedInventory: usage,
        inventory: {
          id: inventory._id,
          totalQuantity: inventory.totalQuantity,
          usedQuantity: inventory.usedQuantity,
          availableQuantity: inventory.totalQuantity - inventory.usedQuantity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to distribute inventory" }, { status: 500 });
  }
}
