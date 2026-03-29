import Link from "next/link";
import { AdminShell } from "@/components/admin/shell";
import { connectToDatabase } from "@/lib/db";
import { requireAdminPage } from "@/lib/guards";
import { ClientModel } from "@/models/Client";
import { ClientOrderModel } from "@/models/ClientOrder";
import { ClientSkuModel } from "@/models/ClientSku";

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();
  await connectToDatabase();

  const [clientCount, skuCount, orderCount] = await Promise.all([
    ClientModel.countDocuments(),
    ClientSkuModel.countDocuments(),
    ClientOrderModel.countDocuments(),
  ]);

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="Choose a dedicated management section."
      adminEmail={admin.email}
      adminType={admin.type}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
          <p className="text-sm text-slate-600">Clients</p>
          <p className="mt-1 text-3xl font-semibold">{clientCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
          <p className="text-sm text-slate-600">SKUs</p>
          <p className="mt-1 text-3xl font-semibold">{skuCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
          <p className="text-sm text-slate-600">Order Line Items</p>
          <p className="mt-1 text-3xl font-semibold">{orderCount}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/clients"
          className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 transition hover:bg-[#efe9de]"
        >
          <h3 className="font-semibold">Client Management</h3>
          <p className="mt-1 text-sm text-slate-600">Create clients and copy generated password.</p>
        </Link>

        <Link
          href="/admin/skus"
          className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 transition hover:bg-[#efe9de]"
        >
          <h3 className="font-semibold">SKU Management</h3>
          <p className="mt-1 text-sm text-slate-600">Create and review SKUs per selected client.</p>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 transition hover:bg-[#efe9de]"
        >
          <h3 className="font-semibold">Order Management</h3>
          <p className="mt-1 text-sm text-slate-600">Create orders and review all orders by client.</p>
        </Link>
      </section>
    </AdminShell>
  );
}
