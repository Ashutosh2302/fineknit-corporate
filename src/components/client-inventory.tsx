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

export function ClientInventory() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);
  const [confirmInventoryId, setConfirmInventoryId] = useState<string | null>(null);
  const [submittingInventoryId, setSubmittingInventoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [distributionForm, setDistributionForm] = useState<{
    [key: string]: { employeeName: string; employeeId: string; quantity: number };
  }>({});
  const { showToast } = useClientToast();

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/client/inventory");
      const data = await response.json();
      if (!response.ok) {
        showToast({ message: data.error ?? "Failed to load inventory.", type: "error" });
        return;
      }
      setInventory(data.inventory ?? []);
    };

    void load();
  }, [showToast]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter((row) => {
      const name = row.sku?.name?.toLowerCase() ?? "";
      const description = row.sku?.description?.toLowerCase() ?? "";
      return name.includes(query) || description.includes(query);
    });
  }, [inventory, searchQuery]);

  const distribute = async (inventoryId: string) => {
    const payload = distributionForm[inventoryId];
    if (!payload) return;
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
      setDistributionForm((prev) => ({
        ...prev,
        [inventoryId]: { employeeName: "", employeeId: "", quantity: 1 },
      }));

      const invRes = await fetch("/api/client/inventory");
      const invData = await invRes.json();
      if (invRes.ok) {
        setInventory(invData.inventory ?? []);
        setConfirmInventoryId(null);
      } else {
        showToast({ message: invData.error ?? "Unable to refresh inventory.", type: "error" });
      }
    } catch {
      showToast({ message: "Network error while distributing inventory.", type: "error" });
    } finally {
      setSubmittingInventoryId(null);
    }
  };

  const openDistributionConfirm = (inventoryId: string) => {
    const payload = distributionForm[inventoryId];
    if (!payload || !payload.employeeName.trim()) {
      showToast({ message: "Please enter employee name before distributing.", type: "error" });
      return;
    }
    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      showToast({ message: "Please enter a valid quantity.", type: "error" });
      return;
    }
    setConfirmInventoryId(inventoryId);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <h2 className="text-lg font-semibold">Inventory</h2>
        <p className="text-sm text-slate-600">View stock levels and distribute inventory to employees.</p>

        <div className="mt-4">
          <input
            placeholder="Search by SKU name or description"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </section>

      {filteredRows.map((row) => {
        const form = distributionForm[row.id] ?? { employeeName: "", employeeId: "", quantity: 1 };
        return (
          <section
            key={row.id}
            className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{row.sku?.name ?? "SKU"}</h3>
                <p className="text-sm text-slate-600">{row.sku?.description}</p>
                <p className="mt-1 text-sm text-slate-700">
                  Total: {row.totalQuantity} | Used: {row.usedQuantity} | Available: {row.availableQuantity}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {row.sku?.imageUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({ src: row.sku.imageUrl ?? "", label: row.sku?.name ?? "SKU preview" })
                    }
                    className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-2 py-1.5 text-xs text-slate-700 hover:bg-[#f2ede5]"
                  >
                    View image
                  </button>
                ) : null}
                <Link
                  href={`/client/inventory/${row.id}/distributed`}
                  className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-2 text-xs text-slate-700 hover:bg-[#f2ede5]"
                >
                  Distributed history
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <input
                placeholder="Employee name"
                value={form.employeeName}
                onChange={(event) =>
                  setDistributionForm((prev) => ({
                    ...prev,
                    [row.id]: { ...form, employeeName: event.target.value },
                  }))
                }
                className="rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <input
                placeholder="Employee ID"
                value={form.employeeId}
                onChange={(event) =>
                  setDistributionForm((prev) => ({
                    ...prev,
                    [row.id]: { ...form, employeeId: event.target.value },
                  }))
                }
                className="rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(event) =>
                  setDistributionForm((prev) => ({
                    ...prev,
                    [row.id]: { ...form, quantity: Number(event.target.value) },
                  }))
                }
                className="rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={() => openDistributionConfirm(row.id)}
                disabled={submittingInventoryId === row.id}
                className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {submittingInventoryId === row.id ? "Distributing..." : "Distribute"}
              </button>
            </div>
          </section>
        );
      })}

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

      {confirmInventoryId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (submittingInventoryId !== confirmInventoryId) {
              setConfirmInventoryId(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#e8e1d6] bg-[#fdfbf8] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900">Confirm Distribution</h3>
            {(() => {
              const row = inventory.find((item) => item.id === confirmInventoryId);
              const form = distributionForm[confirmInventoryId] ?? {
                employeeName: "",
                employeeId: "",
                quantity: 1,
              };
              return (
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p>
                    SKU: <span className="font-medium">{row?.sku?.name ?? "SKU"}</span>
                  </p>
                  <p>
                    Employee: <span className="font-medium">{form.employeeName || "-"}</span>
                  </p>
                  <p>
                    Employee ID: <span className="font-medium">{form.employeeId || "-"}</span>
                  </p>
                  <p>
                    Quantity: <span className="font-medium">{form.quantity}</span>
                  </p>
                </div>
              );
            })()}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmInventoryId(null)}
                disabled={submittingInventoryId === confirmInventoryId}
                className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-1.5 text-sm text-slate-700 hover:bg-[#f2ede5] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingInventoryId === confirmInventoryId}
                onClick={async () => {
                  const targetId = confirmInventoryId;
                  if (targetId) {
                    await distribute(targetId);
                  }
                }}
                className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {submittingInventoryId === confirmInventoryId ? "Distributing..." : "Confirm Distribution"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
