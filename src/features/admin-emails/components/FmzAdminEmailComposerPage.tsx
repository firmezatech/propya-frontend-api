'use client';

import { ChevronDown, Send, UserRound } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { useFmzAdminEmailComposer } from '../hooks/fmz-use-admin-email-composer';
import { FmzTemplateSelector } from './FmzTemplateSelector';
import { FmzRecipientSelector } from './FmzRecipientSelector';
import { FmzFieldsCustomizer } from './FmzFieldsCustomizer';
import { FmzEmailPreviewPanel } from './FmzEmailPreviewPanel';
import { FmzSendConfirmModal } from './FmzSendConfirmModal';
import { isPersonalizedEmailTemplate, type FmzAdminEmailComposerSection } from '../domain/fmz-admin-emails.types';

// ─── Accordion section ────────────────────────────────────────────────────────

type AccordionSectionProps = {
  step: number;
  title: string;
  chip?: string;
  isDone: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function AccordionSection({ step, title, chip, isDone, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="border-b border-fmz-border-light last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={fmzCn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
            isDone
              ? 'bg-fmz-success text-white'
              : 'bg-fmz-border-light text-fmz-text-hint',
          )}
        >
          {isDone ? '✓' : step}
        </span>

        <span className="min-w-0 flex-1 text-sm font-semibold text-fmz-text-primary">
          {title}
        </span>

        {chip && !isOpen && (
          <span className="shrink-0 rounded-full bg-[#F5C842]/20 px-2 py-0.5 text-[11px] font-medium text-fmz-navy">
            {chip}
          </span>
        )}

        <ChevronDown
          className={fmzCn(
            'h-4 w-4 shrink-0 text-fmz-text-hint transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FmzAdminEmailComposerPage() {
  const hook = useFmzAdminEmailComposer();

  const allRequiredFilled = hook.selectedTemplate
    ? hook.selectedTemplate.fields
        .filter((f) => f.required)
        .every((f) => (hook.vars[f.id] ?? '').trim() !== '')
    : false;

  const canSend =
    hook.selectedTemplate !== null &&
    hook.recipients.length > 0 &&
    hook.subject.trim() !== '';

  const toggleSection = (section: FmzAdminEmailComposerSection) => {
    hook.setOpenSection(hook.openSection === section ? null : section);
  };

  const recipientLabel =
    hook.recipients.length === 0
      ? 'Nenhum destinatário'
      : hook.recipients.length === 1
        ? '1 destinatário'
        : `${hook.recipients.length} destinatários`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-fmz-text-primary">Enviar e-mail</h1>
        <p className="mt-1 text-sm text-fmz-text-muted">
          Selecione um template, os destinatários e personalize o conteúdo.
        </p>
      </div>

      {/* Composer grid */}
      <div className="grid min-h-0 flex-1 grid-cols-[380px_1fr] overflow-hidden rounded-xl border border-fmz-border-light bg-fmz-card shadow-sm">

        {/* ── Left panel ── */}
        <div className="flex min-h-0 flex-col border-r border-fmz-border-light">

          {/* Accordion scroll area */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Step 1 — Template */}
            <AccordionSection
              step={1}
              title="Template"
              chip={hook.selectedTemplate?.name}
              isDone={hook.selectedTemplate !== null}
              isOpen={hook.openSection === 'template'}
              onToggle={() => toggleSection('template')}
            >
              <FmzTemplateSelector
                templates={hook.templates}
                loading={hook.templatesLoading}
                selected={hook.selectedTemplate}
                onSelect={hook.selectTemplate}
              />
            </AccordionSection>

            {/* Step 2 — Recipients */}
            <AccordionSection
              step={2}
              title="Destinatários"
              chip={
                hook.recipients.length > 0
                  ? `${hook.recipients.length} selecionado${hook.recipients.length > 1 ? 's' : ''}`
                  : undefined
              }
              isDone={hook.recipients.length > 0}
              isOpen={hook.openSection === 'recipients'}
              onToggle={() => toggleSection('recipients')}
            >
              <FmzRecipientSelector
                selected={hook.recipients}
                onSelect={hook.setRecipients}
                maxRecipients={
                  hook.selectedTemplate && isPersonalizedEmailTemplate(hook.selectedTemplate.id)
                    ? 1
                    : undefined
                }
              />
            </AccordionSection>

            {/* Step 3 — Fields (only shown after template is selected) */}
            {hook.selectedTemplate && (
              <AccordionSection
                step={3}
                title="Conteúdo"
                isDone={allRequiredFilled}
                isOpen={hook.openSection === 'fields'}
                onToggle={() => toggleSection('fields')}
              >
                <FmzFieldsCustomizer
                  template={hook.selectedTemplate}
                  vars={hook.vars}
                  previewLoading={hook.previewLoading}
                  onVarChange={hook.setVar}
                />
              </AccordionSection>
            )}
          </div>

          {/* Subject bar */}
          <div className="shrink-0 border-t border-fmz-border-light px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-2">
              <span className="shrink-0 text-xs font-medium text-fmz-text-hint">Assunto:</span>
              <input
                type="text"
                value={hook.subject}
                onChange={(e) => hook.setSubject(e.target.value)}
                placeholder="Assunto do e-mail…"
                className="min-w-0 flex-1 bg-transparent text-sm text-fmz-text-primary placeholder-fmz-text-hint outline-none"
              />
            </div>
          </div>

          {/* Send footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-fmz-border-light bg-fmz-page px-4 py-3">
            <span
              className={fmzCn(
                'flex items-center gap-1.5 text-xs font-medium',
                hook.recipients.length > 0 ? 'text-fmz-navy' : 'text-fmz-text-hint',
              )}
            >
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              {recipientLabel}
            </span>

            <button
              type="button"
              onClick={hook.openSendModal}
              disabled={!canSend}
              className="flex items-center gap-2 rounded-xl bg-fmz-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#162030] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Enviar
            </button>
          </div>
        </div>

        {/* ── Right panel: preview ── */}
        <FmzEmailPreviewPanel
          html={hook.previewHtml}
          loading={hook.previewLoading}
          selectedTemplate={hook.selectedTemplate}
          recipients={hook.recipients}
          subject={hook.subject}
        />
      </div>

      {/* Confirm modal */}
      {hook.showConfirmModal && hook.selectedTemplate && (
        <FmzSendConfirmModal
          template={hook.selectedTemplate}
          recipients={hook.recipients}
          subject={hook.subject}
          isSending={hook.isSending}
          sendError={hook.sendError}
          sendSuccess={hook.sendSuccess}
          onConfirm={hook.send}
          onClose={hook.closeSendModal}
        />
      )}
    </div>
  );
}
