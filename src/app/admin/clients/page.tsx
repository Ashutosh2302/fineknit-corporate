import { AdminClientsManager } from "@/components/admin/clients-manager";
import { AdminShell } from "@/components/admin/shell";
import { connectToDatabase } from "@/lib/db";
import { requireAdminPage } from "@/lib/guards";
import { ClientModel } from "@/models/Client";

export default async function AdminClientsPage() {
  const admin = await requireAdminPage();
  await connectToDatabase();

  const clients = await ClientModel.find().sort({ createdAt: -1 }).lean();

  return (
    <AdminShell
      title="Client Management"
      subtitle="Create clients with clearly labeled fields."
      adminEmail={admin.email}
      adminType={admin.type}
    >
      <AdminClientsManager
        initialClients={clients.map((client) => ({
          id: client._id.toString(),
          name: client.name,
          email: client.email,
          phoneNumber: client.phoneNumber,
          address: client.address,
        }))}
      />
    </AdminShell>
  );
}
