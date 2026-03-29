"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

type ClientInventoryProps = {
  initialInventory: InventoryRow[];
};

export function ClientInventory({ initialInventory }: ClientInventoryProps) {
  const [inventory, setInventory] = useState<InventoryRow[]>(initialInventory);
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);
  const [submittingInventoryId, setSubmittingInventoryId] = useState<string | null>(null);
  const [distributeModal, setDistributeModal] = useState<{
    inventoryId: string;
    employeeName: string;
    employeeId: string;
    quantity: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useClientToast();

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter((row) => {
      const name = row.sku?.name?.toLowerCase() ?? "";
      const description = row.sku?.description?.toLowerCase() ?? "";
      return name.includes(query) || description.includes(query);
    });
  }, [inventory, searchQuery]);

  const distribute = async (
    inventoryId: string,
    payload: { employeeName: string; employeeId: string; quantity: number }
  ) => {
    setSubmittingInventoryId(inventoryId);
    try {
      const response = await fetch(`/api/client/inventory/${inventoryId}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        showToast({ message: data.error ?? "Failed to distribute inventory.", type: "error" });
        return;
      }

      showToast({ message: "Inventory distributed successfully.", type: "success" });

      const invRes = await fetch("/api/client/inventory", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const invData = await invRes.json();
      if (invRes.ok) {
        setInventory(invData.inventory ?? []);
        setDistributeModal(null);
      } else {
        showToast({ message: invData.error ?? "Unable to refresh inventory.", type: "error" });
      }
    } catch {
      showToast({ message: "Network error while distributing inventory.", type: "error" });
    } finally {
      setSubmittingInventoryId(null);
    }
  };

  const submitDistributeModal = async () => {
    if (!distributeModal) return;
    if (!distributeModal.employeeName.trim()) {
      showToast({ message: "Please enter employee name before distributing.", type: "error" });
      return;
    }
    if (!Number.isFinite(distributeModal.quantity) || distributeModal.quantity <= 0) {
      showToast({ message: "Please enter a valid quantity.", type: "error" });
      return;
    }
    await distribute(distributeModal.inventoryId, {
      employeeName: distributeModal.employeeName.trim(),
      employeeId: distributeModal.employeeId.trim(),
      quantity: distributeModal.quantity,
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Inventory</h2>
            <p className="text-sm text-slate-600">View stock levels and distribute inventory to employees.</p>
          </div>
          <input
            placeholder="Search by SKU name or description"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 md:max-w-[420px]"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <div className="overflow-auto rounded-xl border border-[#ddd4c7] bg-[#faf8f4]">
          <table className="w-full min-w-[1020px] text-left text-sm text-slate-700">
            <thead className="bg-[#f1ebe2] text-slate-700">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Used</th>
                <th className="px-3 py-2 text-right">Available</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-[#e6ddd0]">
                  <td className="px-3 py-2 font-medium text-slate-900">{row.sku?.name ?? "SKU"}</td>
                  <td className="px-3 py-2 text-slate-600">{row.sku?.description ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {row.sku?.imageUrl ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({ src: row.sku.imageUrl ?? "", label: row.sku?.name ?? "SKU preview" })
                            }
                            className="group overflow-hidden rounded-lg border border-[#ddd4c7] bg-[#faf8f4] p-0.5"
                            title="Preview image"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={row.sku.imageUrl}
                              alt={`${row.sku?.name ?? "SKU"} thumbnail`}
                              className="h-10 w-10 rounded object-cover transition group-hover:scale-105"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({ src: row.sku.imageUrl ?? "", label: row.sku?.name ?? "SKU preview" })
                            }
                            className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-2 py-1 text-xs text-slate-700 hover:bg-[#f2ede5]"
                          >
                            View
                          </button>
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{row.totalQuantity}</td>
                  <td className="px-3 py-2 text-right">{row.usedQuantity}</td>
                  <td className="px-3 py-2 text-right font-medium">{row.availableQuantity}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/client/inventory/${row.id}/distributed`}
                        className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-2.5 py-1.5 text-xs text-slate-700 hover:bg-[#f2ede5]"
                      >
                        Distributed history
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setDistributeModal({
                            inventoryId: row.id,
                            employeeName: "",
                            employeeId: "",
                            quantity: 1,
                          })
                        }
                        className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Distribute
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-sm text-slate-600">
          No matching inventory rows.
        </div>
      ) : null}

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

      {distributeModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (submittingInventoryId !== distributeModal.inventoryId) {
              setDistributeModal(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#e8e1d6] bg-[#fdfbf8] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Distribute Inventory</h3>
            <p className="mt-1 text-sm text-slate-600">
              SKU:{" "}
              <span className="font-medium text-slate-900">
                {inventory.find((item) => item.id === distributeModal.inventoryId)?.sku?.name ?? "SKU"}
              </span>
            </p>

            <div className="mt-4 space-y-3">
              <input
                placeholder="Employee name"
                value={distributeModal.employeeName}
                onChange={(event) =>
                  setDistributeModal((prev) =>
                    prev ? { ...prev, employeeName: event.target.value } : prev
                  )
                }
                className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <input
                placeholder="Employee ID"
                value={distributeModal.employeeId}
                onChange={(event) =>
                  setDistributeModal((prev) => (prev ? { ...prev, employeeId: event.target.value } : prev))
                }
                className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <input
                type="number"
                min={1}
                value={distributeModal.quantity}
                onChange={(event) =>
                  setDistributeModal((prev) =>
                    prev ? { ...prev, quantity: Number(event.target.value) } : prev
                  )
                }
                className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDistributeModal(null)}
                disabled={submittingInventoryId === distributeModal.inventoryId}
                className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-1.5 text-sm text-slate-700 hover:bg-[#f2ede5] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingInventoryId === distributeModal.inventoryId}
                onClick={submitDistributeModal}
                className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {submittingInventoryId === distributeModal.inventoryId ? "Distributing..." : "Distribute"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
