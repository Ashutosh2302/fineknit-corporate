export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#f3efe8] text-slate-900"
      style={{
        background:
          "radial-gradient(circle at 12% 4%, rgba(233,224,211,0.6), transparent 34%), radial-gradient(circle at 86% 96%, rgba(244,238,229,0.8), transparent 36%), linear-gradient(155deg, #f7f4ee 0%, #f3efe8 45%, #efe9df 100%)",
      }}
    >
      {children}
    </div>
  );
}
