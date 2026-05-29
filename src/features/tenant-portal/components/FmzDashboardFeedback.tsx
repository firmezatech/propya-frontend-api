import React from "react";

export function FmzDashboardLoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-fmz-border-light border-t-fmz-navy" />
        <p className="text-sm text-fmz-text-muted">Carregando...</p>
      </div>
    </div>
  );
}

export function FmzDashboardErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-red-800">Erro ao carregar dados</h3>
          <p className="text-sm text-red-600">{message}</p>
        </div>
      </div>
    </div>
  );
}
