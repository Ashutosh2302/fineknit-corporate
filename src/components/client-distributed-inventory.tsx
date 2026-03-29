"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useClientToast } from "@/components/client-toast-provider";
import { fetchWithAuthRedirect, UnauthorizedRequestError } from "@/lib/fetch-with-auth-redirect";

type DistributedRow = {
  id: string;
  employeeName: string;
  employeeId: string;
  quantity: number;
  createdAt: string;
};

type InventoryMeta = {
  id: string;
  totalQuantity: number;
  usedQuantity: number;
  availableQuantity: number;
  sku?: {
    name?: string;
    description?: string;
    imageUrl?: string;
  };
};

type ClientDistributedInventoryProps = {
  inventoryId: string;
};

export function ClientDistributedInventory({ inventoryId }: ClientDistributedInventoryProps) {
  const [inventory, setInventory] = useState<InventoryMeta | null>(null);
  const [rows, setRows] = useState<DistributedRow[]>([]);
  const [employeeNameQuery, setEmployeeNameQuery] = useState("");
  const [employeeIdQuery, setEmployeeIdQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);
  const { showToast } = useClientToast();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchWithAuthRedirect(`/api/client/inventory/${inventoryId}/distributed`);
        const data = await response.json();

        if (!response.ok) {
          showToast({ message: data.error ?? "Unable to load distributed inventory.", type: "error" });
          setIsLoading(false);
          return;
        }

        setInventory(data.inventory ?? null);
        setRows(data.distributed ?? []);
      } catch (error) {
        if (error instanceof UnauthorizedRequestError) return;
        showToast({ message: "Unable to load distributed inventory.", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [inventoryId, showToast]);

  const filteredRows = useMemo(() => {
    const nameQuery = employeeNameQuery.trim().toLowerCase();
    const idQuery = employeeIdQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const nameMatches = !nameQuery || row.employeeName.toLowerCase().includes(nameQuery);
      const idMatches = !idQuery || (row.employeeId ?? "").toLowerCase().includes(idQuery);
      return nameMatches && idMatches;
    });
  }, [rows, employeeNameQuery, employeeIdQuery]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Inventory details</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {inventory?.sku?.name ?? "SKU distribution history"}
            </h2>
            {inventory?.sku?.description ? (
              <p className="mt-1 text-sm text-slate-600">{inventory.sku.description}</p>
            ) : null}
          </div>
          {inventory?.sku?.imageUrl ? (
            <button
              type="button"
              onClick={() =>
                setPreviewImage({
                  src: inventory.sku?.imageUrl ?? "",
                  label: inventory.sku?.name ?? "SKU preview",
                })
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inventory.sku.imageUrl}
                alt={`${inventory?.sku?.name ?? "SKU"} preview`}
                className="h-14 w-14 rounded-xl border border-[#ddd4c7] object-cover"
              />
            </button>
          ) : null}
        </div>

        {inventory ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{inventory.totalQuantity}</p>
            </div>
            <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Distributed</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{inventory.usedQuantity}</p>
            </div>
            <div className="rounded-xl border border-[#e9e2d8] bg-[#faf8f4] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Available</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{inventory.availableQuantity}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Distributed entries</h3>
            <p className="text-sm text-slate-600">Search by employee name and employee ID.</p>
          </div>
          <Link
            href="/client/inventory"
            className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-2 text-sm text-slate-700 hover:bg-[#f2ede5]"
          >
            Back to inventory
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            placeholder="Search employee name"
            value={employeeNameQuery}
            onChange={(e) => setEmployeeNameQuery(e.target.value)}
            className="rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500"
          />
          <input
            placeholder="Search employee ID"
            value={employeeIdQuery}
            onChange={(e) => setEmployeeIdQuery(e.target.value)}
            className="rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500"
          />
        </div>

        {isLoading ? <p className="mt-4 text-sm text-slate-600">Loading distributed inventory...</p> : null}

        {!isLoading ? (
          <div className="mt-4 overflow-auto rounded-xl border border-[#ddd4c7] bg-[#faf8f4]">
            <table className="w-full min-w-[680px] text-left text-sm text-slate-700">
              <thead className="bg-[#f1ebe2] text-slate-700">
                <tr>
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2">Employee ID</th>
                  <th className="px-3 py-2 text-right">Quantity</th>
                  <th className="px-3 py-2">Distributed At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-[#e6ddd0]">
                    <td className="px-3 py-2">{row.employeeName}</td>
                    <td className="px-3 py-2">{row.employeeId || "-"}</td>
                    <td className="px-3 py-2 text-right">{row.quantity}</td>
                    <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && filteredRows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#ddd4c7] bg-[#faf8f4] px-3 py-3 text-sm text-slate-600">
            No entries found for current search.
          </div>
        ) : null}
      </section>

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-[#e8e1d6] bg-[#fdfbf8] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">{previewImage.label}</p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#f2ede5]"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-[#e6ddd0] bg-[#faf8f4] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage.src} alt={previewImage.label} className="mx-auto h-auto max-w-full rounded-lg" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
