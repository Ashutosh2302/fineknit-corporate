import { AdminOrdersManager } from "@/components/admin/orders-manager";
import { AdminShell } from "@/components/admin/shell";
import { connectToDatabase } from "@/lib/db";
import { requireAdminPage } from "@/lib/guards";
import { ClientModel } from "@/models/Client";
import { ClientOrderModel } from "@/models/ClientOrder";
import { ClientSkuModel } from "@/models/ClientSku";
import { hasPositiveSizeQuantity, normalizeSizeQuantities, sumSizeQuantities } from "@/lib/size-quantities";

export default async function AdminOrdersPage() {
  const admin = await requireAdminPage();
  await connectToDatabase();

  const clients = await ClientModel.find().sort({ createdAt: -1 }).lean();
  const firstClient = clients[0];

  const [skus, orders] = firstClient
    ? await Promise.all([
        ClientSkuModel.find({ clientId: firstClient._id }).sort({ createdAt: -1 }).lean(),
        ClientOrderModel.find({ clientId: firstClient._id })
          .populate("skuId", "name imageUrl")
          .sort({ createdAt: -1 })
          .lean(),
      ])
    : [[], []];

  return (
    <AdminShell
      title="Order Management"
      subtitle="Create and review orders for each client in a dedicated workspace."
      adminEmail={admin.email}
      adminType={admin.type}
    >
      <AdminOrdersManager
        initialClients={clients.map((client) => ({
          id: client._id.toString(),
          name: client.name,
          email: client.email,
        }))}
        initialSkus={skus.map((sku) => ({
          id: sku._id.toString(),
          name: sku.name,
        }))}
        initialOrders={orders.map((order) => ({
          _id: order._id.toString(),
          orderCode: order.orderCode,
          createdAt: order.createdAt,
          invoiceUrl: order.invoiceUrl,
          quantities: (() => {
            const quantities = normalizeSizeQuantities(order.quantities);
            if (!hasPositiveSizeQuantity(quantities) && order.quantity > 0) {
              quantities.free_size = order.quantity;
            }
            return quantities;
          })(),
          quantity: (() => {
            const quantities = normalizeSizeQuantities(order.quantities);
            if (!hasPositiveSizeQuantity(quantities) && order.quantity > 0) {
              quantities.free_size = order.quantity;
            }
            return sumSizeQuantities(quantities);
          })(),
          sellingPrice: order.sellingPrice,
          costPrice: order.costPrice,
          delivered: order.delivered,
          deliveryDate: order.deliveryDate,
          skuId:
            order.skuId && typeof order.skuId === "object" && "name" in order.skuId
              ? {
                  name: String(order.skuId.name ?? ""),
                  imageUrl:
                    "imageUrl" in order.skuId ? String(order.skuId.imageUrl ?? "") : undefined,
                }
              : undefined,
        }))}
      />
    </AdminShell>
  );
}
