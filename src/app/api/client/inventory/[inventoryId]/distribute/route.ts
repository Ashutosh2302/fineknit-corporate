import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { InventoryModel } from "@/models/Inventory";
import { UsedInventoryModel } from "@/models/UsedInventory";
import {
  addSizeQuantities,
  hasPositiveSizeQuantity,
  normalizeSizeQuantities,
  SIZE_KEYS,
  subtractSizeQuantities,
  sumSizeQuantities,
} from "@/lib/size-quantities";

const sizeQuantitiesInputSchema = z.object({
  s: z.number().int().nonnegative().optional(),
  m: z.number().int().nonnegative().optional(),
  l: z.number().int().nonnegative().optional(),
  xl: z.number().int().nonnegative().optional(),
  xxl: z.number().int().nonnegative().optional(),
  free_size: z.number().int().nonnegative().optional(),
});

const schema = z.object({
  employeeName: z.string().trim().min(1),
  employeeId: z.string().trim().optional().default(""),
  quantities: sizeQuantitiesInputSchema,
});

function normalizeInventoryMaps(inventory: {
  totalQuantities?: Record<string, number>;
  usedQuantities?: Record<string, number>;
  totalQuantity?: number;
  usedQuantity?: number;
}) {
  const total = normalizeSizeQuantities(inventory.totalQuantities);
  const used = normalizeSizeQuantities(inventory.usedQuantities);
  if (!hasPositiveSizeQuantity(total) && (inventory.totalQuantity ?? 0) > 0) {
    total.free_size = inventory.totalQuantity ?? 0;
  }
  if (!hasPositiveSizeQuantity(used) && (inventory.usedQuantity ?? 0) > 0) {
    used.free_size = inventory.usedQuantity ?? 0;
  }
  return { total, used };
}

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
    const requestedQuantities = normalizeSizeQuantities(payload.quantities);
    if (!hasPositiveSizeQuantity(requestedQuantities)) {
      return NextResponse.json({ error: "Please enter at least one size quantity." }, { status: 400 });
    }

    await connectToDatabase();

    const inventory = await InventoryModel.findOne({ _id: inventoryId, clientId: auth.sub });
    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }

    const { total, used } = normalizeInventoryMaps(inventory);
    const availableBySize = subtractSizeQuantities(total, used);
    for (const key of SIZE_KEYS) {
      if (requestedQuantities[key] > availableBySize[key]) {
        return NextResponse.json(
          { error: "Insufficient available inventory for selected size quantities." },
          { status: 400 }
        );
      }
    }

    const nextUsed = addSizeQuantities(used, requestedQuantities);
    inventory.totalQuantities = total;
    inventory.usedQuantities = nextUsed;
    inventory.totalQuantity = sumSizeQuantities(total);
    inventory.usedQuantity = sumSizeQuantities(nextUsed);
    await inventory.save();

    const usage = await UsedInventoryModel.create({
      inventoryId: inventory._id,
      employeeName: payload.employeeName,
      employeeId: payload.employeeId,
      quantities: requestedQuantities,
      quantity: sumSizeQuantities(requestedQuantities),
    });

    const remainingBySize = subtractSizeQuantities(total, nextUsed);
    return NextResponse.json(
      {
        usedInventory: usage,
        inventory: {
          id: inventory._id,
          totalQuantity: inventory.totalQuantity,
          usedQuantity: inventory.usedQuantity,
          availableQuantity: inventory.totalQuantity - inventory.usedQuantity,
          totalQuantitiesBySize: total,
          usedQuantitiesBySize: nextUsed,
          availableQuantitiesBySize: remainingBySize,
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
