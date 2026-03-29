import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { InventoryModel } from "@/models/Inventory";
import "@/models/ClientSku";
import {
  hasPositiveSizeQuantity,
  normalizeSizeQuantities,
  subtractSizeQuantities,
} from "@/lib/size-quantities";

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
        totalQuantitiesBySize:
          hasPositiveSizeQuantity(normalizeSizeQuantities(row.totalQuantities)) ||
          row.totalQuantity > 0
            ? (() => {
                const total = normalizeSizeQuantities(row.totalQuantities);
                if (!hasPositiveSizeQuantity(total) && row.totalQuantity > 0) {
                  total.free_size = row.totalQuantity;
                }
                return total;
              })()
            : normalizeSizeQuantities(),
        usedQuantitiesBySize:
          hasPositiveSizeQuantity(normalizeSizeQuantities(row.usedQuantities)) ||
          row.usedQuantity > 0
            ? (() => {
                const used = normalizeSizeQuantities(row.usedQuantities);
                if (!hasPositiveSizeQuantity(used) && row.usedQuantity > 0) {
                  used.free_size = row.usedQuantity;
                }
                return used;
              })()
            : normalizeSizeQuantities(),
        availableQuantitiesBySize: (() => {
          const total = normalizeSizeQuantities(row.totalQuantities);
          const used = normalizeSizeQuantities(row.usedQuantities);
          if (!hasPositiveSizeQuantity(total) && row.totalQuantity > 0) {
            total.free_size = row.totalQuantity;
          }
          if (!hasPositiveSizeQuantity(used) && row.usedQuantity > 0) {
            used.free_size = row.usedQuantity;
          }
          return subtractSizeQuantities(total, used);
        })(),
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
