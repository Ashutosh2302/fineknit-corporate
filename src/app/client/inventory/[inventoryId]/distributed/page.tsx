import { ClientDistributedInventory } from "@/components/client-distributed-inventory";

export default async function ClientDistributedInventoryPage({
  params,
}: {
  params: Promise<{ inventoryId: string }>;
}) {
  const { inventoryId } = await params;

  return (
    <section>
      <ClientDistributedInventory inventoryId={inventoryId} />
    </section>
  );
}
