"use client";

import { useMemo, useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string;
};

type Sku = {
  id: string;
  name: string;
};

type OrderRow = {
  _id: string;
  orderCode: string;
  createdAt?: string | null;
  invoiceUrl?: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  delivered: boolean;
  deliveryDate?: string | null;
  skuId?: { name?: string; imageUrl?: string };
};

type OrderItemInput = {
  skuId: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
};

type Props = {
  initialClients: Client[];
  initialSkus: Sku[];
  initialOrders: OrderRow[];
};

type GroupedOrder = {
  orderCode: string;
  createdAt: string | null;
  items: OrderRow[];
  invoiceUrl: string;
  delivered: boolean;
  totalQuantity: number;
  totalSelling: number;
  totalCost: number;
  deliveryDate: string | null;
};

const inputClass =
  "w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const emptyItem = (): OrderItemInput => ({ skuId: "", quantity: 1, sellingPrice: 0, costPrice: 0 });

export function AdminOrdersManager({ initialClients, initialSkus, initialOrders }: Props) {
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? "");
  const [skus, setSkus] = useState<Sku[]>(initialSkus);
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [status, setStatus] = useState("");
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [updatingOrderCode, setUpdatingOrderCode] = useState<string | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [deliveryDateByOrder, setDeliveryDateByOrder] = useState<Record<string, string>>({});
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [payload, setPayload] = useState({
    delivered: false,
    deliveryDate: "",
    items: [emptyItem()],
  });

  const groupedOrders = useMemo<GroupedOrder[]>(() => {
    const map = new Map<string, OrderRow[]>();

    for (const row of orders) {
      const current = map.get(row.orderCode) ?? [];
      current.push(row);
      map.set(row.orderCode, current);
    }

    return [...map.entries()].map(([orderCode, items]) => {
      const delivered = items.every((item) => item.delivered);
      const createdAt = items[0]?.createdAt ?? null;
      const invoiceUrl = items.find((item) => item.invoiceUrl)?.invoiceUrl ?? "";
      const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
      const totalSelling = items.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);
      const totalCost = items.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);

      const dateCandidates = items
        .map((item) => item.deliveryDate)
        .filter((value): value is string => Boolean(value));
      const deliveryDate = dateCandidates.length > 0 ? dateCandidates[0] : null;

      return {
        orderCode,
        createdAt,
        items,
        invoiceUrl,
        delivered,
        totalQuantity,
        totalSelling,
        totalCost,
        deliveryDate,
      };
    });
  }, [orders]);

  const loadForClient = async (clientId: string) => {
    if (!clientId) {
      setSkus([]);
      setOrders([]);
      return;
    }

    setLoadingClientData(true);
    try {
      const [skusResponse, ordersResponse] = await Promise.all([
        fetch(`/api/admin/skus?clientId=${clientId}`),
        fetch(`/api/admin/orders?clientId=${clientId}`),
      ]);

      const skusData = await skusResponse.json();
      const ordersData = await ordersResponse.json();

      if (skusResponse.ok) setSkus(skusData.skus ?? []);
      if (ordersResponse.ok) setOrders(ordersData.orders ?? []);
    } finally {
      setLoadingClientData(false);
    }
  };

  const createOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setCreatingOrder(true);

    if (!selectedClientId) {
      setStatus("Select a client first.");
      setCreatingOrder(false);
      return;
    }

    if (payload.items.some((item) => !item.skuId)) {
      setStatus("Please select SKU for every line item.");
      setCreatingOrder(false);
      return;
    }
    try {
      let invoiceUrl = "";
      if (invoiceFile) {
        setUploadingInvoice(true);
        const uploadFormData = new FormData();
        uploadFormData.append("folder", "invoices");
        uploadFormData.append("file", invoiceFile);
        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadData = await uploadResponse.json();
        setUploadingInvoice(false);

        if (!uploadResponse.ok) {
          setStatus(uploadData.error ?? "Failed to upload invoice");
          return;
        }
        invoiceUrl = uploadData.url;
      }

      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          invoiceUrl,
          delivered: payload.delivered,
          deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate).toISOString() : null,
          items: payload.items,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Failed to create order");
        return;
      }

      setStatus(`Order created: ${data.orderCode}`);
      setInvoiceFile(null);
      setPayload({ delivered: false, deliveryDate: "", items: [emptyItem()] });
      await loadForClient(selectedClientId);
    } catch {
      setStatus("Unable to create order right now.");
    } finally {
      setUploadingInvoice(false);
      setCreatingOrder(false);
    }
  };

  const updateOrderDelivery = async (orderCode: string, action: "deliver" | "undo") => {
    const enteredDeliveryDate = deliveryDateByOrder[orderCode];
    if (action === "deliver" && !enteredDeliveryDate) {
      setStatus("Please select delivery date before marking order as delivered.");
      return;
    }

    setUpdatingOrderCode(orderCode);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode,
          action,
          deliveryDate:
            action === "deliver" ? new Date(enteredDeliveryDate).toISOString() : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Failed to update order delivery status");
        return;
      }

      setStatus(data.message ?? "Order delivery status updated.");
      if (action === "deliver") {
        setDeliveryDateByOrder((prev) => ({ ...prev, [orderCode]: "" }));
      }
      await loadForClient(selectedClientId);
    } finally {
      setUpdatingOrderCode(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
        <h2 className="text-lg font-semibold tracking-tight">Create Order</h2>
        <p className="mt-1 text-sm text-slate-600">
          One order can include multiple SKUs. Orders are client-bound.
        </p>

        <div className="mt-4">
          <label className="mb-1 block text-sm text-slate-700">Client</label>
          <select
            value={selectedClientId}
            onChange={async (e) => {
              const id = e.target.value;
              setSelectedClientId(id);
              await loadForClient(id);
            }}
            disabled={loadingClientData || creatingOrder}
            className={inputClass}
          >
            <option value="">Choose a client</option>
            {initialClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.email}
              </option>
            ))}
          </select>
        </div>

        <form className="mt-4 space-y-4" onSubmit={createOrder}>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-700">Invoice File</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-600">Upload invoice directly to S3 bucket.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-700">Delivery Date</label>
              <input
                type="datetime-local"
                value={payload.deliveryDate}
                onChange={(e) => setPayload((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                className={inputClass}
              />
            </div>

            <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={payload.delivered}
                onChange={(e) => setPayload((prev) => ({ ...prev, delivered: e.target.checked }))}
              />
              Mark order as delivered
            </label>
          </div>

          <div className="space-y-3">
            {payload.items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-[#ddd4c7] bg-[#faf8f4] p-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">SKU</label>
                  <select
                    required
                    value={item.skuId}
                    onChange={(e) => {
                      const next = [...payload.items];
                      next[index].skuId = e.target.value;
                      setPayload((prev) => ({ ...prev, items: next }));
                    }}
                    className={inputClass}
                  >
                    <option value="">Choose SKU</option>
                    {skus.map((sku) => (
                      <option key={sku.id} value={sku.id}>
                        {sku.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-600">Quantity</label>
                  <input
                    required
                    min={1}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...payload.items];
                      next[index].quantity = Number(e.target.value);
                      setPayload((prev) => ({ ...prev, items: next }));
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-600">Selling Price</label>
                  <input
                    required
                    min={0}
                    type="number"
                    value={item.sellingPrice}
                    onChange={(e) => {
                      const next = [...payload.items];
                      next[index].sellingPrice = Number(e.target.value);
                      setPayload((prev) => ({ ...prev, items: next }));
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-600">Cost Price</label>
                  <input
                    required
                    min={0}
                    type="number"
                    value={item.costPrice}
                    onChange={(e) => {
                      const next = [...payload.items];
                      next[index].costPrice = Number(e.target.value);
                      setPayload((prev) => ({ ...prev, items: next }));
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPayload((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }))}
              disabled={creatingOrder || uploadingInvoice}
              className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-1.5 text-xs text-slate-700 hover:bg-[#f2ede5]"
            >
              Add SKU Line
            </button>
            <button
              type="button"
              onClick={() =>
                setPayload((prev) => ({
                  ...prev,
                  items: prev.items.length > 1 ? prev.items.slice(0, -1) : prev.items,
                }))
              }
              disabled={creatingOrder || uploadingInvoice}
              className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-1.5 text-xs text-slate-700 hover:bg-[#f2ede5]"
            >
              Remove Last Line
            </button>
            <button
              disabled={creatingOrder || loadingClientData}
              className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingInvoice ? "Uploading Invoice..." : creatingOrder ? "Creating Order..." : "Create Order"}
            </button>
          </div>
        </form>

        {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
      </section>

      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
        <h2 className="text-lg font-semibold tracking-tight">Orders For Selected Client</h2>
        <div className="mt-4 space-y-5">
          {groupedOrders.map((order) => (
            <div key={order.orderCode} className="rounded-xl border border-[#ddd4c7] bg-[#faf8f4] p-3">
              <div className="overflow-auto rounded-lg border border-[#e6ddd0]">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-[#f1ebe2] text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-nowrap">Order Code</th>
                      <th className="px-3 py-2 text-nowrap">Created Date</th>
                      <th className="px-3 py-2 text-nowrap">Invoice</th>
                      <th className="px-3 py-2 text-nowrap">SKU Count</th>
                      <th className="px-3 py-2 text-nowrap">Total Qty</th>
                      <th className="px-3 py-2 text-nowrap">Total Selling</th>
                      <th className="px-3 py-2 text-nowrap">Total Cost</th>
                      <th className="px-3 py-2 text-nowrap">Delivery Date</th>
                      <th className="px-3 py-2 text-nowrap">Delivered</th>
                      <th className="px-3 py-2 text-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[#e6ddd0] text-slate-700">
                      <td className="px-3 py-2 text-nowrap font-semibold text-slate-900">{order.orderCode}</td>
                      <td className="px-3 py-2 text-nowrap font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-nowrap">
                        {order.invoiceUrl ? (
                          <a
                            href={order.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline"
                          >
                            View Invoice
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-nowrap font-semibold">{order.items.length}</td>
                      <td className="px-3 py-2 text-nowrap font-semibold">{order.totalQuantity}</td>
                      <td className="px-3 py-2 text-nowrap font-semibold">{order.totalSelling}</td>
                      <td className="px-3 py-2 text-nowrap font-semibold">{order.totalCost}</td>
                      <td className="px-3 py-2 text-nowrap">
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-nowrap font-semibold">{order.delivered ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">
                        {!order.delivered ? (
                          <div className="flex min-w-[240px] items-center gap-2">
                            <input
                              type="datetime-local"
                              value={deliveryDateByOrder[order.orderCode] ?? ""}
                              onChange={(e) =>
                                setDeliveryDateByOrder((prev) => ({
                                  ...prev,
                                  [order.orderCode]: e.target.value,
                                }))
                              }
                              disabled={updatingOrderCode === order.orderCode}
                              className="rounded-lg border border-[#ddd4c7] bg-[#fcfbf8] px-2 py-1 text-xs text-slate-700 outline-none focus:border-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() => updateOrderDelivery(order.orderCode, "deliver")}
                              disabled={updatingOrderCode === order.orderCode}
                              className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-2 py-1 text-xs text-slate-700 hover:bg-[#f2ede5] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingOrderCode === order.orderCode ? "Updating..." : "Mark Delivered"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateOrderDelivery(order.orderCode, "undo")}
                            disabled={updatingOrderCode === order.orderCode}
                            className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-2 py-1 text-xs text-slate-700 hover:bg-[#f2ede5] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingOrderCode === order.orderCode ? "Updating..." : "Undo Delivered"}
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                SKUs in order
              </div>
              <div className="mt-2 overflow-auto rounded-lg border border-[#e6ddd0] bg-[#faf8f4]">
                <table className="w-full min-w-[760px] table-fixed text-xs">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[18%]" />
                    <col className="w-[8%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead className="bg-[#f1ebe2] text-slate-700">
                    <tr>
                      <th className="px-2 py-1.5 text-left">SKU</th>
                      <th className="px-2 py-1.5 text-left">Image</th>
                      <th className="px-2 py-1.5 text-right">Qty</th>
                      <th className="px-2 py-1.5 text-right">Sell</th>
                      <th className="px-2 py-1.5 text-right">Cost</th>
                      <th className="px-2 py-1.5 text-right">Line Sell</th>
                      <th className="px-2 py-1.5 text-right">Line Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item._id} className="border-t border-[#e6ddd0] text-slate-700">
                        <td className="px-2 py-1.5 align-top">
                          <div className="truncate">{item.skuId?.name ?? "SKU"}</div>
                        </td>
                        <td className="px-2 py-1.5">
                          {item.skuId?.imageUrl ? (
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.skuId.imageUrl}
                                alt={`${item.skuId?.name ?? "SKU"} preview`}
                                className="h-8 w-8 shrink-0 rounded border border-[#ddd4c7] object-cover"
                              />
                              <a
                                href={item.skuId.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate underline"
                              >
                                View
                              </a>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right">{item.quantity}</td>
                        <td className="px-2 py-1.5 text-right">{item.sellingPrice}</td>
                        <td className="px-2 py-1.5 text-right">{item.costPrice}</td>
                        <td className="px-2 py-1.5 text-right">{item.sellingPrice * item.quantity}</td>
                        <td className="px-2 py-1.5 text-right">{item.costPrice * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {groupedOrders.length === 0 ? (
            <div className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-3 text-slate-500">
              No orders for selected client.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
