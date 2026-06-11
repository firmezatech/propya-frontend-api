'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { resolveKycDisplayStatus } from '../domain';
import type { FmzAdminKycUser, FmzKycDisplayStatus, FmzKycDocumentType } from '../domain';

// ─── Label maps ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<FmzKycDisplayStatus, string> = {
  pending: 'Aguardando',
  in_review: 'Em análise',
  verified: 'Aprovado',
  declined: 'Negado',
  released: 'Liberado p/ nova tentativa',
};

const STATUS_CLASSES: Record<FmzKycDisplayStatus, string> = {
  pending: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
  in_review: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]',
  verified: 'border-[#A7F3D0] bg-[#F0FAF5] text-[#1A8C5B]',
  declined: 'border-[#F5C4BF] bg-[#FEF5F4] text-[#D94F3D]',
  released: 'border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED]',
};

const DOCUMENT_LABEL: Record<FmzKycDocumentType, string> = {
  rg: 'RG',
  cnh: 'CNH',
  passaporte: 'Passaporte',
  selfie: 'Selfie',
  comprovante_residencia: 'Comp. Residência',
  cpf: 'CPF',
};

const DIDIT_WARNING_LABEL: Record<string, string> = {
  DOCUMENT_EXPIRED: 'Documento expirado',
  DOCUMENT_NOT_SUPPORTED: 'Documento não suportado',
  LOW_QUALITY: 'Qualidade baixa',
  FACE_NOT_DETECTED: 'Rosto não detectado',
  LIVENESS_FAILED: 'Prova de vida falhou',
  DATA_MISMATCH: 'Dados inconsistentes',
  UNDERAGE: 'Menor de idade',
  DOCUMENT_TAMPERED: 'Documento adulterado',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return DATE_FORMATTER.format(new Date(iso));
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  user: FmzAdminKycUser;
  releasing: boolean;
  onReleaseClick: (user: FmzAdminKycUser) => void;
};

export function FmzAdminKycUserCard({ user, releasing, onReleaseClick }: Props) {
  const [open, setOpen] = useState(false);
  const displayStatus = resolveKycDisplayStatus(user);

  // 'declined' (not yet released) is the only actionable state
  const canRelease = displayStatus === 'declined';

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-[#E8EAF0] bg-white transition hover:border-[#CBD0DC]">
      {/* ── Collapsed row ─────────────────────────────────────────────────── */}
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE9FE] font-sans text-[12px] font-bold text-[#7C3AED]">
          {getInitials(user.name)}
        </div>

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-[#0D1321]">{user.name}</div>
          <div className="truncate text-[11.5px] text-[#9AA3B0]">{user.email}</div>
        </div>

        {/* Status badge */}
        <span
          className={fmzCn(
            'hidden flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold sm:inline-flex',
            STATUS_CLASSES[displayStatus],
          )}
        >
          {STATUS_LABEL[displayStatus]}
        </span>

        {/* Attempt count */}
        <span className="hidden flex-shrink-0 text-[11.5px] text-[#9AA3B0] md:block">
          {user.attemptCount} tentativa{user.attemptCount !== 1 ? 's' : ''}
        </span>

        {/* Registered at */}
        <span className="hidden flex-shrink-0 text-[11.5px] text-[#9AA3B0] lg:block">
          Cadastro: {formatDate(user.registeredAt)}
        </span>

        {/* Chevron */}
        <span className="ml-1 flex-shrink-0 text-[#9AA3B0]">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* ── Expanded detail ───────────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-[#E8EAF0] px-5 pb-5 pt-4">
          {/* Status badge (mobile) */}
          <div className="mb-4 flex items-center gap-2 sm:hidden">
            <span
              className={fmzCn(
                'rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold',
                STATUS_CLASSES[displayStatus],
              )}
            >
              {STATUS_LABEL[displayStatus]}
            </span>
          </div>

          {/* 3-column grid */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Column 1 — Contact */}
            <div className="space-y-2">
              <DetailRow label="Telefone" value={user.phone ?? '—'} />
              <DetailRow label="Cidade" value={user.city ?? '—'} />
              <DetailRow label="Cadastro" value={formatDate(user.registeredAt)} />
              <DetailRow label="Última sessão" value={formatDate(user.lastSessionAt)} />
              <DetailRow label="Tentativas" value={String(user.attemptCount)} />
            </div>

            {/* Column 2 — Property + Documents */}
            <div className="space-y-2">
              {user.property ? (
                <DetailRow label="Imóvel" value={user.property.address} />
              ) : (
                <DetailRow label="Imóvel" value="Sem imóvel vinculado" />
              )}
              <div>
                <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
                  Documentos enviados
                </div>
                {user.documents.length === 0 ? (
                  <span className="text-[12px] text-[#9AA3B0]">Nenhum</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.documents.map((doc) => (
                      <span
                        key={doc}
                        className="rounded-md border border-[#E8EAF0] bg-[#F7F8FA] px-2 py-0.5 text-[10.5px] font-medium text-[#5A6478]"
                      >
                        {DOCUMENT_LABEL[doc] ?? doc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 3 — Didit decision */}
            <div className="space-y-2">
              {user.diditDecision ? (
                <>
                  <DetailRow label="Decisão Didit" value={user.diditDecision.status} />
                  {user.diditDecision.warnings.length > 0 && (
                    <div>
                      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
                        Alertas
                      </div>
                      <div className="space-y-1">
                        {user.diditDecision.warnings.map((w) => (
                          <div
                            key={w}
                            className="flex items-center gap-1.5 text-[11.5px] text-[#D94F3D]"
                          >
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
                              <path d="M6 4v2.5M6 8v.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            {DIDIT_WARNING_LABEL[w] ?? w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-[12px] text-[#9AA3B0]">Sem dados Didit</span>
              )}
            </div>
          </div>

          {/* Action area */}
          <div className="flex items-center justify-end border-t border-[#F7F8FA] pt-4">
            {canRelease && (
              <button
                type="button"
                onClick={() => onReleaseClick(user)}
                disabled={releasing}
                className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#DDD6FE] bg-[#F5F3FF] px-4 py-2 text-[12.5px] font-semibold text-[#7C3AED] transition hover:border-[#7C3AED] hover:bg-[#EDE9FE] disabled:opacity-60"
              >
                {releasing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                Liberar para nova tentativa
              </button>
            )}
            {displayStatus === 'released' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-[11.5px] font-semibold text-[#7C3AED]">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Aguardando nova tentativa
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
        {label}
      </div>
      <div className="text-[12.5px] text-[#0D1321]">{value}</div>
    </div>
  );
}
