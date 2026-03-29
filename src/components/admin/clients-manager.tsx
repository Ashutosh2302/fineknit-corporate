"use client";

import { useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
};

type Props = {
  initialClients: Client[];
};

const inputClass =
  "w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export function AdminClientsManager({ initialClients }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [status, setStatus] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  const createClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setGeneratedPassword("");
    setCopyStatus("");
    setCreatingClient(true);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Failed to create client");
        return;
      }

      setStatus("Client created successfully.");
      setGeneratedPassword(data.initialPassword ?? "");
      setForm({ name: "", email: "", phoneNumber: "", address: "" });

      const listResponse = await fetch("/api/admin/clients");
      const listData = await listResponse.json();
      if (listResponse.ok) {
        setClients(listData.clients ?? []);
      }
    } catch {
      setStatus("Unable to create client right now.");
    } finally {
      setCreatingClient(false);
    }
  };

  const copyPassword = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopyStatus("Password copied.");
    } catch {
      setCopyStatus("Could not auto-copy. Please copy manually.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
        <h2 className="text-lg font-semibold tracking-tight">Create Client</h2>
        <p className="mt-1 text-sm text-slate-600">
          A random password is auto-generated and shown after creation.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createClient}>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Client Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className={inputClass}
              placeholder="Acme Uniforms"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Client Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className={inputClass}
              placeholder="ops@acme.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Phone Number</label>
            <input
              required
              value={form.phoneNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              className={inputClass}
              placeholder="+91..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Address</label>
            <input
              required
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className={inputClass}
              placeholder="City, State"
            />
          </div>

          <button
            disabled={creatingClient}
            className="w-fit rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingClient ? "Creating..." : "Create Client"}
          </button>
        </form>

        {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
        {generatedPassword ? (
          <div className="mt-3 rounded-xl border border-[#ddd4c7] bg-[#faf8f4] p-3 text-sm text-slate-700">
            <p>
              Generated password: <span className="font-mono font-semibold">{generatedPassword}</span>
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={copyPassword}
                className="rounded-lg border border-[#ddd4c7] bg-[#faf8f4] px-3 py-1.5 text-xs text-slate-700 hover:bg-[#f2ede5]"
              >
                Copy Password
              </button>
              {copyStatus ? <span className="text-xs text-slate-600">{copyStatus}</span> : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5">
        <h2 className="text-lg font-semibold tracking-tight">Clients</h2>
        <div className="mt-4 overflow-auto rounded-xl border border-[#ddd4c7] bg-[#faf8f4]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f1ebe2] text-slate-700">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t border-[#e6ddd0] text-slate-700">
                  <td className="px-3 py-2">{client.name}</td>
                  <td className="px-3 py-2">{client.email}</td>
                  <td className="px-3 py-2">{client.phoneNumber}</td>
                  <td className="px-3 py-2">{client.address}</td>
                </tr>
              ))}
              {clients.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    No clients yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
