"use client";

import { useCallback, useMemo, useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
};

type Sku = {
  id: string;
  clientId: string;
  name: string;
  description: string;
  imageUrl: string;
};

type OrderItemInput = {
  skuId: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
};

const emptyOrderItem = (): OrderItemInput => ({
  skuId: "",
  quantity: 1,
  sellingPrice: 0,
  costPrice: 0,
});

type AdminDashboardProps = {
  initialClients: Client[];
  initialSkus: Sku[];
};

const controlClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/45 outline-none transition focus:border-[#9fb1ff] focus:ring-2 focus:ring-[#9fb1ff]/30";

export function AdminDashboard({ initialClients, initialSkus }: AdminDashboardProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? "");
  const [skus, setSkus] = useState<Sku[]>(initialSkus);
  const [status, setStatus] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  const [newSku, setNewSku] = useState({
    name: "",
    description: "",
    imageUrl: "",
  });

  const [orderPayload, setOrderPayload] = useState({
    invoiceUrl: "",
    delivered: false,
    deliveryDate: "",
    items: [emptyOrderItem()],
  });

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId]
  );

  const loadClients = useCallback(async () => {
    const response = await fetch("/api/admin/clients");
    const data = await response.json();
    if (response.ok) {
      setClients(data.clients ?? []);
      if (!selectedClientId && data.clients?.[0]?.id) {
        setSelectedClientId(data.clients[0].id);
      }
    }
  }, [selectedClientId]);

  const loadSkus = useCallback(async (clientId: string) => {
    if (!clientId) {
      setSkus([]);
      return;
    }

    const response = await fetch(`/api/admin/skus?clientId=${clientId}`);
    const data = await response.json();
    if (response.ok) {
      setSkus(data.skus ?? []);
    }
  }, []);

  const createClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setGeneratedPassword("");
    setCopyStatus("");

    const response = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClient),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to create client");
      return;
    }

    setStatus("Client created successfully.");
    setGeneratedPassword(data.initialPassword ?? "");
    setNewClient({ name: "", email: "", phoneNumber: "", address: "" });
    await loadClients();
  };

  const copyGeneratedPassword = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopyStatus("Password copied.");
    } catch {
      setCopyStatus("Unable to copy automatically. Please copy manually.");
    }
  };

  const createSku = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");

    if (!selectedClientId) {
      setStatus("Select a client first");
      return;
    }

    const response = await fetch("/api/admin/skus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newSku, clientId: selectedClientId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to create SKU");
      return;
    }

    setStatus("SKU created successfully.");
    setNewSku({ name: "", description: "", imageUrl: "" });
    await loadSkus(selectedClientId);
  };

  const createOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");

    if (!selectedClientId) {
      setStatus("Select a client first");
      return;
    }

    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedClientId,
        invoiceUrl: orderPayload.invoiceUrl,
        delivered: orderPayload.delivered,
        deliveryDate: orderPayload.deliveryDate
          ? new Date(orderPayload.deliveryDate).toISOString()
          : null,
        items: orderPayload.items,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to create order");
      return;
    }

    setStatus(
      `Order created (${data.orderCode}). ${
        orderPayload.delivered ? "Inventory updated." : "Inventory will update on delivery."
      }`
    );
    setOrderPayload({
      invoiceUrl: "",
      delivered: false,
      deliveryDate: "",
      items: [emptyOrderItem()],
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/20 bg-white/8 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Admin controls</h2>
            <p className="mt-1 text-sm text-white/70">
              SKUs are client-specific. Orders accept only SKUs belonging to the selected client.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/85">
            Selected client SKUs: <span className="font-semibold">{skus.length}</span>
          </div>
        </div>

        {status ? (
          <p className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white/90">
            {status}
          </p>
        ) : null}
        {generatedPassword ? (
          <div className="mt-3 rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white/90">
            <p>
              Generated password:{" "}
              <span className="font-mono font-semibold text-[#dce5ff]">{generatedPassword}</span>
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={copyGeneratedPassword}
                className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
              >
                Copy password
              </button>
              {copyStatus ? <span className="text-xs text-white/75">{copyStatus}</span> : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/20 bg-white/8 p-5 backdrop-blur-xl lg:col-span-2">
          <h3 className="font-semibold">1) Create client account</h3>
          <p className="mt-1 text-xs text-white/60">Create credentials and share initial password manually.</p>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createClient}>
            <input
              required
              placeholder="Client name"
              value={newClient.name}
              onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
              className={controlClass}
            />
            <input
              required
              type="email"
              placeholder="Client email"
              value={newClient.email}
              onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
              className={controlClass}
            />
            <input
              required
              placeholder="Phone number"
              value={newClient.phoneNumber}
              onChange={(e) => setNewClient((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              className={controlClass}
            />
            <input
              required
              placeholder="Address"
              value={newClient.address}
              onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
              className={controlClass}
            />
            <button className="w-fit rounded-xl bg-gradient-to-r from-[#cfd9ff] to-[#f1f5ff] px-4 py-2.5 text-sm font-semibold text-[#0b1226] transition hover:opacity-95">
              Create client
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/8 p-5 backdrop-blur-xl">
          <h3 className="font-semibold">Active client context</h3>
          <select
            value={selectedClientId}
            onChange={async (e) => {
              const nextClientId = e.target.value;
              setSelectedClientId(nextClientId);
              await loadSkus(nextClientId);
            }}
            className={`mt-3 ${controlClass}`}
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.email}
              </option>
            ))}
          </select>

          {selectedClient ? (
            <div className="mt-3 rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white/80">
              <p className="font-medium text-white">{selectedClient.name}</p>
              <p>{selectedClient.email}</p>
              <p>{selectedClient.phoneNumber}</p>
              <p>{selectedClient.address}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/60">Select a client to load client-bound SKUs.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/20 bg-white/8 p-5 backdrop-blur-xl">
          <h3 className="font-semibold">2) Upload SKU for selected client</h3>
          <form className="mt-4 space-y-3" onSubmit={createSku}>
            <input
              required
              placeholder="SKU name"
              value={newSku.name}
              onChange={(e) => setNewSku((prev) => ({ ...prev, name: e.target.value }))}
              className={controlClass}
            />
            <textarea
              placeholder="Description"
              value={newSku.description}
              onChange={(e) => setNewSku((prev) => ({ ...prev, description: e.target.value }))}
              className={controlClass}
            />
            <input
              placeholder="Image URL"
              value={newSku.imageUrl}
              onChange={(e) => setNewSku((prev) => ({ ...prev, imageUrl: e.target.value }))}
              className={controlClass}
            />
            <button className="rounded-xl bg-gradient-to-r from-[#cfd9ff] to-[#f1f5ff] px-4 py-2.5 text-sm font-semibold text-[#0b1226] transition hover:opacity-95">
              Create SKU
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/8 p-5 backdrop-blur-xl">
          <h3 className="font-semibold">Current SKUs (selected client)</h3>
          <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-1">
            {skus.length === 0 ? (
              <p className="text-sm text-white/60">No SKUs for this client yet.</p>
            ) : (
              skus.map((sku) => (
                <div key={sku.id} className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm">
                  <p className="font-medium text-white">{sku.name}</p>
                  <p className="text-white/70">{sku.description || "No description"}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/20 bg-white/8 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">3) Create order with SKU line items</h3>
          <p className="text-xs text-white/65">Only selected client SKUs are listed below.</p>
        </div>

        <form className="mt-4 space-y-4" onSubmit={createOrder}>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="Invoice URL"
              value={orderPayload.invoiceUrl}
              onChange={(e) => setOrderPayload((prev) => ({ ...prev, invoiceUrl: e.target.value }))}
              className={controlClass}
            />
            <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/85">
              <input
                type="checkbox"
                checked={orderPayload.delivered}
                onChange={(e) => setOrderPayload((prev) => ({ ...prev, delivered: e.target.checked }))}
              />
              Mark delivered
            </label>
            <input
              type="datetime-local"
              value={orderPayload.deliveryDate}
              onChange={(e) => setOrderPayload((prev) => ({ ...prev, deliveryDate: e.target.value }))}
              className={controlClass}
            />
          </div>

          <div className="space-y-3">
            {orderPayload.items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-white/20 bg-white/10 p-3 md:grid-cols-4"
              >
                <select
                  required
                  value={item.skuId}
                  onChange={(e) => {
                    const next = [...orderPayload.items];
                    next[index].skuId = e.target.value;
                    setOrderPayload((prev) => ({ ...prev, items: next }));
                  }}
                  className={controlClass}
                >
                  <option value="">Choose SKU</option>
                  {skus.map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {sku.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  min={1}
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...orderPayload.items];
                    next[index].quantity = Number(e.target.value);
                    setOrderPayload((prev) => ({ ...prev, items: next }));
                  }}
                  className={controlClass}
                />
                <input
                  required
                  min={0}
                  type="number"
                  placeholder="Selling price"
                  value={item.sellingPrice}
                  onChange={(e) => {
                    const next = [...orderPayload.items];
                    next[index].sellingPrice = Number(e.target.value);
                    setOrderPayload((prev) => ({ ...prev, items: next }));
                  }}
                  className={controlClass}
                />
                <input
                  required
                  min={0}
                  type="number"
                  placeholder="Cost price"
                  value={item.costPrice}
                  onChange={(e) => {
                    const next = [...orderPayload.items];
                    next[index].costPrice = Number(e.target.value);
                    setOrderPayload((prev) => ({ ...prev, items: next }));
                  }}
                  className={controlClass}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setOrderPayload((prev) => ({ ...prev, items: [...prev.items, emptyOrderItem()] }))
              }
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/85 transition hover:bg-white/18"
            >
              Add SKU line
            </button>

            <button
              type="button"
              onClick={() =>
                setOrderPayload((prev) => ({
                  ...prev,
                  items: prev.items.length > 1 ? prev.items.slice(0, -1) : prev.items,
                }))
              }
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/85 transition hover:bg-white/18"
            >
              Remove last line
            </button>

            <button className="rounded-xl bg-gradient-to-r from-[#cfd9ff] to-[#f1f5ff] px-4 py-2.5 text-sm font-semibold text-[#0b1226] transition hover:opacity-95">
              Create order
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
