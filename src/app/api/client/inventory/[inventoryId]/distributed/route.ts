import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { InventoryModel } from "@/models/Inventory";
import { UsedInventoryModel } from "@/models/UsedInventory";
import "@/models/ClientSku";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ inventoryId: string }> }
) {
  const auth = requireRole(request, "client");
  if (auth instanceof NextResponse) return auth;

  const { inventoryId } = await context.params;
  if (!Types.ObjectId.isValid(inventoryId)) {
    return NextResponse.json({ error: "Invalid inventory id" }, { status: 400 });
  }

  await connectToDatabase();

  const inventory = await InventoryModel.findOne({ _id: inventoryId, clientId: auth.sub })
    .populate("skuId", "name description imageUrl")
    .lean();
  if (!inventory) {
    return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
  }

  const rows = await UsedInventoryModel.find({ inventoryId }).sort({ createdAt: -1 }).lean();

  return NextResponse.json(
    {
      inventory: {
        id: inventory._id,
        totalQuantity: inventory.totalQuantity,
        usedQuantity: inventory.usedQuantity,
        availableQuantity: inventory.totalQuantity - inventory.usedQuantity,
        sku: inventory.skuId,
      },
      distributed: rows.map((row) => ({
        id: row._id,
        employeeName: row.employeeName,
        employeeId: row.employeeId,
        quantity: row.quantity,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
