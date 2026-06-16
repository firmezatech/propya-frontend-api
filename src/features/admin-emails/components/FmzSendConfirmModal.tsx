'use client';

import { CheckCircle2, Loader2, Mail, X } from 'lucide-react';
import type { FmzAdminEmailRecipient, FmzEmailTemplateMeta } from '../domain/fmz-admin-emails.types';

type Props = {
  template: FmzEmailTemplateMeta;
  recipients: FmzAdminEmailRecipient[];
  subject: string;
  isSending: boolean;
  sendError: string | null;
  sendSuccess: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function FmzSendConfirmModal({
  template,
  recipients,
  subject,
  isSending,
  sendError,
  sendSuccess,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[300] grid place-items-center bg-[#0D1321]/30 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md rounded-2xl border border-fmz-border-light bg-fmz-card p-6 shadow-xl">

        <button
          type="button"
          onClick={onClose}
          disabled={isSending}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-lg p-1 text-fmz-text-hint transition-colors hover:text-fmz-text-primary disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        {sendSuccess ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-fmz-success" />
            <div>
              <p className="text-base font-semibold text-fmz-text-primary">E-mails enviados!</p>
              <p className="mt-1 text-sm text-fmz-text-muted">
                {recipients.length === 1
                  ? '1 destinatário recebeu o e-mail.'
                  : `${recipients.length} destinatários receberam o e-mail.`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-fmz-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#162030]"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-fmz-text-muted" />
              <div>
                <h2 className="text-base font-semibold text-fmz-text-primary">Confirmar envio</h2>
                <p className="mt-0.5 text-sm text-fmz-text-muted">Revise os dados antes de enviar.</p>
              </div>
            </div>

            <dl className="mb-5 flex flex-col gap-3 rounded-xl border border-fmz-border-light bg-fmz-page p-4 text-sm">
              <div>
                <dt className="text-xs text-fmz-text-hint">Template</dt>
                <dd className="mt-0.5 font-medium text-fmz-text-primary">{template.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-fmz-text-hint">Assunto</dt>
                <dd className="mt-0.5 font-medium text-fmz-text-primary">{subject || '(sem assunto)'}</dd>
              </div>
              <div>
                <dt className="text-xs text-fmz-text-hint">Destinatários</dt>
                <dd className="mt-0.5 font-medium text-fmz-text-primary">
                  {recipients.length === 1
                    ? `1 pessoa (${recipients[0]!.email})`
                    : `${recipients.length} pessoas`}
                </dd>
              </div>
            </dl>

            {sendError && (
              <p className="mb-4 rounded-xl border border-fmz-error-border bg-fmz-error-bg px-4 py-3 text-sm text-fmz-error">
                {sendError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="flex-1 rounded-xl border border-fmz-border-light bg-fmz-page py-2.5 text-sm font-medium text-fmz-text-muted transition-colors hover:bg-fmz-border-light disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-fmz-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#162030] disabled:opacity-50"
              >
                {isSending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Enviando…</>
                ) : (
                  'Enviar e-mails'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
