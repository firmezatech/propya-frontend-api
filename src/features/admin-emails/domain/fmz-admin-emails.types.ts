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
  refreshPreview: () => void;
  setOpenSection: (section: FmzAdminEmailComposerSection | null) => void;
  openSendModal: () => void;
  closeSendModal: () => void;
  send: () => Promise<void>;
  reset: () => void;
};

export type FmzAdminEmailComposerHook = FmzAdminEmailComposerState & FmzAdminEmailComposerActions;
