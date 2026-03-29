export default function ClientLoading() {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <div className="h-6 w-52 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="h-20 animate-pulse rounded-xl bg-[#faf8f4]" />
          <div className="h-20 animate-pulse rounded-xl bg-[#faf8f4]" />
          <div className="h-20 animate-pulse rounded-xl bg-[#faf8f4]" />
          <div className="h-20 animate-pulse rounded-xl bg-[#faf8f4]" />
        </div>
      </div>
      <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          <div className="h-10 animate-pulse rounded bg-[#faf8f4]" />
          <div className="h-10 animate-pulse rounded bg-[#faf8f4]" />
          <div className="h-10 animate-pulse rounded bg-[#faf8f4]" />
        </div>
      </div>
    </section>
  );
}
