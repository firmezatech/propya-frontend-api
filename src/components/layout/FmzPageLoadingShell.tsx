// Lightweight content-level loading placeholder.
// Used as the Suspense fallback for pages that use useSearchParams().
// This is NOT the global auth/permission loading screen — that is FmzFullPageLoading.
// Use this only when the data being loaded fills page content, not access control.
export function FmzPageLoadingShell() {
  return (
    <main className="mx-auto w-full flex-1 px-5 py-10 sm:px-6 md:px-10 lg:px-12 xl:px-14 md:pb-20 max-w-[1360px]">
      <div className="flex min-h-[40vh] items-center justify-center">
        <span
          className="block h-6 w-6 animate-spin rounded-full border-2 border-fmz-border-light border-t-fmz-navy"
          aria-label="Carregando"
        />
      </div>
    </main>
  );
}
