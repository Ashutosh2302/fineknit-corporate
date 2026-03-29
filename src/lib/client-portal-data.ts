import { connectToDatabase } from "@/lib/db";
import { ClientOrderModel } from "@/models/ClientOrder";
import { InventoryModel } from "@/models/Inventory";
import "@/models/ClientSku";

export type ClientInventoryRow = {
  id: string;
  totalQuantity: number;
  usedQuantity: number;
  availableQuantity: number;
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
    _id: String(row._id),
    orderCode: row.orderCode,
    invoiceUrl: row.invoiceUrl,
    quantity: row.quantity,
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
