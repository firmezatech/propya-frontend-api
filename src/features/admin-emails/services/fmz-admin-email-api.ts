import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { FmzEmailTemplateMeta } from '../domain/fmz-admin-emails.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v.trim() : fallback;

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const recordOf = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

// ─── Template list (Next.js API route) ───────────────────────────────────────

const normalizeTemplateField = (raw: unknown) => {
  const f = recordOf(raw);
  return {
    id:          str(f.id),
    label:       str(f.label),
    type:        (str(f.type) === 'url' ? 'url' : 'text') as 'text' | 'url',
    placeholder: str(f.placeholder),
    required:    f.required === true,
  };
};

const normalizeTemplateMeta = (raw: unknown): FmzEmailTemplateMeta | null => {
  const t = recordOf(raw);
  const id = str(t.id);
  if (!id) return null;
  return {
    id,
    name:     str(t.name, id),
    category: str(t.category, 'Geral'),
    badge:    str(t.badge, 'transacional'),
    subject:  str(t.subject),
    fields:   arr(t.fields).map(normalizeTemplateField),
  };
};

export const fetchEmailTemplates = async (): Promise<FmzEmailTemplateMeta[]> => {
  const res = await fetch('/api/admin/email-templates', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
  const body = recordOf(await res.json());
  return arr<unknown>(body.templates)
    .map(normalizeTemplateMeta)
    .filter((t): t is FmzEmailTemplateMeta => t !== null);
};

// ─── Preview (Next.js API route) ─────────────────────────────────────────────

export const fetchTemplatePreview = async (
  templateId: string,
  vars: Record<string, string>,
): Promise<string> => {
  const res = await fetch(`/api/admin/email-templates/${encodeURIComponent(templateId)}/preview`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(vars),
    cache:   'no-store',
  });
  if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
  const body = recordOf(await res.json());
  return str(body.html);
};

// ─── Send email (backend API) ─────────────────────────────────────────────────

export type FmzSendAdminEmailPayload = {
  to: string[];
  subject: string;
  html: string;
  templateKey: string;
};

export const sendAdminEmail = async (payload: FmzSendAdminEmailPayload): Promise<void> => {
  await firmezaApiClient.post('/admin/emails/send', payload);
};

// ─── Password reset link (D-13 / AE-12, backend API) ─────────────────────────

export type FmzPasswordResetLink = {
  resetUrl: string;
  expiresAt: string;
};

export const fetchPasswordResetLink = async (userId: string): Promise<FmzPasswordResetLink> => {
  const { data } = await firmezaApiClient.post(
    `/admin/users/${encodeURIComponent(userId)}/password-reset-link`,
  );
  const body = recordOf(data);
  return {
    resetUrl:  str(body.resetUrl),
    expiresAt: str(body.expiresAt),
  };
};

// ─── Tenant invites (D-14 / AE-13, backend API) ──────────────────────────────

export type FmzCreateInvitePayload = {
  email: string;
  propertySnapshot: Record<string, string>;
};

export type FmzInviteLink = {
  inviteId: string;
  inviteUrl: string;
  expiresAt: string;
};

export const createInvite = async (payload: FmzCreateInvitePayload): Promise<FmzInviteLink> => {
  const { data } = await firmezaApiClient.post('/admin/invites', payload);
  const body = recordOf(data);
  return {
    inviteId:  str(body.inviteId),
    inviteUrl: str(body.inviteUrl),
    expiresAt: str(body.expiresAt),
  };
};

export type FmzTenantInvite = {
  id: string;
  invitedEmail: string;
  propertySnapshot: Record<string, string>;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
};

export type FmzFetchInvitesFilters = {
  page?: number;
  limit?: number;
};

const normalizeTenantInvite = (raw: unknown): FmzTenantInvite => {
  const r = recordOf(raw);
  const status = str(r.status, 'pending');
  return {
    id:               str(r.id),
    invitedEmail:     str(r.invited_email),
    propertySnapshot: recordOf(r.property_snapshot) as Record<string, string>,
    status:           status === 'accepted' || status === 'expired' ? status : 'pending',
    createdAt:        str(r.created_at),
    expiresAt:        str(r.expires_at),
    acceptedAt:       typeof r.accepted_at === 'string' ? r.accepted_at : null,
  };
};

export const fetchInvites = async (
  filters: FmzFetchInvitesFilters = {},
): Promise<{ invites: FmzTenantInvite[]; total: number }> => {
  const params = new URLSearchParams();
  if (filters.page  !== undefined) params.set('page',  String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  const { data } = await firmezaApiClient.get(`/admin/invites?${params.toString()}`);
  const body = recordOf(data);
  return {
    invites: arr<unknown>(body.invites).map(normalizeTenantInvite),
    total:   typeof body.total === 'number' ? body.total : 0,
  };
};

// ─── Email logs (backend API) ─────────────────────────────────────────────────

export type FmzEmailLog = {
  id: string;
  templateKey: string;
  subject: string;
  toEmails: string[];
  status: string;
  emailSource: string;
  jobName: string | null;
  platformName: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
};

export type FmzEmailLogsFilters = {
  page?: number;
  limit?: number;
  templateKey?: string;
  status?: string;
  source?: string;
  jobName?: string;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
};

const normalizeEmailLog = (raw: unknown): FmzEmailLog => {
  const r = recordOf(raw);
  return {
    id:           str(r.id),
    templateKey:  str(r.template_key),
    subject:      str(r.subject),
    toEmails:     arr<string>(r.to_emails),
    status:       str(r.status, 'unknown'),
    emailSource:  str(r.email_source, 'system'),
    jobName:      typeof r.job_name === 'string' ? r.job_name : null,
    platformName: str(r.platform_name, 'propya-backend-api'),
    sentAt:       typeof r.sent_at === 'string' ? r.sent_at : null,
    openedAt:     typeof r.opened_at === 'string' ? r.opened_at : null,
    clickedAt:    typeof r.clicked_at === 'string' ? r.clicked_at : null,
    createdAt:    str(r.created_at),
  };
};

export const fetchEmailLogs = async (
  filters: FmzEmailLogsFilters = {},
): Promise<{ logs: FmzEmailLog[]; total: number; totalPages: number }> => {
  const params = new URLSearchParams();
  if (filters.page        !== undefined) params.set('page',        String(filters.page));
  if (filters.limit       !== undefined) params.set('limit',       String(filters.limit));
  if (filters.templateKey !== undefined) params.set('templateKey', filters.templateKey);
  if (filters.status      !== undefined) params.set('status',      filters.status);
  if (filters.source      !== undefined) params.set('source',      filters.source);
  if (filters.jobName     !== undefined) params.set('jobName',     filters.jobName);
  if (filters.platform    !== undefined) params.set('platform',    filters.platform);
  if (filters.dateFrom    !== undefined) params.set('dateFrom',    filters.dateFrom);
  if (filters.dateTo      !== undefined) params.set('dateTo',      filters.dateTo);

  const { data } = await firmezaApiClient.get(`/admin/emails/logs?${params.toString()}`);
  const d = recordOf(data);
  return {
    logs:       arr<unknown>(d.logs).map(normalizeEmailLog),
    total:      typeof d.total === 'number' ? d.total : 0,
    totalPages: typeof d.totalPages === 'number' ? d.totalPages : 0,
  };
};
