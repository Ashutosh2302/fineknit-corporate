"use client";

import { useState } from "react";
import Link from "next/link";

type Portal = "client" | "admin";

export function ForgotPasswordForm() {
  const portal: Portal = "admin";
  const [identifier, setIdentifier] = useState("");
  const [status, setStatus] = useState("");
  const [tokenForDev, setTokenForDev] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setTokenForDev("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal, identifier }),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to process request");
      return;
    }

    setStatus(data.message ?? "If account exists, a reset token has been generated.");
    if (data.resetTokenForDev) {
      setTokenForDev(data.resetTokenForDev);
    }
  };

  return (
    <div className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-white/20 bg-white/8 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/65">
        Fineknit Access
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Forgot password</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="rounded-xl border border-white/20 bg-white/8 px-3 py-2 text-sm text-white/80">
          Portal: <span className="font-medium capitalize">admin</span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Email or phone</label>
          <input
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/45 outline-none transition focus:border-[#90a6ff] focus:ring-2 focus:ring-[#90a6ff]/30"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-[#cfd9ff] to-[#f1f5ff] px-4 py-2.5 text-sm font-semibold text-[#0b1226] transition hover:opacity-95"
        >
          Send reset request
        </button>
      </form>

      {status ? <p className="mt-4 text-sm text-white/80">{status}</p> : null}
      {tokenForDev ? (
        <div className="mt-4 rounded-xl border border-amber-200/45 bg-amber-100/10 p-3 text-xs text-amber-100">
          Dev reset token: <span className="font-mono">{tokenForDev}</span>
          <div>
            Use this token at{" "}
            <Link className="underline decoration-amber-200/70" href={`/reset-password?portal=${portal}`}>
              reset password
            </Link>
          </div>
        </div>
      ) : null}

      <Link className="mt-5 inline-block text-sm text-white/80 hover:text-white hover:underline" href={`/login?portal=${portal}`}>
        Back to login
      </Link>
    </div>
  );
}
