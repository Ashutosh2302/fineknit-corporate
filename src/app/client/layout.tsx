import { ClientNavbar } from "@/components/client-navbar";
import { ClientToastProvider } from "@/components/client-toast-provider";
import { requireClientPage } from "@/lib/guards";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const client = await requireClientPage();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 rounded-3xl bg-[#f2eee7]/95 px-6 py-8">
      <ClientToastProvider>
        <ClientNavbar name={client.name} email={client.email} />
        {children}
      </ClientToastProvider>
    </main>
  );
}
