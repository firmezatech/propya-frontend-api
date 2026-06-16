'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchEmailTemplates,
  fetchTemplatePreview,
  sendAdminEmail,
} from '../services/fmz-admin-email-api';
import type {
  FmzAdminEmailComposerHook,
  FmzAdminEmailComposerSection,
  FmzAdminEmailRecipient,
  FmzEmailTemplateMeta,
} from '../domain/fmz-admin-emails.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Erro inesperado. Tente novamente.';
}

function allRequiredVarsFilled(template: FmzEmailTemplateMeta, vars: Record<string, string>): boolean {
  return template.fields.every((f) => !f.required || (vars[f.id] ?? '').trim() !== '');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFmzAdminEmailComposer(): FmzAdminEmailComposerHook {
  const [templates, setTemplates]               = useState<FmzEmailTemplateMeta[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FmzEmailTemplateMeta | null>(null);
  const [recipients, setRecipientsState]        = useState<FmzAdminEmailRecipient[]>([]);
  const [vars, setVarsState]                    = useState<Record<string, string>>({});
  const [subject, setSubjectState]              = useState('');
  const [previewHtml, setPreviewHtml]           = useState('');
  const [previewLoading, setPreviewLoading]     = useState(false);
  const [isSending, setIsSending]               = useState(false);
  const [sendError, setSendError]               = useState<string | null>(null);
  const [sendSuccess, setSendSuccess]           = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [openSection, setOpenSectionState]      = useState<FmzAdminEmailComposerSection | null>('template');

  const previewGenerationRef = useRef(0);
  const previewDebounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load templates on mount ─────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setTemplatesLoading(true);
    fetchEmailTemplates()
      .then((list) => { if (!cancelled) setTemplates(list); })
      .catch(() => { if (!cancelled) setTemplates([]); })
      .finally(() => { if (!cancelled) setTemplatesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Auto-preview with 280 ms debounce ──────────────────────────────────────

  useEffect(() => {
    if (!selectedTemplate) return;
    if (!allRequiredVarsFilled(selectedTemplate, vars)) return;

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);

    previewDebounceRef.current = setTimeout(() => {
      const generation = ++previewGenerationRef.current;
      setPreviewLoading(true);
      fetchTemplatePreview(selectedTemplate.id, vars)
        .then((html) => {
          if (generation !== previewGenerationRef.current) return;
          setPreviewHtml(html);
        })
        .catch(() => {
          if (generation !== previewGenerationRef.current) return;
          setPreviewHtml('');
        })
        .finally(() => {
          if (generation === previewGenerationRef.current) setPreviewLoading(false);
        });
    }, 280);

    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [selectedTemplate, vars]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const selectTemplate = useCallback((template: FmzEmailTemplateMeta) => {
    ++previewGenerationRef.current;
    setSelectedTemplate(template);
    setVarsState({});
    setSubjectState(template.subject);
    setPreviewHtml('');
    setPreviewLoading(false);
    setOpenSectionState('recipients');
  }, []);

  const setRecipients = useCallback((list: FmzAdminEmailRecipient[]) => {
    setRecipientsState(list);
  }, []);

  const setVar = useCallback((fieldId: string, value: string) => {
    setVarsState((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const setSubject = useCallback((value: string) => {
    setSubjectState(value);
  }, []);

  const setOpenSection = useCallback((section: FmzAdminEmailComposerSection | null) => {
    setOpenSectionState(section);
  }, []);

  const openSendModal = useCallback(() => {
    setSendError(null);
    setSendSuccess(false);
    setShowConfirmModal(true);
  }, []);

  const closeSendModal = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const send = useCallback(async () => {
    if (!selectedTemplate || recipients.length === 0) return;

    setIsSending(true);
    setSendError(null);
    try {
      const html = await fetchTemplatePreview(selectedTemplate.id, vars);
      await sendAdminEmail({
        to: recipients.map((r) => r.email),
        subject,
        html,
        templateKey: selectedTemplate.id,
      });
      setSendSuccess(true);
      setShowConfirmModal(false);
    } catch (err) {
      setSendError(extractErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }, [selectedTemplate, recipients, vars, subject]);

  const reset = useCallback(() => {
    ++previewGenerationRef.current;
    setSelectedTemplate(null);
    setRecipientsState([]);
    setVarsState({});
    setSubjectState('');
    setPreviewHtml('');
    setPreviewLoading(false);
    setIsSending(false);
    setSendError(null);
    setSendSuccess(false);
    setShowConfirmModal(false);
    setOpenSectionState('template');
  }, []);

  return {
    templates,
    templatesLoading,
    selectedTemplate,
    recipients,
    vars,
    subject,
    previewHtml,
    previewLoading,
    isSending,
    sendError,
    sendSuccess,
    showConfirmModal,
    openSection,
    selectTemplate,
    setRecipients,
    setVar,
    setSubject,
    setOpenSection,
    openSendModal,
    closeSendModal,
    send,
    reset,
  };
}
