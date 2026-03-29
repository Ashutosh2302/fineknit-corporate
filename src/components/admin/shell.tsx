"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

type AdminShellProps = {
  title: string;
  subtitle: string;
  adminEmail: string;
  adminType: string;
  children: React.ReactNode;
};

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/clients", label: "Client Management" },
  { href: "/admin/skus", label: "SKU Management" },
  { href: "/admin/orders", label: "Order Management" },
];

export function AdminShell({ title, subtitle, adminEmail, adminType, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <main
      className="admin-light mx-auto w-full max-w-7xl flex-1 rounded-3xl bg-[#f2eee7]/95 px-6 py-8 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
    >
      <header className="mb-6 rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Fineknit Admin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            <p className="mt-1 text-xs text-slate-500">
              {adminEmail} ({adminType})
            </p>
          </div>
          <LogoutButton className="rounded-xl border border-[#ddd4c7] bg-[#faf8f4] px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#f2ede5]" />
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-[#ead8b0] bg-gradient-to-r from-[#fff8e8] to-[#f4e6ca] text-[#5f4a2e] shadow-[0_6px_18px_rgba(160,126,72,0.22)]"
                    : "border-[#ddd4c7] bg-[#faf8f4] text-slate-700 hover:bg-[#f2ede5]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {children}
    </main>
  );
}
