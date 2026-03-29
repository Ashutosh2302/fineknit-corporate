"use client";

import { useState } from "react";
import Link from "next/link";

type Portal = "client" | "admin";

type PortalLoginFormProps = {
  initialPortal?: Portal;
  lockPortal?: boolean;
};

export function PortalLoginForm({
  initialPortal = "client",
  lockPortal = false,
}: PortalLoginFormProps) {
  const [portal, setPortal] = useState<Portal>(initialPortal);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [mustChangeExpiredPassword, setMustChangeExpiredPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMustChangeExpiredPassword(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, portal }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.code === "PASSWORD_EXPIRED" && portal === "client") {
          setCurrentPassword(password);
          setMustChangeExpiredPassword(true);
        }
        setError(data.error ?? "Login failed");
        return;
      }

      const targetPath = portal === "admin" ? "/admin/dashboard" : "/client/dashboard";
      window.location.assign(targetPath);
      return;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onExpiredPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/update-expired-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to update password");
        return;
      }

      window.location.assign("/client/dashboard");
      return;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-7 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        Fineknit Access
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Portal Login</h1>
      <p className="mt-2 text-sm text-slate-600">
        {lockPortal && portal === "client"
          ? "Sign in using your email or phone and password."
          : "Sign in using email or phone and password."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {!lockPortal ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Portal</label>
            <select
              value={portal}
              onChange={(e) => setPortal(e.target.value as Portal)}
              className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ) : (
          <div className="rounded-xl border border-[#ddd4c7] bg-[#faf8f4] px-3 py-2 text-sm text-slate-700">
            <span className="font-medium">{portal === "admin" ? "Admin Portal" : "Client Portal"}</span>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email or Phone</label>
          <input
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="name@company.com or +91..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[#ddd4c7] bg-[#fcfbf8] px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="******"
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {mustChangeExpiredPassword ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Password expired. Update password to continue.</p>
          <form onSubmit={onExpiredPasswordSubmit} className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-800">Current password</label>
              <input
                required
                minLength={6}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 placeholder:text-amber-400 outline-none transition focus:border-amber-300"
                placeholder="Current password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-800">New password</label>
              <input
                required
                minLength={6}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 placeholder:text-amber-400 outline-none transition focus:border-amber-300"
                placeholder="New password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-800">Confirm new password</label>
              <input
                required
                minLength={6}
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 placeholder:text-amber-400 outline-none transition focus:border-amber-300"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-60"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
        <span />
        <Link className="hover:text-slate-900 hover:underline" href="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
