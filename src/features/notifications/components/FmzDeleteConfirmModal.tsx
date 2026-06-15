'use client';

import { useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export type FmzDeleteConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function FmzDeleteConfirmModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: FmzDeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] grid place-items-center bg-fmz-navy/45 backdrop-blur-[3px]"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-[calc(100vw-40px)] max-w-[420px] rounded-[20px] border border-fmz-border-light bg-white p-7 pb-[22px] shadow-[0_24px_64px_-16px_rgba(14,22,38,0.28)]">
        <div className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#FBEDEB] text-[#B23B2D]">
          <Trash2 size={20} strokeWidth={2} />
        </div>
        <h2 className="mb-2 text-[17px] font-bold tracking-[-0.01em] text-fmz-navy">{title}</h2>
        <p className="mb-[22px] text-[13.5px] leading-relaxed text-fmz-text-muted">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-fmz-border-light bg-white px-4 py-2 text-[13px] font-semibold text-fmz-navy transition-all hover:bg-[#FAFBFC] hover:border-[#D0D4DE]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-fmz-border-light bg-white px-4 py-2 text-[13px] font-semibold text-[#B23B2D] transition-all hover:bg-[#FBEDEB] hover:border-[#E8C4C0]"
          >
            <Trash2 size={13} strokeWidth={2} />
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}
