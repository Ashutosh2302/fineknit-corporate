"use client";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const handleLogout = () => {
    // Trigger logout in background, then redirect immediately for instant UX.
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/auth/logout", new Blob());
    } else {
      void fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => null);
    }
    window.location.assign("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)] ${
        className ??
        "rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/18"
      }`}
    >
      Logout
    </button>
  );
}
