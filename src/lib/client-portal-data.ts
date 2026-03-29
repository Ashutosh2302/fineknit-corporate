import { connectToDatabase } from "@/lib/db";
import { ClientOrderModel } from "@/models/ClientOrder";
import { InventoryModel } from "@/models/Inventory";
import "@/models/ClientSku";
import {
  hasPositiveSizeQuantity,
  normalizeSizeQuantities,
  subtractSizeQuantities,
  sumSizeQuantities,
  type SizeQuantities,
} from "@/lib/size-quantities";

export type ClientInventoryRow = {
  id: string;
  totalQuantity: number;
  usedQuantity: number;
  availableQuantity: number;
  totalQuantitiesBySize: SizeQuantities;
  usedQuantitiesBySize: SizeQuantities;
  availableQuantitiesBySize: SizeQuantities;
  sku: {
    name?: string;
    description?: string;
    imageUrl?: string;
  };
};

export type ClientDeliveredOrderRow = {
  _id: string;
  orderCode: string;
  invoiceUrl?: string;
  quantity: number;
  quantities: SizeQuantities;
  sellingPrice: number;
  costPrice: number;
  deliveryDate?: string;
  skuId?: {
    name?: string;
    description?: string;
    imageUrl?: string;
  };
};

export async function getClientInventoryRows(clientId: string): Promise<ClientInventoryRow[]> {
  await connectToDatabase();
  const inventoryRows = await InventoryModel.find({ clientId })
    .populate("skuId", "name description imageUrl")
    .sort({ updatedAt: -1 })
    .lean();

  return inventoryRows.map((row) => ({
    totalQuantitiesBySize: (() => {
      const total = normalizeSizeQuantities(row.totalQuantities);
      if (!hasPositiveSizeQuantity(total) && row.totalQuantity > 0) {
        total.free_size = row.totalQuantity;
      }
      return total;
    })(),
    usedQuantitiesBySize: (() => {
      const used = normalizeSizeQuantities(row.usedQuantities);
      if (!hasPositiveSizeQuantity(used) && row.usedQuantity > 0) {
        used.free_size = row.usedQuantity;
      }
      return used;
    })(),
    availableQuantitiesBySize: (() => {
      const total = normalizeSizeQuantities(row.totalQuantities);
      const used = normalizeSizeQuantities(row.usedQuantities);
      if (!hasPositiveSizeQuantity(total) && row.totalQuantity > 0) total.free_size = row.totalQuantity;
      if (!hasPositiveSizeQuantity(used) && row.usedQuantity > 0) used.free_size = row.usedQuantity;
      return subtractSizeQuantities(total, used);
    })(),
    id: String(row._id),
    totalQuantity: row.totalQuantity,
    usedQuantity: row.usedQuantity,
    availableQuantity: row.totalQuantity - row.usedQuantity,
    sku:
      row.skuId && typeof row.skuId === "object"
        ? {
            name: "name" in row.skuId ? String(row.skuId.name ?? "") : undefined,
            description: "description" in row.skuId ? String(row.skuId.description ?? "") : undefined,
            imageUrl: "imageUrl" in row.skuId ? String(row.skuId.imageUrl ?? "") : undefined,
          }
        : {},
  }));
}

export async function getClientDeliveredOrders(clientId: string): Promise<ClientDeliveredOrderRow[]> {
  await connectToDatabase();
  const rows = await ClientOrderModel.find({
    clientId,
    delivered: true,
  })
    .populate("skuId", "name description imageUrl")
    .sort({ deliveryDate: -1, createdAt: -1 })
    .lean();

  return rows.map((row) => ({
    quantities: (() => {
      const quantities = normalizeSizeQuantities(row.quantities);
      if (!hasPositiveSizeQuantity(quantities) && row.quantity > 0) {
        quantities.free_size = row.quantity;
      }
      return quantities;
    })(),
    _id: String(row._id),
    orderCode: row.orderCode,
    invoiceUrl: row.invoiceUrl,
    quantity: (() => {
      const quantities = normalizeSizeQuantities(row.quantities);
      if (!hasPositiveSizeQuantity(quantities) && row.quantity > 0) {
        quantities.free_size = row.quantity;
      }
      return sumSizeQuantities(quantities);
    })(),
    sellingPrice: row.sellingPrice,
    costPrice: row.costPrice,
    deliveryDate: row.deliveryDate ? new Date(row.deliveryDate).toISOString() : undefined,
    skuId:
      row.skuId && typeof row.skuId === "object"
        ? {
            name: "name" in row.skuId ? String(row.skuId.name ?? "") : undefined,
            description: "description" in row.skuId ? String(row.skuId.description ?? "") : undefined,
            imageUrl: "imageUrl" in row.skuId ? String(row.skuId.imageUrl ?? "") : undefined,
          }
        : undefined,
  }));
}
