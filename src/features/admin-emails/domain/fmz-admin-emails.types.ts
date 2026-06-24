export type FmzEmailTemplateField = {
  id: string;
  label: string;
  type: 'text' | 'url' | 'date' | 'property' | 'textarea';
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

// ─── Savable default content (D-15) ─────────────────────────────────────────────
// Admin-editable fields whose last value is remembered as the default for the NEXT
// time the template is composed. 'url' fields are platform-wide CTA links (the
// registration page, the KYC page…); 'text' fields are the hero title/body copy and
// the subject — these have no per-recipient data, so every template gets them.
//
// Link ('url') fields are deliberately limited: reset-senha, invite, boleto and
// verificar-email also have a `ctaUrl`, but theirs carries a one-time token or a
// per-invoice URL — reusing it would hand one person's access link to the next
// recipient, so it's absent here on purpose. Their hero/subject text has no such
// problem and IS included. Mirrors SAVABLE_FIELDS in propya-backend-api's
// emailTemplateFieldOverrides.service.js — keep both in sync.

const FMZ_SAVABLE_EMAIL_TEMPLATE_FIELDS: Record<string, Record<string, 'url' | 'text'>> = {
  'aluguel-caiu':         { ctaUrl: 'url', heroTitle: 'text', heroBody: 'text', subject: 'text' },
  'boas-vindas':          { ctaUrl: 'url', heroTitle: 'text', heroBody: 'text', subject: 'text' },
  boleto:                 { heroTitle: 'text', heroBody: 'text', subject: 'text' },
  'convite-investidor':   { ctaUrl: 'url', propertiesUrl: 'url', heroTitle: 'text', heroBody: 'text', subject: 'text' },
  extorno:                { ctaUrl: 'url', heroTitle: 'text', heroBody: 'text', subject: 'text' },
  invite:                 { heroTitle: 'text', heroBody: 'text', subject: 'text' },
  'reset-senha':          { heroTitle: 'text', heroBody: 'text', subject: 'text' },
  'tokens-adquiridos':    { ctaUrl: 'url', heroTitle: 'text', heroBody: 'text', subject: 'text' },
  'tokens-vendidos':      { ctaUrl: 'url', heroTitle: 'text', heroBody: 'text', subject: 'text' },
  'verificar-email':      { heroTitle: 'text', heroBody: 'text', subject: 'text' },
  'verificar-identidade': { ctaUrl: 'url', heroTitle: 'text', heroBody: 'text', subject: 'text' },
};

// Returns 'url' | 'text' | null — null means the field can't have a saved default.
export const getSavableEmailFieldKind = (templateId: string, fieldId: string): 'url' | 'text' | null =>
  FMZ_SAVABLE_EMAIL_TEMPLATE_FIELDS[templateId]?.[fieldId] ?? null;

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
  commitFieldOverride: (fieldId: string, value: string) => void;
  setSubject: (value: string) => void;
  setOpenSection: (section: FmzAdminEmailComposerSection | null) => void;
  openSendModal: () => void;
  closeSendModal: () => void;
  send: () => Promise<void>;
  reset: () => void;
};

export type FmzAdminEmailComposerHook = FmzAdminEmailComposerState & FmzAdminEmailComposerActions;
