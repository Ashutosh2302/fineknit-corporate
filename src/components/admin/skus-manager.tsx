"use client";

import { useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string;
};

type Sku = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

type Props = {
  initialClients: Client[];
  initialSkus: Sku[];
};

const inputClass =
  "w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export function AdminSkusManager({ initialClients, initialSkus }: Props) {
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? "");
  const [skus, setSkus] = useState<Sku[]>(initialSkus);
  const [status, setStatus] = useState("");
  const [loadingSkus, setLoadingSkus] = useState(false);
  const [creatingSku, setCreatingSku] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadSkus = async (clientId: string) => {
    if (!clientId) {
      setSkus([]);
      return;
    }

    setLoadingSkus(true);
    try {
      const response = await fetch(`/api/admin/skus?clientId=${clientId}`);
      const data = await response.json();
      if (response.ok) {
        setSkus(data.skus ?? []);
      }
    } finally {
      setLoadingSkus(false);
    }
  };

  const createSku = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setCreatingSku(true);

    if (!selectedClientId) {
      setStatus("Select a client first.");
      setCreatingSku(false);
      return;
    }

    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("folder", "skus");
        uploadFormData.append("file", imageFile);
        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadData = await uploadResponse.json();
        setUploading(false);

        if (!uploadResponse.ok) {
          setStatus(uploadData.error ?? "Failed to upload image");
          return;
        }

        imageUrl = uploadData.url;
      }

      const response = await fetch("/api/admin/skus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl, clientId: selectedClientId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Failed to create SKU");
        return;
      }

      setStatus("SKU created successfully.");
      setForm({ name: "", description: "", imageUrl: "" });
      setImageFile(null);
      await loadSkus(selectedClientId);
    } catch {
      setStatus("Unable to create SKU right now.");
    } finally {
      setUploading(false);
      setCreatingSku(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
        <h2 className="text-lg font-semibold tracking-tight">SKU Management</h2>
        <p className="mt-1 text-sm text-slate-600">SKUs are tied to exactly one client.</p>

        <div className="mt-4">
          <label className="mb-1 block text-sm text-slate-700">Client</label>
          <select
            value={selectedClientId}
            onChange={async (e) => {
              const id = e.target.value;
              setSelectedClientId(id);
              await loadSkus(id);
            }}
            disabled={loadingSkus || creatingSku}
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

        <form className="mt-4 space-y-3" onSubmit={createSku}>
          <div>
            <label className="mb-1 block text-sm text-slate-700">SKU Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className={inputClass}
              placeholder="Round Neck Tee"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              placeholder="Fabric, GSM, fit"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">SKU Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-600">
              Upload image directly to S3 bucket. No URL needed.
            </p>
          </div>

          <button
            disabled={creatingSku || loadingSkus}
            className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading..." : creatingSku ? "Creating..." : "Create SKU"}
          </button>
        </form>

        {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
      </section>

      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
        <h2 className="text-lg font-semibold tracking-tight">SKUs For Selected Client</h2>
        <div className="mt-4 space-y-2">
          {skus.map((sku) => (
            <div
              key={sku.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-[#ddd4c7] bg-[#faf8f4] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{sku.name}</p>
                <p className="text-sm text-slate-600">{sku.description || "No description"}</p>
                {sku.imageUrl ? (
                  <a href={sku.imageUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                    View image
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">No image uploaded</p>
                )}
              </div>

              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#ddd4c7] bg-[#faf8f4]">
                {sku.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sku.imageUrl}
                    alt={`${sku.name} preview`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                    No image
                  </div>
                )}
              </div>
            </div>
          ))}
          {skus.length === 0 ? <p className="text-sm text-slate-500">No SKUs found.</p> : null}
        </div>
      </section>
    </div>
  );
}
