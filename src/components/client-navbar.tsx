"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

type ClientNavbarProps = {
  name: string;
  email: string;
};

const navItems = [
  { href: "/client/dashboard", label: "Dashboard" },
  { href: "/client/inventory", label: "Inventory" },
  { href: "/client/orders", label: "Orders" },
];

export function ClientNavbar({ name, email }: ClientNavbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = segments
    .map((segment, index) => {
      let href = `/${segments.slice(0, index + 1).join("/")}`;
      let label = segment.replace(/-/g, " ");

      if (segment === "client") label = "Client";
      if (segment === "dashboard") label = "Dashboard";
      if (segment === "inventory") label = "Inventory";
      if (segment === "orders") label = "Orders";
      if (segment === "distributed") label = "Distributed History";
      if (segment.length === 24) {
        label = "SKU";
        href = "/client/inventory";
      }

      return { href, label: label.charAt(0).toUpperCase() + label.slice(1) };
    })
    .filter((item) => item.label !== "Client");

  return (
    <header className="mb-6 w-full rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] px-5 py-4 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div className="min-w-[200px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fineknit Portal</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">Welcome, {name}</h1>
          <p className="text-xs text-slate-600">{email}</p>
        </div>

        <nav className="flex flex-1 flex-wrap items-center justify-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                  active
                    ? "border-[#ead8b0] bg-gradient-to-r from-[#fff8e8] to-[#f4e6ca] text-[#5f4a2e] shadow-[0_6px_18px_rgba(160,126,72,0.22)]"
                    : "border-[#ddd4c7] bg-[#faf8f4] text-slate-700 hover:bg-[#f2ede5]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-[120px] justify-end">
          <LogoutButton className="rounded-xl border border-[#ddd4c7] bg-[#faf8f4] px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#f2ede5]" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href="/client/dashboard" className="hover:text-slate-700 hover:underline">
          Home
        </Link>
        {breadcrumbItems.map((item, index) => (
          <span key={`${item.href}-${item.label}-${index}`} className="flex items-center gap-2">
            <span>/</span>
            <Link href={item.href} className="hover:text-slate-700 hover:underline">
              {item.label}
            </Link>
          </span>
        ))}
      </div>
    </header>
  );
}
