"use client";

import { useMemo, useState } from "react";

type OrderLine = {
  _id: string;
  orderCode: string;
  invoiceUrl?: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  deliveryDate?: string;
  skuId?: {
    name?: string;
    description?: string;
    imageUrl?: string;
  };
};

type ClientOrdersProps = {
  initialOrders: OrderLine[];
};

export function ClientOrders({ initialOrders }: ClientOrdersProps) {
  const [orders] = useState<OrderLine[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);

  const groupedOrders = useMemo(() => {
    const map = new Map<string, OrderLine[]>();
    for (const row of orders) {
      const existing = map.get(row.orderCode) ?? [];
      existing.push(row);
      map.set(row.orderCode, existing);
    }
    return [...map.entries()];
  }, [orders]);

  const filteredGroupedOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groupedOrders;
    return groupedOrders.filter(([orderCode, rows]) => {
      if (orderCode.toLowerCase().includes(query)) return true;
      return rows.some((row) => (row.skuId?.name ?? "").toLowerCase().includes(query));
    });
  }, [groupedOrders, searchQuery]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <h2 className="text-lg font-semibold">Orders</h2>
        <p className="text-sm text-slate-600">Delivered orders with SKU-level pricing, quantities, and invoices.</p>
        <div className="mt-4">
          <input
            placeholder="Search by order code or SKU"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </section>

      {filteredGroupedOrders.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-sm text-slate-600">
          No delivered orders found.
        </div>
      ) : (
        filteredGroupedOrders.map(([orderCode, rows]) => (
          <section
            key={orderCode}
            className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]"
          >
            <h3 className="font-semibold">Order: {orderCode}</h3>
            <div className="mt-3 overflow-auto rounded-xl border border-[#ddd4c7] bg-[#faf8f4]">
              <table className="w-full min-w-[860px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-[#f1ebe2] text-slate-700">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Image</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Sell</th>
                    <th className="px-3 py-2 text-right">Cost</th>
                    <th className="px-3 py-2">Delivery date</th>
                    <th className="px-3 py-2">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._id} className="border-t border-[#e6ddd0] text-slate-700">
                      <td className="px-3 py-2">
                        <div className="truncate">{row.skuId?.name ?? "SKU"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex min-h-7 items-center">
                          {row.skuId?.imageUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImage({
                                  src: row.skuId?.imageUrl ?? "",
                                  label: row.skuId?.name ?? "SKU preview",
                                })
                              }
                              className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-2 py-1 text-xs hover:bg-[#f2ede5]"
                            >
                              View image
                            </button>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{row.quantity}</td>
                      <td className="px-3 py-2 text-right">{row.sellingPrice}</td>
                      <td className="px-3 py-2 text-right">{row.costPrice}</td>
                      <td className="px-3 py-2">
                        {row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {row.invoiceUrl ? (
                          <a href={row.invoiceUrl} target="_blank" rel="noreferrer" className="underline">
                            Invoice
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

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
