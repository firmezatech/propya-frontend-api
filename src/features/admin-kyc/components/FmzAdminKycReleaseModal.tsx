'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { FmzAdminKycUser } from '../domain';

type Props = {
  user: FmzAdminKycUser;
  releasing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function FmzAdminKycReleaseModal({ user, releasing, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !releasing) onCancel(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [releasing, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0D1321]/45 p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-modal-title"
    >
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(13,19,33,0.22)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EAF0] px-6 py-5">
          <h2
            id="release-modal-title"
            className="font-sans text-[16px] font-bold text-[#0D1321]"
          >
            Liberar nova verificação
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border-[1.5px] border-[#E8EAF0] text-[#9AA3B0] transition hover:bg-[#F7F8FA] hover:text-[#0D1321]"
            aria-label="Fechar"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#F5F3FF]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#7C3AED" strokeWidth="1.8" />
              <path d="M8 12l3 3 5-5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mb-1 text-center font-sans text-[15px] font-bold text-[#0D1321]">
            Liberar nova verificação?
          </p>
          <p className="mb-4 text-center text-[12.5px] leading-6 text-[#5A6478]">
            O usuário poderá iniciar uma nova sessão de verificação de identidade via Didit.
          </p>

          <div className="rounded-[10px] border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] px-4 py-3">
            <div className="flex items-center justify-between py-2 text-[12.5px]">
              <span className="text-[#5A6478]">Usuário</span>
              <span className="font-semibold text-[#0D1321]">{user.name}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#E8EAF0] py-2 text-[12.5px]">
              <span className="text-[#5A6478]">Status atual</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F5C4BF] bg-[#FEF5F4] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#D94F3D]">
                Negado
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#E8EAF0] py-2 text-[12.5px]">
              <span className="text-[#5A6478]">Novo status</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#7C3AED]">
                Liberado p/ nova tentativa
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#E8EAF0] bg-[#F7F8FA] px-6 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={releasing}
            className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-5 py-2.5 text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={releasing}
            className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#DDD6FE] bg-[#F5F3FF] px-5 py-2.5 text-[12.5px] font-semibold text-[#7C3AED] transition hover:border-[#7C3AED] hover:bg-[#EDE9FE] disabled:opacity-60"
          >
            {releasing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Liberar nova tentativa
          </button>
        </div>
      </div>
    </div>
  );
}
