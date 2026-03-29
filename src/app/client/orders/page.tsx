import { ClientOrders } from "@/components/client-orders";
import { getSessionFromCookie } from "@/lib/auth";
import { getClientDeliveredOrders } from "@/lib/client-portal-data";
import { redirect } from "next/navigation";

export default async function ClientOrdersPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "client") {
    redirect("/login?portal=client");
  }

  const initialOrders = await getClientDeliveredOrders(session.sub);

  return (
    <section>
      <ClientOrders initialOrders={initialOrders} />
    </section>
  );
}
