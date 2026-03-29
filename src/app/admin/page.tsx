import { PortalLoginForm } from "@/components/portal-login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10">
      <PortalLoginForm initialPortal="admin" lockPortal />
    </main>
  );
}
