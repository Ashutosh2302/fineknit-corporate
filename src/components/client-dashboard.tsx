"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useClientToast } from "@/components/client-toast-provider";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type ClientDashboardProps = {
  initialInventory: InventoryRow[];
  initialOrders: OrderLine[];
};

export function ClientDashboard({ initialInventory, initialOrders }: ClientDashboardProps) {
  const [inventory] = useState<InventoryRow[]>(initialInventory);
  const [orders] = useState<OrderLine[]>(initialOrders);
  const isLoading = false;
  const { showToast } = useClientToast();

  const totalInventory = useMemo(() => inventory.reduce((sum, row) => sum + row.totalQuantity, 0), [inventory]);
  const totalUsed = useMemo(() => inventory.reduce((sum, row) => sum + row.usedQuantity, 0), [inventory]);
  const totalAvailable = useMemo(() => totalInventory - totalUsed, [totalInventory, totalUsed]);

  const deliveredOrderCount = useMemo(() => new Set(orders.map((row) => row.orderCode)).size, [orders]);
  const deliveredQuantity = useMemo(() => orders.reduce((sum, row) => sum + row.quantity, 0), [orders]);

  const lowStockRows = useMemo(
    () => inventory.filter((row) => row.availableQuantity <= Math.max(5, Math.ceil(row.totalQuantity * 0.2))),
    [inventory]
  );

  const topAvailableChartData = useMemo(
    () =>
      [...inventory]
        .sort((a, b) => b.availableQuantity - a.availableQuantity)
        .slice(0, 6)
        .map((row) => ({
          sku: row.sku?.name ?? "SKU",
          available: row.availableQuantity,
          runningLow: row.availableQuantity <= Math.max(5, Math.ceil(row.totalQuantity * 0.2)),
        })),
    [inventory]
  );

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

      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
          <h3 className="text-base font-semibold text-slate-900">Availability by SKU</h3>
              <p className="text-sm text-slate-600">
                Top SKUs by available inventory quantity.{" "}
                <span className="font-medium text-amber-700">{lowStockRows.length} running low</span>.
              </p>
            </div>
            {lowStockRows.length > 0 ? (
              <button
                type="button"
                onClick={requestRefill}
                className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Request More Inventory
              </button>
            ) : null}
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAvailableChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9d2c7" />
                <XAxis
                  dataKey="sku"
                  tick={{ fill: "#475569", fontSize: 12 }}
                  tickFormatter={(value) => String(value).slice(0, 12)}
                />
                <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #ddd4c7",
                    background: "#faf8f4",
                  }}
                />
                <Bar dataKey="available" radius={[8, 8, 0, 0]}>
                  {topAvailableChartData.map((entry, index) => (
                    <Cell key={`${entry.sku}-${index}`} fill={entry.runningLow ? "#f59e0b" : "#0f766e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {topAvailableChartData.length > 0 ? (
            <p className="mt-2 text-xs text-slate-600">
              Amber bars indicate low-inventory SKUs based on threshold.
            </p>
          ) : null}
          {topAvailableChartData.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No inventory availability data yet.</p>
          ) : null}
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
