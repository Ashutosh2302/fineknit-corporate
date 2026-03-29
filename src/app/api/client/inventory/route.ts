import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { InventoryModel } from "@/models/Inventory";
import "@/models/ClientSku";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "client");
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const inventoryRows = await InventoryModel.find({ clientId: auth.sub })
    .populate("skuId", "name description imageUrl")
    .sort({ updatedAt: -1 })
    .lean();

  const totalInventory = inventoryRows.reduce((acc, row) => acc + row.totalQuantity, 0);
  const totalUsed = inventoryRows.reduce((acc, row) => acc + row.usedQuantity, 0);

  return NextResponse.json(
    {
      summary: {
        totalInventory,
        totalUsed,
        totalAvailable: totalInventory - totalUsed,
      },
      inventory: inventoryRows.map((row) => ({
        id: row._id,
        totalQuantity: row.totalQuantity,
        usedQuantity: row.usedQuantity,
        availableQuantity: row.totalQuantity - row.usedQuantity,
        sku: row.skuId,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
