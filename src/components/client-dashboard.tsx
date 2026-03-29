"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useClientToast } from "@/components/client-toast-provider";

type InventoryRow = {
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

type OrderLine = {
  _id: string;
  orderCode: string;
  quantity: number;
  deliveryDate?: string;
};

export function ClientDashboard() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [orders, setOrders] = useState<OrderLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useClientToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, ordRes] = await Promise.all([
          fetch("/api/client/inventory", { cache: "no-store", credentials: "same-origin" }),
          fetch("/api/client/orders", { cache: "no-store", credentials: "same-origin" }),
        ]);
        const invData = await invRes.json();
        const ordData = await ordRes.json();

        if (!invRes.ok) {
          showToast({ message: invData.error ?? "Unable to load inventory summary.", type: "error" });
        } else {
          setInventory(invData.inventory ?? []);
        }

        if (!ordRes.ok) {
          showToast({ message: ordData.error || "Unable to load orders summary.", type: "error" });
        } else {
          setOrders(ordData.orders ?? []);
        }
      } catch {
        showToast({ message: "Unable to load dashboard data right now.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [showToast]);

  const totalInventory = useMemo(() => inventory.reduce((sum, row) => sum + row.totalQuantity, 0), [inventory]);
  const totalUsed = useMemo(() => inventory.reduce((sum, row) => sum + row.usedQuantity, 0), [inventory]);
  const totalAvailable = useMemo(() => totalInventory - totalUsed, [totalInventory, totalUsed]);

  const deliveredOrderCount = useMemo(() => new Set(orders.map((row) => row.orderCode)).size, [orders]);
  const deliveredQuantity = useMemo(() => orders.reduce((sum, row) => sum + row.quantity, 0), [orders]);

  const lowStockRows = useMemo(
    () => inventory.filter((row) => row.availableQuantity <= Math.max(5, Math.ceil(row.totalQuantity * 0.2))),
    [inventory]
  );

  const availabilityRows = useMemo(
    () => [...inventory].sort((a, b) => b.availableQuantity - a.availableQuantity).slice(0, 6),
    [inventory]
  );
  const utilizationRows = useMemo(
    () => [...inventory].sort((a, b) => b.usedQuantity - a.usedQuantity).slice(0, 6),
    [inventory]
  );

  const maxAvailability = Math.max(...availabilityRows.map((row) => row.totalQuantity), 1);
  const maxUtilization = Math.max(...utilizationRows.map((row) => row.totalQuantity), 1);

  const requestRefill = async () => {
    if (!lowStockRows.length) return;
    const lines = lowStockRows
      .map((row) => `${row.sku?.name ?? "SKU"}: available ${row.availableQuantity} of ${row.totalQuantity}`)
      .join("\n");
    const message = `Please replenish inventory for:\n${lines}`;

    try {
      await navigator.clipboard.writeText(message);
      showToast({ message: "Low-stock request copied. Share it with Fineknit operations.", type: "success" });
    } catch {
      showToast({ message: "Unable to copy request. Please copy manually from low stock list.", type: "error" });
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <h2 className="text-lg font-semibold">Dashboard Overview</h2>
        <p className="text-sm text-slate-600">Track inventory health, delivery movement, and refill risk at a glance.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total inventory</p>
            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="mt-1 text-xl font-semibold">{totalInventory}</p>
            )}
          </div>
          <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Distributed</p>
            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="mt-1 text-xl font-semibold">{totalUsed}</p>
            )}
          </div>
          <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Available</p>
            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="mt-1 text-xl font-semibold">{totalAvailable}</p>
            )}
          </div>
          <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Delivered orders</p>
            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="mt-1 text-xl font-semibold">{deliveredOrderCount}</p>
            )}
          </div>
          <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Delivered qty</p>
            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="mt-1 text-xl font-semibold">{deliveredQuantity}</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
          <h3 className="text-base font-semibold text-slate-900">Availability by SKU</h3>
          <p className="text-sm text-slate-600">Top SKUs by available inventory.</p>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              [0, 1, 2].map((idx) => <div key={idx} className="h-8 animate-pulse rounded bg-slate-200" />)
            ) : availabilityRows.length === 0 ? (
              <p className="text-sm text-slate-500">No inventory data yet.</p>
            ) : (
              availabilityRows.map((row) => (
                <div key={row.id}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                    <span className="truncate pr-3">{row.sku?.name ?? "SKU"}</span>
                    <span>{row.availableQuantity}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-slate-700"
                      style={{ width: `${Math.max((row.availableQuantity / maxAvailability) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
          <h3 className="text-base font-semibold text-slate-900">Utilization by SKU</h3>
          <p className="text-sm text-slate-600">Top SKUs by distributed quantity.</p>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              [0, 1, 2].map((idx) => <div key={idx} className="h-8 animate-pulse rounded bg-slate-200" />)
            ) : utilizationRows.length === 0 ? (
              <p className="text-sm text-slate-500">No usage data yet.</p>
            ) : (
              utilizationRows.map((row) => (
                <div key={row.id}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                    <span className="truncate pr-3">{row.sku?.name ?? "SKU"}</span>
                    <span>{row.usedQuantity}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-slate-500"
                      style={{ width: `${Math.max((row.usedQuantity / maxUtilization) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Low Inventory Alerts</h3>
            <p className="text-sm text-slate-600">Prompt refill requests when stock is close to running out.</p>
          </div>
          {!isLoading && lowStockRows.length > 0 ? (
            <button
              type="button"
              onClick={requestRefill}
              className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Request More Inventory
            </button>
          ) : null}
        </div>

        <div className="mt-4 overflow-auto rounded-xl border border-[#ddd4c7] bg-[#faf8f4]">
          <table className="w-full min-w-[700px] text-left text-sm text-slate-700">
            <thead className="bg-[#f1ebe2] text-slate-700">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Available</th>
                <th className="px-3 py-2 text-right">Threshold</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [0, 1, 2].map((idx) => (
                    <tr key={`loading-${idx}`} className="border-t border-[#e6ddd0]">
                      <td className="px-3 py-2" colSpan={5}>
                        <div className="h-5 animate-pulse rounded bg-slate-200" />
                      </td>
                    </tr>
                  ))
                : inventory.map((row) => {
                const threshold = Math.max(5, Math.ceil(row.totalQuantity * 0.2));
                const runningLow = row.availableQuantity <= threshold;
                return (
                  <tr key={row.id} className="border-t border-[#e6ddd0]">
                    <td className="px-3 py-2">{row.sku?.name ?? "SKU"}</td>
                    <td className="px-3 py-2 text-right">{row.totalQuantity}</td>
                    <td className="px-3 py-2 text-right">{row.availableQuantity}</td>
                    <td className="px-3 py-2 text-right">{threshold}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          runningLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {runningLow ? "Running low" : "Healthy"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Link
          href="/client/inventory"
          className="rounded-2xl border border-[#ddd4c7] bg-[#faf8f4] p-4 text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:bg-[#f2ede5]"
        >
          <p className="text-base font-semibold">Go to Inventory</p>
          <p className="mt-1 text-sm text-slate-600">Distribute stock and manage employee allocation.</p>
        </Link>
        <Link
          href="/client/orders"
          className="rounded-2xl border border-[#ddd4c7] bg-[#faf8f4] p-4 text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:bg-[#f2ede5]"
        >
          <p className="text-base font-semibold">Go to Orders</p>
          <p className="mt-1 text-sm text-slate-600">Review delivered orders, SKU lines, and invoices.</p>
        </Link>
      </section>
    </div>
  );
}
