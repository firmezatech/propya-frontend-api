'use client';

import { X, Printer } from 'lucide-react';
import type { FmzAdminTokenOrder } from '../domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#F0F1F3] last:border-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className="text-sm font-medium text-[#1E2A3B] text-right">{value ?? '—'}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  order: FmzAdminTokenOrder;
  onClose: () => void;
};

export function FmzTokenPurchaseReceiptModal({ order, onClose }: Props) {
  const receipt = order.documents.receipt;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comprovante de compra"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EAF0]">
          <h2 className="text-base font-semibold text-[#1E2A3B]">Comprovante de Compra</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="text-[#6B7280] hover:text-[#1E2A3B] transition-colors"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#1E2A3B] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {!receipt ? (
            <p className="text-sm text-[#9AA3B0] text-center py-8">
              Comprovante não disponível.<br />
              <span className="text-xs">Ordens anteriores à implantação desta funcionalidade não possuem comprovante armazenado.</span>
            </p>
          ) : (
            <>
              {receipt.data.receiptRef && (
                <div className="mb-4 text-center">
                  <p className="text-xs text-[#9AA3B0]">Nº do comprovante</p>
                  <p className="text-lg font-bold text-[#1E2A3B] font-mono tracking-widest">
                    {receipt.data.receiptRef}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-[#F7F8FA] p-4">
                <Row label="Comprador"      value={receipt.data.buyerName} />
                <Row label="E-mail"         value={receipt.data.buyerEmail} />
                <Row label="Imóvel"         value={receipt.data.propertyName} />
                <Row label="Tokens"         value={receipt.data.tokenQuantity} />
                <Row label="Valor pago"     value={receipt.data.paidAmount} />
                <Row label="Data"           value={receipt.data.receiptDate} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8EAF0]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-[#E8EAF0] text-sm text-[#6B7280] hover:bg-[#F7F8FA] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
