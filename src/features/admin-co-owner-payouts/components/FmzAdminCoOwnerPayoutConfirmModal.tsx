'use client';

import { useEffect } from 'react';
import { CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';

// ─── Variant styling (D-4) ─────────────────────────────────────────────────────
// approve = estilo primário/verde ("isto dispara um PIX real").
// reject  = estilo destrutivo, com textarea opcional de motivo.
// batch   = mesmo estilo de approve, para aprovação em lote (D-5).

type FmzAdminCoOwnerPayoutConfirmVariant = 'approve' | 'reject' | 'batch';

const VARIANT_ICON_BG: Record<FmzAdminCoOwnerPayoutConfirmVariant, string> = {
  approve: 'bg-[#F0FAF5] text-[#1A8C5B]',
  batch: 'bg-[#F0FAF5] text-[#1A8C5B]',
  reject: 'bg-[#FBEDEB] text-[#B23B2D]',
};

const VARIANT_CONFIRM_BUTTON: Record<FmzAdminCoOwnerPayoutConfirmVariant, string> = {
  approve: 'border-fmz-border-light bg-[#1A8C5B] text-white hover:bg-[#157048]',
  batch: 'border-fmz-border-light bg-[#1A8C5B] text-white hover:bg-[#157048]',
  reject: 'border-fmz-border-light bg-white text-[#B23B2D] hover:bg-[#FBEDEB] hover:border-[#E8C4C0]',
};

export type FmzAdminCoOwnerPayoutConfirmModalProps = {
  isOpen: boolean;
  variant: FmzAdminCoOwnerPayoutConfirmVariant;
  busy: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Só usado no variant 'reject' — motivo opcional exibido para o co-owner/auditoria. */
  reason?: string;
  onReasonChange?: (value: string) => void;
};

export function FmzAdminCoOwnerPayoutConfirmModal({
  isOpen,
  variant,
  busy,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  reason,
  onReasonChange,
}: FmzAdminCoOwnerPayoutConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, busy, onCancel]);

  if (!isOpen) return null;

  const Icon = variant === 'reject' ? Trash2 : CheckCircle2;

  return (
    <div
      className="fixed inset-0 z-[300] grid place-items-center bg-fmz-navy/45 backdrop-blur-[3px]"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div className="w-[calc(100vw-40px)] max-w-[440px] rounded-[20px] border border-fmz-border-light bg-white p-7 pb-[22px] shadow-[0_24px_64px_-16px_rgba(14,22,38,0.28)]">
        <div className={fmzCn('mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-xl', VARIANT_ICON_BG[variant])}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <h2 className="mb-2 text-[17px] font-bold tracking-[-0.01em] text-fmz-navy">{title}</h2>
        <p className="mb-[18px] text-[13.5px] leading-relaxed text-fmz-text-muted">{description}</p>

        {variant === 'reject' && (
          <textarea
            value={reason ?? ''}
            onChange={(e) => onReasonChange?.(e.target.value)}
            disabled={busy}
            placeholder="Motivo da rejeição (opcional)"
            rows={3}
            className="mb-[18px] w-full resize-none rounded-[10px] border border-fmz-border-light px-3 py-2 text-[13px] text-fmz-navy placeholder:text-[#9AA3B0] focus:outline-none focus:ring-2 focus:ring-[#B23B2D]/20"
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-fmz-border-light bg-white px-4 py-2 text-[13px] font-semibold text-fmz-navy transition-all hover:bg-[#FAFBFC] hover:border-[#D0D4DE] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={fmzCn(
              'inline-flex items-center gap-1.5 rounded-[10px] border px-4 py-2 text-[13px] font-semibold transition-all disabled:opacity-60',
              VARIANT_CONFIRM_BUTTON[variant],
            )}
          >
            {busy && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
