'use client';

import { Check, Trash2, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';

export type FmzNotificationsSelectionBarProps = {
  selectedCount: number;
  onMarkRead: () => void;
  onDismiss: () => void;
  onClose: () => void;
};

export function FmzNotificationsSelectionBar({
  selectedCount,
  onMarkRead,
  onDismiss,
  onClose,
}: FmzNotificationsSelectionBarProps) {
  return (
    <div
      className={fmzCn(
        'sticky top-[78px] z-[90] mb-3 flex items-center gap-2.5 rounded-[14px] bg-fmz-navy px-[18px] py-[11px] text-white shadow-[0_8px_24px_rgba(14,22,38,0.22)] transition-all duration-200',
        selectedCount > 0 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1.5 pointer-events-none',
      )}
      aria-hidden={selectedCount === 0}
    >
      <span className="flex-1 text-[13.5px] font-semibold tracking-[-0.005em]">
        <span className="text-fmz-gold">{selectedCount}</span>{' '}
        selecionada{selectedCount !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onMarkRead}
          className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-[8px] border border-white/15 bg-white/10 px-3 py-[7px] text-[12.5px] font-semibold text-white transition-all hover:border-white/28 hover:bg-white/[0.18]"
        >
          <Check size={12} strokeWidth={2} />
          Marcar como lidas
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-[8px] border border-[rgba(178,59,45,0.4)] bg-[rgba(178,59,45,0.25)] px-3 py-[7px] text-[12.5px] font-semibold text-[#FFA99E] transition-all hover:bg-[rgba(178,59,45,0.4)]"
        >
          <Trash2 size={12} strokeWidth={2} />
          Apagar
        </button>
      </div>

      <button
        type="button"
        title="Cancelar seleção"
        onClick={onClose}
        className="ml-1 flex h-6 w-6 items-center justify-center rounded-[6px] text-fmz-text-hint transition-colors hover:text-white"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
