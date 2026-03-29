import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { ClientOrderModel } from "@/models/ClientOrder";
import { InventoryModel } from "@/models/Inventory";
import { ClientSkuModel } from "@/models/ClientSku";

const createOrderSchema = z.object({
  clientId: z.string().trim().min(1),
  invoiceUrl: z.string().trim().optional().default(""),
  delivered: z.boolean().optional().default(false),
  deliveryDate: z.string().datetime().nullable().optional(),
  items: z
    .array(
      z.object({
        skuId: z.string().trim().min(1),
        quantity: z.number().int().positive(),
        sellingPrice: z.number().nonnegative(),
        costPrice: z.number().nonnegative(),
      })
    )
    .min(1),
});

const querySchema = z.object({
  clientId: z.string().trim().optional(),
});

const updateOrderDeliverySchema = z.object({
  orderCode: z.string().trim().min(1),
  action: z.enum(["deliver", "undo"]).default("deliver"),
  deliveryDate: z.string().datetime().optional(),
});

function newOrderCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  const parsedQuery = querySchema.safeParse({
    clientId: request.nextUrl.searchParams.get("clientId") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  await connectToDatabase();
  const filter: Record<string, unknown> = {};

  if (parsedQuery.data.clientId) {
    if (!Types.ObjectId.isValid(parsedQuery.data.clientId)) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }
    filter.clientId = parsedQuery.data.clientId;
  }

  const rows = await ClientOrderModel.find(filter)
    .populate("skuId", "name description imageUrl")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ orders: rows });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const payload = createOrderSchema.parse(await request.json());

    if (!Types.ObjectId.isValid(payload.clientId)) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }

    const invalidSku = payload.items.some((item) => !Types.ObjectId.isValid(item.skuId));
    if (invalidSku) {
      return NextResponse.json({ error: "Invalid skuId in items" }, { status: 400 });
    }

    await connectToDatabase();

    const uniqueSkuIds = [...new Set(payload.items.map((item) => item.skuId))];

    const skuCount = await ClientSkuModel.countDocuments({
      _id: { $in: uniqueSkuIds },
      clientId: payload.clientId,
    });

    if (skuCount !== uniqueSkuIds.length) {
      return NextResponse.json(
        { error: "One or more SKUs do not belong to this client" },
        { status: 400 }
      );
    }

    const orderCode = newOrderCode();

    const docs = payload.items.map((item) => ({
      orderCode,
      clientId: payload.clientId,
      skuId: item.skuId,
      invoiceUrl: payload.invoiceUrl,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      quantity: item.quantity,
      delivered: payload.delivered,
      deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate) : null,
    }));

    const createdRows = await ClientOrderModel.insertMany(docs);

    if (payload.delivered) {
      await Promise.all(
        payload.items.map(async (item) => {
          await InventoryModel.findOneAndUpdate(
            { clientId: payload.clientId, skuId: item.skuId },
            { $inc: { totalQuantity: item.quantity } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        })
      );
    }

    return NextResponse.json(
      {
        orderCode,
        lineItems: createdRows,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const payload = updateOrderDeliverySchema.parse(await request.json());
    await connectToDatabase();

    const rows = await ClientOrderModel.find({ orderCode: payload.orderCode });
    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (payload.action === "deliver") {
      if (!payload.deliveryDate) {
        return NextResponse.json(
          { error: "Delivery date is required when marking order as delivered." },
          { status: 400 }
        );
      }

      const explicitDeliveryDate = new Date(payload.deliveryDate);
      const undeliveredRows = rows.filter((row) => !row.delivered);
      if (undeliveredRows.length === 0) {
        return NextResponse.json({ ok: true, message: "Order already delivered." });
      }

      await Promise.all(
        undeliveredRows.map(async (row) => {
          row.delivered = true;
          row.deliveryDate = explicitDeliveryDate;
          await row.save();

          await InventoryModel.findOneAndUpdate(
            { clientId: row.clientId, skuId: row.skuId },
            { $inc: { totalQuantity: row.quantity } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        })
      );

      return NextResponse.json({
        ok: true,
        message: "Order marked as delivered.",
        updatedLineItems: undeliveredRows.length,
      });
    }

    const deliveredRows = rows.filter((row) => row.delivered);
    if (deliveredRows.length === 0) {
      return NextResponse.json({ ok: true, message: "Order is already not delivered." });
    }

    const decrementBySku = new Map<string, number>();
    for (const row of deliveredRows) {
      const key = row.skuId.toString();
      decrementBySku.set(key, (decrementBySku.get(key) ?? 0) + row.quantity);
    }

    const inventoryRows = await InventoryModel.find({
      clientId: deliveredRows[0].clientId,
      skuId: { $in: [...decrementBySku.keys()] },
    });
    const inventoryMap = new Map<string, (typeof inventoryRows)[number]>();
    for (const inventory of inventoryRows) {
      inventoryMap.set(inventory.skuId.toString(), inventory);
    }

    for (const [skuId, decrementQuantity] of decrementBySku.entries()) {
      const inventory = inventoryMap.get(skuId);
      if (!inventory) {
        return NextResponse.json(
          { error: "Cannot undo delivery because inventory record is missing." },
          { status: 400 }
        );
      }

      const nextTotal = inventory.totalQuantity - decrementQuantity;
      if (nextTotal < inventory.usedQuantity) {
        return NextResponse.json(
          {
            error:
              "Cannot undo delivery for this order because some inventory has already been distributed.",
          },
          { status: 400 }
        );
      }
    }

    await Promise.all(
      deliveredRows.map(async (row) => {
        row.delivered = false;
        row.deliveryDate = null;
        await row.save();
      })
    );

    await Promise.all(
      [...decrementBySku.entries()].map(async ([skuId, decrementQuantity]) => {
        await InventoryModel.findOneAndUpdate(
          { clientId: deliveredRows[0].clientId, skuId },
          { $inc: { totalQuantity: -decrementQuantity } },
          { new: true }
        );
      })
    );

    return NextResponse.json({
      ok: true,
      message: "Delivery status reverted to not delivered.",
      updatedLineItems: deliveredRows.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to mark order delivered" }, { status: 500 });
  }
}
