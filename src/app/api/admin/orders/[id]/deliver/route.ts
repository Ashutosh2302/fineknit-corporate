import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { ClientOrderModel } from "@/models/ClientOrder";
import { InventoryModel } from "@/models/Inventory";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid order line item id" }, { status: 400 });
  }

  await connectToDatabase();

  const row = await ClientOrderModel.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Order line item not found" }, { status: 404 });
  }

  if (!row.delivered) {
    row.delivered = true;
    row.deliveryDate = row.deliveryDate ?? new Date();
    await row.save();

    await InventoryModel.findOneAndUpdate(
      { clientId: row.clientId, skuId: row.skuId },
      { $inc: { totalQuantity: row.quantity } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  return NextResponse.json({ ok: true, lineItem: row });
}
