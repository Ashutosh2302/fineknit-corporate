import { ClientInventory } from "@/components/client-inventory";
import { getSessionFromCookie } from "@/lib/auth";
import { getClientInventoryRows } from "@/lib/client-portal-data";
import { redirect } from "next/navigation";

export default async function ClientInventoryPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "client") {
    redirect("/login?portal=client");
  }

  const initialInventory = await getClientInventoryRows(session.sub);

  return (
    <section>
      <ClientInventory initialInventory={initialInventory} />
    </section>
  );
}
