export default function ClientInventoryLoading() {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-10 w-full animate-pulse rounded-xl bg-[#faf8f4] md:max-w-[420px]" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#e8e1d6] bg-[#f5f2ed] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded bg-[#faf8f4]" />
          <div className="h-10 animate-pulse rounded bg-[#faf8f4]" />
          <div className="h-10 animate-pulse rounded bg-[#faf8f4]" />
          <div className="h-10 animate-pulse rounded bg-[#faf8f4]" />
        </div>
      </div>
    </section>
  );
}
