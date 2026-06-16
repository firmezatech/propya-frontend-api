export type FmzEmailTemplateField = {
  id: string;
  label: string;
  type: 'text' | 'url';
  placeholder: string;
  required: boolean;
};

export type FmzEmailTemplateMeta = {
  id: string;
  name: string;
  category: string;
  badge: string;
  subject: string;
  fields: FmzEmailTemplateField[];
};

export type FmzAdminEmailRecipient = {
  id: string;
  name: string;
  email: string;
};

// ─── Personalized vs. generic templates (D-5) ──────────────────────────────────
// "Personalized" templates carry per-person data (financial values, property data, or an
// individual action link) — sending one HTML to a batch would apply one person's data to
// everyone, so the composer restricts selection to exactly 1 recipient. "Generic" templates
// only vary by name (or not at all) — multi-recipient `to[]` with one shared HTML is safe.

export const FMZ_PERSONALIZED_EMAIL_TEMPLATE_IDS = [
  'boleto',
  'tokens-adquiridos',
  'tokens-vendidos',
  'extorno',
  'aluguel-caiu',
  'invite',
  'reset-senha',
] as const;

export const isPersonalizedEmailTemplate = (templateId: string): boolean =>
  (FMZ_PERSONALIZED_EMAIL_TEMPLATE_IDS as readonly string[]).includes(templateId);

export type FmzAdminEmailComposerSection = 'template' | 'recipients' | 'fields';

export type FmzAdminEmailComposerState = {
  templates: FmzEmailTemplateMeta[];
  templatesLoading: boolean;
  selectedTemplate: FmzEmailTemplateMeta | null;
  recipients: FmzAdminEmailRecipient[];
  vars: Record<string, string>;
  subject: string;
  previewHtml: string;
  previewLoading: boolean;
  isSending: boolean;
  sendError: string | null;
  sendSuccess: boolean;
  showConfirmModal: boolean;
  openSection: FmzAdminEmailComposerSection | null;
};

export type FmzAdminEmailComposerActions = {
  selectTemplate: (template: FmzEmailTemplateMeta) => void;
  setRecipients: (recipients: FmzAdminEmailRecipient[]) => void;
  setVar: (fieldId: string, value: string) => void;
  setSubject: (value: string) => void;
  setOpenSection: (section: FmzAdminEmailComposerSection | null) => void;
  openSendModal: () => void;
  closeSendModal: () => void;
  send: () => Promise<void>;
  reset: () => void;
};

export type FmzAdminEmailComposerHook = FmzAdminEmailComposerState & FmzAdminEmailComposerActions;
