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

// ── Renter (tenant) dashboard skeleton ──────────────────────────────────────────
// Mirrors the real FmzRenterDashboard layout: page title, hero (journey + goal
// cards), content grid (bill card + simulator/history stack), and quick actions.
//
// The outer wrapper reproduces the real `.dashboard` container exactly — max-width
// 1280px, centered (mx-auto), and the same responsive horizontal padding
// (clamp(20px,4vw,48px)) plus clamp(24px,4vw,40px) top / 80px bottom — so the
// skeleton occupies the same footprint as the loaded dashboard and never spans the
// full viewport with oversized cards.
//
// Mobile-first — every multi-column grid collapses to a single column on small
// screens. The hero and content grids switch to two columns at min-width:1081px
// (via min-[1081px]:) to mirror the real dashboard's @media (max-width:1080px)
// collapse exactly — avoiding a ~56px band where Tailwind's lg (1024px) would
// disagree with the dashboard layout.

const SKELETON_CARD = 'rounded-2xl border border-fmz-border-light bg-white';

export function FmzRenterDashboardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1280px] space-y-6 px-[clamp(20px,4vw,48px)] pt-[clamp(24px,4vw,40px)] pb-20"
      aria-label="Carregando painel"
      aria-busy="true"
    >
      {/* Page title */}
      <SkBox height="h-8" width="w-56" />

      {/* Hero: journey card + goal card */}
      <div className="grid grid-cols-1 gap-[18px] min-[1081px]:grid-cols-[1.55fr_1fr]">
        {/* Journey card */}
        <div className={`${SKELETON_CARD} p-6 space-y-5`}>
          <SkBox height="h-3" width="w-40" />
          <SkBox height="h-6" width="w-3/4" />
          <SkBox height="h-3" width="w-full" />
          <SkBox height="h-3" width="w-2/3" />
          {/* Timeline track with milestone dots */}
          <div className="pt-6 space-y-3">
            <SkBox height="h-2.5" width="w-full" className="rounded-full" />
            <div className="flex items-center justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkBox key={i} height="h-2.5" width="w-10" />
              ))}
            </div>
          </div>
        </div>

        {/* Goal / next milestone card */}
        <div className={`${SKELETON_CARD} p-6 space-y-4`}>
          <SkBox height="h-3" width="w-28" />
          <SkBox height="h-3" width="w-24" />
          <SkBox height="h-9" width="w-40" />
          <SkBox height="h-3" width="w-full" />
          <div className="space-y-2 pt-2">
            <SkBox height="h-2.5" width="w-full" className="rounded-full" />
            <div className="flex justify-between">
              <SkBox height="h-2.5" width="w-28" />
              <SkBox height="h-2.5" width="w-12" />
            </div>
          </div>
          <SkBox height="h-11" width="w-full" className="rounded-xl" />
        </div>
      </div>

      {/* Content grid: bill card + right stack (simulator + history) */}
      <div className="grid grid-cols-1 gap-[18px] min-[1081px]:grid-cols-[0.85fr_1.15fr] items-start">
        {/* Bill card */}
        <div className={`${SKELETON_CARD} p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <SkBox height="h-4" width="w-32" />
            <SkBox height="h-3" width="w-16" />
          </div>
          <SkBox height="h-9" width="w-44" />
          <div className="flex items-center justify-between">
            <SkBox height="h-6" width="w-28" className="rounded-full" />
            <SkBox height="h-3" width="w-20" />
          </div>
          {/* Bill lines */}
          <div className="space-y-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <SkBox height="h-3" width="w-32" />
                <SkBox height="h-3" width="w-16" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-fmz-border-light pt-4">
            <SkBox height="h-3" width="w-24" />
            <SkBox height="h-5" width="w-24" />
          </div>
          <SkBox height="h-11" width="w-full" className="rounded-xl" />
        </div>

        {/* Right stack */}
        <div className="flex flex-col gap-[18px]">
          {/* Rent simulator card */}
          <div className={`${SKELETON_CARD} p-6 space-y-4`}>
            <SkBox height="h-4" width="w-40" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkBox key={i} height="h-9" width="w-full" className="rounded-lg" />
              ))}
            </div>
            <SkBox height="h-24" width="w-full" className="rounded-xl" />
          </div>

          {/* Payment history card */}
          <div className={`${SKELETON_CARD} overflow-hidden`}>
            <div className="border-b border-fmz-border-light px-5 py-4">
              <SkBox height="h-4" width="w-36" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-fmz-border-light px-5 py-4 last:border-0">
                <SkBox height="h-9" width="w-9" className="rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkBox height="h-3" width="w-32" />
                  <SkBox height="h-3" width="w-20" />
                </div>
                <SkBox height="h-4" width="w-20" className="shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${SKELETON_CARD} p-5 flex items-center gap-4`}>
            <SkBox height="h-10" width="w-10" className="rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkBox height="h-3.5" width="w-28" />
              <SkBox height="h-3" width="w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Token purchase step skeleton ────────────────────────────────────────────────
// Shared Suspense fallback for the tokens-to-purchase-pix/* flow (choose, confirm,
// pix, success, boleto). Mirrors the common chrome of those pages: back link, the
// three-step progress indicator, page header (eyebrow + title + subtitle) and a
// two-column card body. The body collapses to a single column at the same 880px
// breakpoint the real purchase pages use (.buyCols / .confirmGrid @media 880px),
// so there is no layout swap band between fallback and mounted content.

export function FmzTokenPurchaseSkeleton() {
  return (
    <main
      className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8 md:px-12 md:py-10"
      aria-label="Carregando compra de tokens"
      aria-busy="true"
    >
      {/* Back link */}
      <SkBox height="h-3" width="w-24" className="mb-4" />

      {/* Three-step progress indicator */}
      <div className="mb-6 flex items-center gap-2.5 overflow-x-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {i > 0 && <SkBox height="h-px" width="w-7" className="rounded-none shrink-0" />}
            <div className="flex items-center gap-2 shrink-0">
              <SkBox height="h-[22px]" width="w-[22px]" className="rounded-full" />
              <SkBox height="h-3" width="w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6 space-y-2">
        <SkBox height="h-3" width="w-28" />
        <SkBox height="h-9" width="w-72" className="max-w-full" />
        <SkBox height="h-3.5" width="w-96" className="max-w-full" />
      </div>

      {/* Two-column card body */}
      <div className="grid grid-cols-1 gap-[18px] min-[881px]:grid-cols-[1.05fr_1fr] items-start">
        {/* Left (primary) card */}
        <div className={`${SKELETON_CARD} p-7 space-y-5`}>
          <SkBox height="h-3" width="w-40" />
          <SkBox height="h-14" width="w-full" className="rounded-xl" />
          <SkBox height="h-3" width="w-2/3" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkBox key={i} height="h-10" width="w-full" className="rounded-lg" />
            ))}
          </div>
          <SkBox height="h-2" width="w-full" className="rounded-full" />
        </div>

        {/* Right (summary) card */}
        <div className={`${SKELETON_CARD} p-7 space-y-4`}>
          <SkBox height="h-3" width="w-36" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 border-b border-fmz-border-light pb-3 last:border-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <SkBox height="h-9" width="w-9" className="rounded-lg shrink-0" />
                <SkBox height="h-3" width="w-28" />
              </div>
              <SkBox height="h-4" width="w-16" className="shrink-0" />
            </div>
          ))}
          <SkBox height="h-11" width="w-full" className="rounded-xl" />
        </div>
      </div>
    </main>
  );
}

// ── Admin list skeleton ─────────────────────────────────────────────────────────
// Generic stacked-rows placeholder for admin list pages (users, properties,
// access-control roles). Each row mirrors the real "avatar + title/subtitle +
// status chip" layout. Mobile-first: rows are full-width and never overflow.

export function FmzAdminListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-label="Carregando lista" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-fmz-border-light bg-white p-4">
          <SkBox height="h-10" width="w-10" className="rounded-full shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkBox height="h-3.5" width="w-40" className="max-w-full" />
            <SkBox height="h-3" width="w-56" className="max-w-full" />
          </div>
          <SkBox height="h-6" width="w-20" className="rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Admin form skeleton ─────────────────────────────────────────────────────────
// Placeholder for admin settings/form pages: a header plus a responsive grid of
// labelled field cards. Stacks to a single column on small screens.

export function FmzAdminFormSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando configurações" aria-busy="true">
      <div className="space-y-2">
        <SkBox height="h-3" width="w-24" />
        <SkBox height="h-7" width="w-64" className="max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${SKELETON_CARD} p-5 space-y-3`}>
            <div className="flex items-center gap-3">
              <SkBox height="h-9" width="w-9" className="rounded-xl shrink-0" />
              <SkBox height="h-4" width="w-28" />
            </div>
            <SkBox height="h-10" width="w-full" className="rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
