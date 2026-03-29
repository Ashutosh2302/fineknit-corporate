"use client";

import Link from "next/link";
import { useState } from "react";

type Portal = "client" | "admin";

export function ResetPasswordForm() {
  const portal: Portal = "admin";
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword, portal }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Unable to reset password");
      return;
    }

    setMessage("Password reset successful. Please login with your new password.");
  };

  return (
    <div className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-white/20 bg-white/8 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/65">
        Fineknit Access
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Reset password</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="rounded-xl border border-white/20 bg-white/8 px-3 py-2 text-sm text-white/80">
          Portal: <span className="font-medium capitalize">admin</span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Reset token</label>
          <input
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/45 outline-none transition focus:border-[#90a6ff] focus:ring-2 focus:ring-[#90a6ff]/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">New password</label>
          <input
            required
            minLength={6}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/45 outline-none transition focus:border-[#90a6ff] focus:ring-2 focus:ring-[#90a6ff]/30"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-[#cfd9ff] to-[#f1f5ff] px-4 py-2.5 text-sm font-semibold text-[#0b1226] transition hover:opacity-95"
        >
          Reset password
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-white/80">{message}</p> : null}

      <Link className="mt-5 inline-block text-sm text-white/80 hover:text-white hover:underline" href={`/login?portal=${portal}`}>
        Back to login
      </Link>
    </div>
  );
}
