'use client';

import { ChevronDown, Send } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { useFmzAdminEmailComposer } from '../hooks/fmz-use-admin-email-composer';
import { FmzTemplateSelector } from './FmzTemplateSelector';
import { FmzRecipientSelector } from './FmzRecipientSelector';
import { FmzFieldsCustomizer } from './FmzFieldsCustomizer';
import { FmzEmailPreviewPanel } from './FmzEmailPreviewPanel';
import { FmzSendConfirmModal } from './FmzSendConfirmModal';
import type { FmzAdminEmailComposerSection } from '../domain/fmz-admin-emails.types';

// ─── Accordion section wrapper ────────────────────────────────────────────────

type AccordionSectionProps = {
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function AccordionSection({ title, summary, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <span className="text-sm font-semibold text-fmz-neutral-100">{title}</span>
          {summary && !isOpen && (
            <span className="ml-2 text-xs text-fmz-neutral-400">{summary}</span>
          )}
        </div>
        <ChevronDown
          className={fmzCn(
            'h-4 w-4 shrink-0 text-fmz-neutral-400 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t border-white/10 px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FmzAdminEmailComposerPage() {
  const hook = useFmzAdminEmailComposer();

  const canSend =
    hook.selectedTemplate !== null &&
    hook.recipients.length > 0 &&
    hook.subject.trim() !== '';

  const toggleSection = (section: FmzAdminEmailComposerSection) => {
    hook.setOpenSection(hook.openSection === section ? null : section);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start">
      {/* ── Left column: accordion ── */}
      <div className="flex w-full flex-col gap-4 lg:max-w-lg">
        <h1 className="text-xl font-bold text-fmz-neutral-100">Enviar e-mail</h1>

        {/* Step 1 — Template */}
        <AccordionSection
          title="1. Template"
          summary={hook.selectedTemplate?.name}
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
          title="2. Destinatários"
          summary={
            hook.recipients.length > 0
              ? `${hook.recipients.length} selecionado${hook.recipients.length > 1 ? 's' : ''}`
              : undefined
          }
          isOpen={hook.openSection === 'recipients'}
          onToggle={() => toggleSection('recipients')}
        >
          <FmzRecipientSelector
            selected={hook.recipients}
            onSelect={hook.setRecipients}
          />
        </AccordionSection>

        {/* Step 3 — Fields */}
        {hook.selectedTemplate && (
          <AccordionSection
            title="3. Conteúdo"
            isOpen={hook.openSection === 'fields'}
            onToggle={() => toggleSection('fields')}
          >
            <FmzFieldsCustomizer
              template={hook.selectedTemplate}
              subject={hook.subject}
              vars={hook.vars}
              previewLoading={hook.previewLoading}
              onSubjectChange={hook.setSubject}
              onVarChange={hook.setVar}
              onRefreshPreview={hook.refreshPreview}
            />
          </AccordionSection>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={hook.openSendModal}
          disabled={!canSend}
          className="flex items-center justify-center gap-2 rounded-2xl bg-fmz-teal py-3 text-sm font-semibold text-fmz-navy transition-colors hover:bg-fmz-teal/90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Enviar e-mail
        </button>
      </div>

      {/* ── Right column: preview ── */}
      <div className="w-full lg:flex-1">
        <FmzEmailPreviewPanel
          html={hook.previewHtml}
          loading={hook.previewLoading}
        />
      </div>

      {/* ── Confirm modal ── */}
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
