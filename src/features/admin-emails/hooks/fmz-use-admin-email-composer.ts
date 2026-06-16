'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInvite,
  fetchEmailTemplates,
  fetchPasswordResetLink,
  fetchTemplatePreview,
  sendAdminEmail,
} from '../services/fmz-admin-email-api';
import { getPlatformInfo } from '../../tenant-portal/services/fmz-platform-info-api';
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

// D-12: brand identity vars are injected by the composer, never typed by the admin —
// they don't exist in any meta.json and never appear in FmzFieldsCustomizer.
function withPlatformVars(
  vars: Record<string, string>,
  platformVars: Record<string, string>,
): Record<string, string> {
  return { ...vars, ...platformVars };
}

// D-13: only real platform users (not externally-typed emails) have a password reset link.
function isRealUserRecipient(recipient: FmzAdminEmailRecipient): boolean {
  return !recipient.id.startsWith('ext:');
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
  const platformVarsRef      = useRef<Record<string, string>>({});
  const resetLinkGenerationRef = useRef(0);
  const inviteCreationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Load platform identity vars once per composer session (D-12) ───────────
  // Cached in a ref (not state) — these vars never trigger a re-render on their own;
  // they're merged into `vars` only at the moment of preview/send.

  useEffect(() => {
    let cancelled = false;
    getPlatformInfo().then((info) => {
      if (cancelled) return;
      platformVarsRef.current = {
        platform_company: info.company_legal_name ?? '',
        platform_address: info.company_address ?? '',
        platform_cnpj:     info.company_cnpj ?? '',
      };
    });
    return () => { cancelled = true; };
  }, []);

  // ── Auto-generate reset-password link for reset-senha (D-13) ───────────────
  // Single real-user recipient + reset-senha template → fetch a fresh token-backed
  // link and populate vars.ctaUrl (read-only from the admin's point of view).
  // Re-runs whenever the selected recipient or template changes.

  useEffect(() => {
    const recipient = recipients[0];
    const isResetSenha = selectedTemplate?.id === 'reset-senha';

    if (!isResetSenha || recipients.length !== 1 || !recipient || !isRealUserRecipient(recipient)) {
      return;
    }

    const generation = ++resetLinkGenerationRef.current;
    fetchPasswordResetLink(recipient.id)
      .then(({ resetUrl }) => {
        if (generation !== resetLinkGenerationRef.current) return;
        setVarsState((prev) => ({ ...prev, ctaUrl: resetUrl }));
      })
      .catch(() => {
        if (generation !== resetLinkGenerationRef.current) return;
        setVarsState((prev) => ({ ...prev, ctaUrl: '' }));
      });
  }, [selectedTemplate, recipients]);

  // ── Auto-generate tenant invite link for invite (D-14), 280 ms debounced ───
  // Single recipient + invite template → create the invite (any email is valid here,
  // unlike reset-senha which needs a real platform userId) and populate vars.ctaUrl.
  // Reuses resetLinkGenerationRef as the staleness guard: only one of reset-senha/invite
  // is ever the active template at a time, so a single ref is sufficient. Debounced (like
  // the preview effect below) because this call creates a new DB row per request — without
  // debouncing, every keystroke in property/address/rent/owner/expiry would insert a row.

  useEffect(() => {
    const recipient = recipients[0];
    const isInvite = selectedTemplate?.id === 'invite';

    if (inviteCreationDebounceRef.current) clearTimeout(inviteCreationDebounceRef.current);
    if (!isInvite || recipients.length !== 1 || !recipient) return;

    inviteCreationDebounceRef.current = setTimeout(() => {
      const generation = ++resetLinkGenerationRef.current;
      createInvite({
        email: recipient.email,
        propertySnapshot: {
          property: vars.property ?? '',
          address:  vars.address ?? '',
          rent:     vars.rent ?? '',
          owner:    vars.owner ?? '',
          expiry:   vars.expiry ?? '',
        },
      })
        .then(({ inviteUrl }) => {
          if (generation !== resetLinkGenerationRef.current) return;
          setVarsState((prev) => ({ ...prev, ctaUrl: inviteUrl }));
        })
        .catch(() => {
          if (generation !== resetLinkGenerationRef.current) return;
          setVarsState((prev) => ({ ...prev, ctaUrl: '' }));
        });
    }, 280);

    return () => {
      if (inviteCreationDebounceRef.current) clearTimeout(inviteCreationDebounceRef.current);
    };
    // Only re-run when the recipient/template changes, or when the property-snapshot
    // fields themselves change — not on every `vars` update (e.g. typing in `name`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, recipients, vars.property, vars.address, vars.rent, vars.owner, vars.expiry]);

  // ── Auto-preview with 280 ms debounce ──────────────────────────────────────

  useEffect(() => {
    if (!selectedTemplate) return;
    if (!allRequiredVarsFilled(selectedTemplate, vars)) return;

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);

    previewDebounceRef.current = setTimeout(() => {
      const generation = ++previewGenerationRef.current;
      setPreviewLoading(true);
      fetchTemplatePreview(selectedTemplate.id, withPlatformVars(vars, platformVarsRef.current))
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
    ++resetLinkGenerationRef.current;
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
      const finalVars = withPlatformVars(vars, platformVarsRef.current);
      const html = await fetchTemplatePreview(selectedTemplate.id, finalVars);
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
    ++resetLinkGenerationRef.current;
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
