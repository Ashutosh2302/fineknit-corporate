import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { ClientOrderModel } from "@/models/ClientOrder";
import { InventoryModel } from "@/models/Inventory";
import { ClientSkuModel } from "@/models/ClientSku";
import {
  addSizeQuantities,
  emptySizeQuantities,
  hasPositiveSizeQuantity,
  normalizeSizeQuantities,
  SIZE_KEYS,
  subtractSizeQuantities,
  sumSizeQuantities,
  type SizeQuantities,
} from "@/lib/size-quantities";

const sizeQuantitiesInputSchema = z.object({
  s: z.number().int().nonnegative().optional(),
  m: z.number().int().nonnegative().optional(),
  l: z.number().int().nonnegative().optional(),
  xl: z.number().int().nonnegative().optional(),
  xxl: z.number().int().nonnegative().optional(),
  free_size: z.number().int().nonnegative().optional(),
});

const createOrderSchema = z.object({
  clientId: z.string().trim().min(1),
  invoiceUrl: z.string().trim().optional().default(""),
  delivered: z.boolean().optional().default(false),
  deliveryDate: z.string().datetime().nullable().optional(),
  items: z
    .array(
      z.object({
        skuId: z.string().trim().min(1),
        quantities: sizeQuantitiesInputSchema,
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

function normalizeRowQuantities(row: { quantities?: Partial<Record<keyof SizeQuantities, number>>; quantity?: number }) {
  const normalized = normalizeSizeQuantities(row.quantities);
  if (!hasPositiveSizeQuantity(normalized) && (row.quantity ?? 0) > 0) {
    normalized.free_size = row.quantity ?? 0;
  }
  return normalized;
}

function normalizeInventoryMaps(inventory: {
  totalQuantities?: Partial<Record<keyof SizeQuantities, number>>;
  usedQuantities?: Partial<Record<keyof SizeQuantities, number>>;
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

async function applyInventoryTotalDelta(params: {
  clientId: string;
  skuId: string;
  delta: SizeQuantities;
  action: "add" | "subtract";
}) {
  let inventory = await InventoryModel.findOne({ clientId: params.clientId, skuId: params.skuId });
  if (!inventory) {
    if (params.action === "subtract") {
      return { ok: false as const, error: "Cannot undo delivery because inventory record is missing." };
    }
    inventory = await InventoryModel.create({
      clientId: params.clientId,
      skuId: params.skuId,
      totalQuantities: emptySizeQuantities(),
      usedQuantities: emptySizeQuantities(),
      totalQuantity: 0,
      usedQuantity: 0,
    });
  }

  const { total, used } = normalizeInventoryMaps(inventory);
  const nextTotal = params.action === "add" ? addSizeQuantities(total, params.delta) : subtractSizeQuantities(total, params.delta);

  for (const key of SIZE_KEYS) {
    if (nextTotal[key] < 0) {
      return { ok: false as const, error: "Cannot undo delivery because inventory would become negative." };
    }
    if (nextTotal[key] < used[key]) {
      return {
        ok: false as const,
        error: "Cannot undo delivery for this order because some inventory has already been distributed.",
      };
    }
  }

  inventory.totalQuantities = nextTotal;
  inventory.usedQuantities = used;
  inventory.totalQuantity = sumSizeQuantities(nextTotal);
  inventory.usedQuantity = sumSizeQuantities(used);
  await inventory.save();
  return { ok: true as const };
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

    const docs = payload.items.map((item) => {
      const normalizedQuantities = normalizeSizeQuantities(item.quantities);
      const quantity = sumSizeQuantities(normalizedQuantities);
      return {
      orderCode,
      clientId: payload.clientId,
      skuId: item.skuId,
      invoiceUrl: payload.invoiceUrl,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      quantity,
      quantities: normalizedQuantities,
      delivered: payload.delivered,
      deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate) : null,
      };
    });

    if (docs.some((doc) => doc.quantity <= 0)) {
      return NextResponse.json(
        { error: "Each SKU line item must have at least one positive size quantity." },
        { status: 400 }
      );
    }

    const createdRows = await ClientOrderModel.insertMany(docs);

    if (payload.delivered) {
      await Promise.all(
        docs.map(async (item) => {
          const result = await applyInventoryTotalDelta({
            clientId: payload.clientId,
            skuId: item.skuId,
            delta: item.quantities,
            action: "add",
          });
          if (!result.ok) {
            throw new Error(result.error);
          }
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
          const result = await applyInventoryTotalDelta({
            clientId: row.clientId.toString(),
            skuId: row.skuId.toString(),
            delta: normalizeRowQuantities(row),
            action: "add",
          });
          if (!result.ok) {
            throw new Error(result.error);
          }
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

    const decrementBySku = new Map<string, SizeQuantities>();
    for (const row of deliveredRows) {
      const key = row.skuId.toString();
      const existing = decrementBySku.get(key) ?? emptySizeQuantities();
      const next = addSizeQuantities(existing, normalizeRowQuantities(row));
      decrementBySku.set(key, next);
    }

    for (const [skuId, delta] of decrementBySku.entries()) {
      const result = await applyInventoryTotalDelta({
        clientId: deliveredRows[0].clientId.toString(),
        skuId,
        delta,
        action: "subtract",
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
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
