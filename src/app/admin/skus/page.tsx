import { AdminSkusManager } from "@/components/admin/skus-manager";
import { AdminShell } from "@/components/admin/shell";
import { connectToDatabase } from "@/lib/db";
import { requireAdminPage } from "@/lib/guards";
import { ClientModel } from "@/models/Client";
import { ClientSkuModel } from "@/models/ClientSku";

export default async function AdminSkusPage() {
  const admin = await requireAdminPage();
  await connectToDatabase();

  const clients = await ClientModel.find().sort({ createdAt: -1 }).lean();
  const firstClient = clients[0];
  const skus = firstClient
    ? await ClientSkuModel.find({ clientId: firstClient._id }).sort({ createdAt: -1 }).lean()
    : [];

  return (
    <AdminShell
      title="SKU Management"
      subtitle="Manage SKUs for each client with explicit client binding."
      adminEmail={admin.email}
      adminType={admin.type}
    >
      <AdminSkusManager
        initialClients={clients.map((client) => ({
          id: client._id.toString(),
          name: client.name,
          email: client.email,
        }))}
        initialSkus={skus.map((sku) => ({
          id: sku._id.toString(),
          name: sku.name,
          description: sku.description,
          imageUrl: sku.imageUrl,
        }))}
      />
    </AdminShell>
  );
}
