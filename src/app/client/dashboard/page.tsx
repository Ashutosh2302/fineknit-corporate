import { ClientDashboard } from "@/components/client-dashboard";
import { getSessionFromCookie } from "@/lib/auth";
import { getClientDeliveredOrders, getClientInventoryRows } from "@/lib/client-portal-data";
import { redirect } from "next/navigation";

export default async function ClientDashboardPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "client") {
    redirect("/login?portal=client");
  }

  const [initialInventory, initialOrders] = await Promise.all([
    getClientInventoryRows(session.sub),
    getClientDeliveredOrders(session.sub),
  ]);

  return (
    <section>
      <ClientDashboard initialInventory={initialInventory} initialOrders={initialOrders} />
    </section>
  );
}
