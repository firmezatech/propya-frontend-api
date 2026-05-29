// Reusable skeleton primitives for content-loading states.
// These are local page skeletons — NOT the global auth/permission loading screen.

type SkeletonBoxProps = {
  className?: string;
  height?: string;
  width?: string;
};

function SkBox({ className = '', height = 'h-4', width = 'w-full' }: SkeletonBoxProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-fmz-border-light ${height} ${width} ${className}`}
      aria-hidden="true"
    />
  );
}

// ── Payment History skeleton ───────────────────────────────────────────────────

export function FmzPaymentHistorySkeleton() {
  return (
    <div className="space-y-6 py-4" aria-label="Carregando histórico de pagamentos">
      {/* Page header */}
      <div className="space-y-2">
        <SkBox height="h-3" width="w-24" />
        <SkBox height="h-7" width="w-64" />
        <SkBox height="h-3" width="w-48" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-fmz-border-light bg-white p-5 space-y-3">
            <SkBox height="h-3" width="w-20" />
            <SkBox height="h-6" width="w-28" />
          </div>
        ))}
      </div>
      {/* Filter bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkBox key={i} height="h-8" width="w-20" className="rounded-full" />
        ))}
      </div>
      {/* List rows */}
      <div className="rounded-2xl border border-fmz-border-light bg-white overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-fmz-border-light px-5 py-4 last:border-0">
            <SkBox height="h-10" width="w-10" className="rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <SkBox height="h-3" width="w-32" />
              <SkBox height="h-3" width="w-20" />
            </div>
            <SkBox height="h-4" width="w-24" className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Invoice skeleton ────────────────────────────────────────────────────────────

export function FmzInvoiceSkeleton() {
  return (
    <div className="space-y-6 py-4" aria-label="Carregando boleto">
      {/* Page header */}
      <div className="space-y-2">
        <SkBox height="h-7" width="w-48" />
        <SkBox height="h-3" width="w-36" />
      </div>
      {/* Main invoice card */}
      <div className="rounded-2xl border border-fmz-border-light bg-white p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <SkBox height="h-3" width="w-20" />
            <SkBox height="h-8" width="w-40" />
          </div>
          <SkBox height="h-9" width="w-28" className="rounded-xl shrink-0" />
        </div>
        {/* Barcode area */}
        <SkBox height="h-14" width="w-full" className="rounded-xl" />
        {/* Copy block */}
        <div className="rounded-xl border border-fmz-border-light p-4 space-y-3">
          <SkBox height="h-3" width="w-full" />
          <SkBox height="h-3" width="w-3/4" />
          <SkBox height="h-9" width="w-36" className="rounded-lg" />
        </div>
      </div>
      {/* Breakdown */}
      <div className="rounded-2xl border border-fmz-border-light bg-white p-6 space-y-3">
        <SkBox height="h-4" width="w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <SkBox height="h-3" width="w-32" />
            <SkBox height="h-3" width="w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Wallet skeleton ─────────────────────────────────────────────────────────────

export function FmzWalletSkeleton() {
  return (
    <div className="space-y-6 py-4" aria-label="Carregando carteira">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <SkBox height="h-7" width="w-32" />
        <div className="flex gap-2">
          <SkBox height="h-9" width="w-24" className="rounded-xl" />
          <SkBox height="h-9" width="w-32" className="rounded-xl" />
        </div>
      </div>
      {/* Hero cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-fmz-border-light bg-white p-6 space-y-4">
          <SkBox height="h-3" width="w-24" />
          <SkBox height="h-8" width="w-40" />
          <SkBox height="h-3" width="w-32" />
          <SkBox height="h-20" width="w-full" className="rounded-xl" />
        </div>
        <div className="rounded-2xl border border-fmz-border-light bg-white p-6 space-y-3">
          <SkBox height="h-4" width="w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkBox height="h-8" width="w-8" className="rounded-full shrink-0" />
                <SkBox height="h-3" width="w-24" />
              </div>
              <SkBox height="h-3" width="w-16" />
            </div>
          ))}
        </div>
      </div>
      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-fmz-border-light bg-white p-4 space-y-2">
            <SkBox height="h-3" width="w-20" />
            <SkBox height="h-5" width="w-24" />
          </div>
        ))}
      </div>
      {/* Transaction list */}
      <div className="rounded-2xl border border-fmz-border-light bg-white overflow-hidden">
        <div className="border-b border-fmz-border-light px-5 py-4">
          <SkBox height="h-4" width="w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-fmz-border-light px-5 py-4 last:border-0">
            <SkBox height="h-9" width="w-9" className="rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <SkBox height="h-3" width="w-40" />
              <SkBox height="h-3" width="w-24" />
            </div>
            <div className="text-right space-y-2">
              <SkBox height="h-3" width="w-20" />
              <SkBox height="h-3" width="w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Contract skeleton ───────────────────────────────────────────────────────────

export function FmzContractSkeleton() {
  return (
    <div className="rounded-2xl border border-fmz-border-light bg-white p-8 space-y-6" aria-label="Carregando contrato">
      <div className="space-y-2">
        <SkBox height="h-3" width="w-20" />
        <SkBox height="h-7" width="w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <SkBox height="h-3" width="w-28" />
            <SkBox height="h-4" width="w-40" />
          </div>
        ))}
      </div>
      <SkBox height="h-36" width="w-full" className="rounded-xl" />
    </div>
  );
}
