import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { InventoryModel } from "@/models/Inventory";
import { UsedInventoryModel } from "@/models/UsedInventory";
import "@/models/ClientSku";
import {
  hasPositiveSizeQuantity,
  normalizeSizeQuantities,
  subtractSizeQuantities,
  sumSizeQuantities,
} from "@/lib/size-quantities";

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
  const total = normalizeSizeQuantities(inventory.totalQuantities);
  const used = normalizeSizeQuantities(inventory.usedQuantities);
  if (!hasPositiveSizeQuantity(total) && inventory.totalQuantity > 0) {
    total.free_size = inventory.totalQuantity;
  }
  if (!hasPositiveSizeQuantity(used) && inventory.usedQuantity > 0) {
    used.free_size = inventory.usedQuantity;
  }

  return NextResponse.json(
    {
      inventory: {
        id: inventory._id,
        totalQuantity: sumSizeQuantities(total),
        usedQuantity: sumSizeQuantities(used),
        availableQuantity: sumSizeQuantities(total) - sumSizeQuantities(used),
        totalQuantitiesBySize: total,
        usedQuantitiesBySize: used,
        availableQuantitiesBySize: subtractSizeQuantities(total, used),
        sku: inventory.skuId,
      },
      distributed: rows.map((row) => ({
        id: row._id,
        employeeName: row.employeeName,
        employeeId: row.employeeId,
        quantity: row.quantity,
        quantities: (() => {
          const quantities = normalizeSizeQuantities(row.quantities);
          if (!hasPositiveSizeQuantity(quantities) && row.quantity > 0) {
            quantities.free_size = row.quantity;
          }
          return quantities;
        })(),
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
