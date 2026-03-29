import { PortalLoginForm } from "@/components/portal-login-form";
import Image from "next/image";

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-10">
      <Image
        src="/background.png"
        alt="Fineknit textile background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative z-10 w-full max-w-md">
        <PortalLoginForm initialPortal="admin" lockPortal />
      </div>
    </main>
  );
}
