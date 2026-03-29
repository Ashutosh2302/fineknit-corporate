import { PortalLoginForm } from "@/components/portal-login-form";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const params = await searchParams;
  if (params.portal === "admin") {
    redirect("/admin");
  }

  return (
    <main className="relative flex min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-3xl border border-white/20">
      <Image
        src="/background.png"
        alt="Fineknit textile background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex w-full flex-col">
        <header className="flex items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-4">
            <Image
              src="/fineknitlogo2.png"
              alt="Fineknit symbol logo"
              width={56}
              height={56}
              className="h-12 w-12 object-contain md:h-14 md:w-14"
            />
            <Image
              src="/fineknitlogo1.png"
              alt="Fineknit text logo"
              width={170}
              height={72}
              className="h-11 w-auto object-contain md:h-14"
            />
          </div>
          <p className="hidden text-xs uppercase tracking-[0.2em] text-white/75 md:block">Client Portal</p>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-8 pt-2 md:px-10 md:pb-10">
          <div className="grid w-full max-w-6xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <section className="hidden rounded-2xl border border-white/20 bg-black/30 p-8 text-white/90 backdrop-blur-sm md:block">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/70">Fineknit Textile Co.</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                Smart textile operations for enterprise clients.
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/80">
                Track delivered orders, monitor inventory in real time, and manage employee-level distribution from a
                single portal.
              </p>
            </section>

            <section className="flex items-center justify-center">
              <PortalLoginForm initialPortal="client" lockPortal />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
