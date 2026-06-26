'use client';

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Home,
  Info,
  KeyRound,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  Users,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzPasswordField, FmzSelect } from '../../../components/design-system';
import { FmzAdminListSkeleton } from '../../../components/layout';
import { formatBirthdateInput } from '../../../lib/fmz-phone-country-format';
import { FmzFormAlert } from '../../api-errors/components';
import { FmzAdminPagination, useFmzAdminPagination, type FmzAdminPaginationMeta } from '../../admin-pagination';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import type { FmzAccessControlRole } from '../../access-control/domain';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  getAdminUserRoles,
  getAdminUsers,
  requestAdminUserPasswordResetLink,
  setAdminUserActiveStatus,
  updateAdminUser,
  updateAdminUserContact,
} from '../services';
import type {
  FmzAdminCoOwnerProperty,
  FmzAdminProperty,
  FmzAdminPropertyRelation,
  FmzAdminTenantContract,
  FmzAdminUser,
  FmzAdminUserDraft,
  FmzAdminUserStatus,
  FmzAdminUserWallet,
} from '../domain';

type Step = 1 | 2 | 3 | 4;
type ViewMode = 'list' | 'edit';
type Toast = { message: string; ok: boolean } | null;
type UserKpis = { total: number; active: number; owners: number; tenants: number };
type ResetLinkState = { resetUrl: string; expiresAt: string | null } | null;

type UserFormState = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  phoneCountry: string;
  password: string;
  status: FmzAdminUserStatus;
  roleKeys: string[];
  address: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  birthdate: string;
};

const EMPTY_FORM: UserFormState = {
  name: '',
  email: '',
  phone: '',
  phoneCountry: 'BR',
  password: '',
  status: 'active',
  roleKeys: [],
  address: '',
  addressLine1: '',
  addressLine2: '',
  district: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'BR',
  birthdate: '',
};

const ROLE_COLORS = ['#E74C3C', '#2980B9', '#8E44AD', '#27AE60', '#7F8C8D', '#F5C842'] as const;
const DEFAULT_ROLES: FmzAccessControlRole[] = [
  { id: 'admin', name: 'admin', description: 'Acesso total ao sistema', color: '#E74C3C', permissionKeys: [], isProtected: true },
  { id: 'tenant', name: 'tenant', description: 'Acesso da inquilina às próprias informações', color: '#27AE60', permissionKeys: [], isProtected: true },
  { id: 'co-owner', name: 'co-owner', description: 'Co-proprietário que recebe rentabilidades e vende porções de tokens', color: '#2980B9', permissionKeys: [], isProtected: true },
];

const normalizeKey = (value: string): string => value.trim().toLowerCase();
const roleKey = (role: FmzAccessControlRole): string => normalizeKey(role.id || role.name);
const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });

const roleLabel = (role: FmzAccessControlRole): string => {
  const key = roleKey(role);
  const labels: Record<string, string> = { admin: 'Administrador', tenant: 'Tenant', 'co-owner': 'Co-owner', co_owner: 'Co-owner', owner: 'Owner' };
  return labels[key] ?? role.name;
};
const roleDescription = (role: FmzAccessControlRole): string => role.description || `${role.permissionKeys.length} permissões vinculadas`;
const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const normalizeBirthdateForForm = (value: string | null | undefined): string => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const brMatch = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return rawValue;

  return formatBirthdateInput(rawValue);
};

const isValidBrazilianBirthdate = (value: string): boolean => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};
const initials = (name: string): string => name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'FT';
const avatarColor = (seed: string): readonly [string, string] => {
  const palette = [
    ['#FDE8D8', '#A04000'], ['#D5F5E3', '#1E8449'], ['#D6EAF8', '#1A5276'], ['#F9F0FF', '#6C3483'],
    ['#FEF9E7', '#9A7D0A'], ['#FDEDEC', '#C0392B'], ['#EAF2FF', '#154360'], ['#FDFEFE', '#616A6B'],
  ] as const;
  const sum = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[sum % palette.length];
};
const valueAsNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return 0;
};
const formatMoney = (value: string | number | null | undefined, currency = 'BRL'): string => {
  const amount = valueAsNumber(value);
  if (currency === 'BRL') return moneyFormatter.format(amount);
  return `${numberFormatter.format(amount)} ${currency}`;
};
const formatTokenAmount = (value: string | number | null | undefined): string => numberFormatter.format(valueAsNumber(value));
const formatPercentage = (value: string | number | null | undefined): string => `${percentFormatter.format(valueAsNumber(value))}%`;
const propertyAddress = (property?: FmzAdminProperty | null): string => {
  if (!property) return 'Endereço não informado';
  return [property.addressLine1, property.addressLine2, property.district, property.city, property.state, property.postalCode].filter(Boolean).join(' · ') || 'Endereço não informado';
};
const monthYearFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const shortMonthYearFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatMonthYear = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : monthYearFormatter.format(date);
};
// Reference uses long month for "mais antigo desde" (ex: "maio/2026") but abbreviated
// month for "inquilino desde" (ex: "mar/2025") — two distinct literal formats, not a typo.
const formatAbbrevMonthYear = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : shortMonthYearFormatter.format(date).replace('.', '');
};
// Exact 4 color pairs cycled by the reference's mock data for hold-row property initials.
const HOLD_INITIALS_PALETTE = [
  { bg: '#EBF0FA', fg: '#3B5EA6' },
  { bg: '#E5F4EB', fg: '#3BA66B' },
  { bg: '#EDE9FA', fg: '#6B4FA6' },
  { bg: '#FAE8E0', fg: '#A6503B' },
] as const;
const propertyInitials = (name: string): string => name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'IM';
const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
};
const formatDateOnly = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date);
};
const calculateAge = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) return null;
  const dob = new Date(`${birthdate}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  return age;
};

const formFromUser = (user: FmzAdminUser): UserFormState => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? '',
  phoneCountry: user.phoneCountry ?? 'BR',
  password: '',
  status: user.status,
  roleKeys: user.roleKeys,
  address: user.address ?? '',
  addressLine1: user.addressLine1 ?? '',
  addressLine2: user.addressLine2 ?? '',
  district: user.district ?? '',
  city: user.city ?? '',
  state: user.state ?? '',
  postalCode: user.postalCode ?? '',
  country: user.country ?? 'BR',
  birthdate: normalizeBirthdateForForm(user.birthdate),
});
const draftFromForm = (form: UserFormState): FmzAdminUserDraft => ({
  id: form.id,
  name: form.name,
  email: form.email,
  phone: form.phone,
  phoneCountry: form.phoneCountry,
  password: form.password,
  status: form.status,
  roleKeys: form.roleKeys,
  address: form.address,
  addressLine1: form.addressLine1,
  addressLine2: form.addressLine2,
  district: form.district,
  city: form.city,
  state: form.state,
  postalCode: form.postalCode,
  country: form.country,
  birthdate: form.birthdate,
});

export function FmzAdminUsersManagement() {
  const [users, setUsers] = useState<FmzAdminUser[]>([]);
  const [roles, setRoles] = useState<FmzAccessControlRole[]>(DEFAULT_ROLES);
  const [view, setView] = useState<ViewMode>('list');
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [selectedUser, setSelectedUser] = useState<FmzAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<FmzNormalizedApiError | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [kpis, setKpis] = useState<UserKpis | null>(null);
  const [drawerUser, setDrawerUser] = useState<FmzAdminUser | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [statusToggling, setStatusToggling] = useState(false);
  const [resetLinkLoading, setResetLinkLoading] = useState(false);
  const [resetLink, setResetLink] = useState<ResetLinkState>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const pagination = useFmzAdminPagination();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      pagination.setSearch(query);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [query, pagination.setSearch]);

  const roleByKey = useMemo(() => new Map(roles.map((role) => [roleKey(role), role])), [roles]);
  const isEditing = Boolean(form.id);

  const notify = useCallback((message: string, ok = true) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      try {
        const nextRoles = await getAdminUserRoles();
        if (!isMounted) return;
        const mergedRoles = new Map(DEFAULT_ROLES.map((role) => [roleKey(role), role]));
        nextRoles.forEach((role) => mergedRoles.set(roleKey(role), role));
        setRoles(Array.from(mergedRoles.values()).filter((role) => roleKey(role) !== 'investor'));
      } catch {
        if (isMounted) setRoles(DEFAULT_ROLES);
      }
    }

    void loadRoles();
    return () => { isMounted = false; };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextUsers = await getAdminUsers({
        ...pagination.request,
        filters: { status: statusFilter || undefined, role: roleFilter || undefined },
      });
      setUsers(nextUsers.items);
      pagination.applyMeta(nextUsers);
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setLoading(false);
    }
  }, [pagination.request, pagination.applyMeta, statusFilter, roleFilter]);

  // useFmzAdminPagination only resets to page 1 on search changes (setSearch) — status/role
  // aren't filters it knows about, so resetting page here on their change is on us.
  const handleStatusFilterChange = (value: string) => { setStatusFilter(value); pagination.setPage(1); };
  const handleRoleFilterChange = (value: string) => { setRoleFilter(value); pagination.setPage(1); };

  useEffect(() => { void loadData(); }, [loadData]);

  // KPI strip (reference: 4 cards) — global totals, independent of the list's own
  // filter/search/page (matching the reference, where these numbers don't move when you
  // filter the table). No dedicated backend aggregate exists yet — each card is a `limit:1`
  // lookup reusing the same filters the list already supports, reading only `pagination.total`.
  // Runs once on mount: depending on `users` re-triggered (and cancelled, via the `isMounted`
  // guard) on every filter/search/page change, so it never had a chance to resolve.
  useEffect(() => {
    let isMounted = true;

    async function loadKpis() {
      try {
        const [total, active, owners, tenants] = await Promise.all([
          getAdminUsers({ page: 1, limit: 1 }),
          getAdminUsers({ page: 1, limit: 1, filters: { status: 'active' } }),
          getAdminUsers({ page: 1, limit: 1, filters: { role: 'co_owner' } }),
          getAdminUsers({ page: 1, limit: 1, filters: { role: 'tenant' } }),
        ]);
        if (!isMounted) return;
        setKpis({ total: total.total, active: active.total, owners: owners.total, tenants: tenants.total });
      } catch {
        if (isMounted) setKpis(null);
      }
    }

    void loadKpis();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users;

  const openCreate = () => { setForm(EMPTY_FORM); setSelectedUser(null); setStep(1); setView('edit'); setError(null); };
  const openEdit = async (user: FmzAdminUser) => {
    setSelectedUser(user);
    setForm(formFromUser(user));
    setStep(1);
    setView('edit');
    setError(null);
    setDetailsLoading(true);
    try {
      const detailedUser = await getAdminUser(user.id);
      setSelectedUser(detailedUser);
      setForm(formFromUser(detailedUser));
    } catch {
      setSelectedUser(user);
    } finally {
      setDetailsLoading(false);
    }
  };
  const backToList = () => { setView('list'); setForm(EMPTY_FORM); setSelectedUser(null); setStep(1); setError(null); };
  const setField = <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => setForm((current) => ({ ...current, [field]: value }));

  const validatePersonalData = () => {
    if (!form.name.trim()) { notify('Informe o nome completo.', false); return false; }
    if (!isValidEmail(form.email)) { notify('Informe um e-mail válido.', false); return false; }
    if (!isEditing && form.password.trim().length < 8) { notify('A senha precisa ter pelo menos 8 caracteres.', false); return false; }
    if (form.birthdate.trim() && !isValidBrazilianBirthdate(form.birthdate)) { notify('Informe uma data de nascimento válida no formato DD/MM/AAAA.', false); return false; }
    return true;
  };

  const goStep = (nextStep: Step) => {
    if (nextStep > step && step === 1 && !validatePersonalData()) return;
    setStep(nextStep);
  };

  const toggleRole = (nextRoleKey: string) => {
    const normalizedRoleKey = normalizeKey(nextRoleKey);
    setForm((current) => {
      const nextRoles = new Set(current.roleKeys.map(normalizeKey));
      nextRoles.has(normalizedRoleKey) ? nextRoles.delete(normalizedRoleKey) : nextRoles.add(normalizedRoleKey);
      return { ...current, roleKeys: Array.from(nextRoles) };
    });
  };

  const saveUser = async () => {
    if (!validatePersonalData()) { setStep(1); return; }
    if (!form.roleKeys.length) { notify('Selecione pelo menos um tipo de acesso.', false); setStep(3); return; }
    setSaving(true); setError(null);
    try {
      if (isEditing) await updateAdminUser(draftFromForm(form));
      else await createAdminUser(draftFromForm(form));
      await loadData();
      notify(isEditing ? 'Usuário atualizado com sucesso.' : 'Novo usuário criado com sucesso.');
      backToList();
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const removeUserById = async (userId: string, userName: string) => {
    if (!window.confirm(`Excluir ${userName}? Esta ação não pode ser desfeita.`)) return;
    setSaving(true); setError(null);
    try {
      await deleteAdminUser(userId);
      await loadData();
      notify('Usuário excluído.');
      setDrawerUser(null);
      backToList();
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setSaving(false);
    }
  };
  const removeUser = () => removeUserById(form.id ?? '', form.name);

  const openDrawer = async (user: FmzAdminUser) => {
    setDrawerUser(user);
    setResetLink(null);
    setDrawerLoading(true);
    try {
      setDrawerUser(await getAdminUser(user.id));
    } catch {
      // Keep the row's already-loaded summary if the detail fetch fails — better a
      // partial drawer than none, the user can still act on what's visible.
    } finally {
      setDrawerLoading(false);
    }
  };
  const closeDrawer = () => { setDrawerUser(null); setResetLink(null); };

  // "Editar dados" in the drawer opens the small reference-matching modal (name/email/phone
  // only) instead of the full create/edit wizard — role/address editing still goes through
  // the wizard, but that's a separate entry point the reference doesn't define.
  const saveContactFromDrawer = async (contact: { name: string; email: string; phone: string }) => {
    if (!drawerUser) return;
    setContactSaving(true); setError(null);
    try {
      const updated = await updateAdminUserContact(drawerUser.id, contact);
      setDrawerUser(updated);
      await loadData();
      setContactModalOpen(false);
      notify('Dados atualizados.');
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setContactSaving(false);
    }
  };

  const toggleDrawerUserActive = async () => {
    if (!drawerUser) return;
    const nextIsActive = !drawerUser.isActive;
    setStatusToggling(true); setError(null);
    try {
      const updated = await setAdminUserActiveStatus(drawerUser.id, nextIsActive);
      setDrawerUser(updated);
      await loadData();
      notify(nextIsActive ? 'Usuário reativado.' : 'Usuário desativado.');
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setStatusToggling(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!drawerUser) return;
    setResetLinkLoading(true); setError(null);
    try {
      setResetLink(await requestAdminUserPasswordResetLink(drawerUser.id));
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setResetLinkLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-124px)] text-[#0D1321]">
      <div className="w-full">
        <FmzFormAlert error={error} />
        <UserKpiStrip kpis={kpis} />
        <UserList
          users={filteredUsers}
          roles={roleByKey}
          roleOptions={roles}
          query={query}
          onQuery={setQuery}
          statusFilter={statusFilter}
          onStatusFilter={handleStatusFilterChange}
          roleFilter={roleFilter}
          onRoleFilter={handleRoleFilterChange}
          onCreate={openCreate}
          onOpen={(user) => void openDrawer(user)}
          pagination={pagination}
          loading={loading}
        />
      </div>
      <WizardModal
        open={view === 'edit'}
        isEditing={isEditing}
        step={step}
        form={form}
        roles={roles}
        roleByKey={roleByKey}
        saving={saving}
        detailsLoading={detailsLoading}
        selectedUser={selectedUser}
        error={error}
        onClose={backToList}
        onStep={goStep}
        onField={setField}
        onToggleRole={toggleRole}
        onSave={saveUser}
        onDelete={removeUser}
      />
      <UserDrawer
        user={drawerUser}
        loading={drawerLoading}
        statusToggling={statusToggling}
        resetLinkLoading={resetLinkLoading}
        resetLink={resetLink}
        onClose={closeDrawer}
        onEdit={() => setContactModalOpen(true)}
        onToggleActive={() => void toggleDrawerUserActive()}
        onRequestPasswordReset={() => void requestPasswordReset()}
        onDelete={() => drawerUser && void removeUserById(drawerUser.id, drawerUser.name)}
        onDismissResetLink={() => setResetLink(null)}
      />
      <ContactEditModal
        user={contactModalOpen ? drawerUser : null}
        saving={contactSaving}
        onSave={(contact) => void saveContactFromDrawer(contact)}
        onDismiss={() => setContactModalOpen(false)}
      />
      <ToastView toast={toast} />
    </section>
  );
}



// ─── Wizard modal ─────────────────────────────────────────────────────────────

const WZ_STEP_LABELS = ['Dados pessoais', 'Endereço', 'Tipos de acesso', 'Revisão'] as const;

type WizardModalProps = {
  open: boolean;
  isEditing: boolean;
  step: Step;
  form: UserFormState;
  roles: FmzAccessControlRole[];
  roleByKey: Map<string, FmzAccessControlRole>;
  saving: boolean;
  detailsLoading: boolean;
  selectedUser: FmzAdminUser | null;
  error: FmzNormalizedApiError | null;
  onClose: () => void;
  onStep: (step: Step) => void;
  onField: <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => void;
  onToggleRole: (roleKey: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

function WizardModal({ open, isEditing, step, form, roles, roleByKey, saving, detailsLoading, selectedUser, error, onClose, onStep, onField, onToggleRole, onSave, onDelete }: WizardModalProps) {
  const isLast = step === 4;
  return (
    <>
      <div className={fmzCn('fixed inset-0 z-[350] bg-[#0D1321]/40 transition-opacity duration-300', open ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden="true" />
      <div className={fmzCn('fixed inset-0 z-[360] flex items-center justify-center p-4 transition-opacity duration-300', open ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        <div className={fmzCn('flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(13,19,33,.4)] transition-transform duration-300', open ? 'translate-y-0' : 'translate-y-3')}>
          <div className="relative flex-shrink-0 bg-[#0D1321] px-6 pb-5 pt-5 text-white">
            <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/20 bg-white/10 transition hover:bg-white/20">
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="text-[18px] font-bold tracking-[-.02em]">{isEditing ? 'Editar usuário' : 'Novo usuário'}</p>
            <p className="mt-0.5 text-[12px] text-white/60">Etapa {step} de {WZ_STEP_LABELS.length} · {WZ_STEP_LABELS[step - 1]}</p>
            <WizardStepper step={step} />
          </div>
          <div className="flex-1 overflow-y-auto bg-white px-6 py-5" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
            <FmzFormAlert error={error} />
            {detailsLoading && (
              <p className="mb-4 flex items-center gap-2 text-[12.5px] text-[#5A6478]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />Carregando detalhes do usuário...
              </p>
            )}
            {isEditing && selectedUser && <ReadOnlyUserDetails user={selectedUser} />}
            {step === 1 && <PersonalStep form={form} isEditing={isEditing} onField={onField} />}
            {step === 2 && <AddressStep form={form} onField={onField} />}
            {step === 3 && <RolesStep roles={roles} selectedRoleKeys={form.roleKeys} onToggleRole={onToggleRole} />}
            {step === 4 && <SummaryStep form={form} roles={roleByKey} isEditing={isEditing} saving={saving} onDelete={onDelete} />}
          </div>
          <div className="flex flex-shrink-0 items-center justify-between border-t border-[#E8EAF0] bg-white px-6 py-4">
            {step > 1 ? (
              <button onClick={() => onStep((step - 1) as Step)} className="inline-flex items-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-2.5 text-[12px] font-semibold text-[#5A6478] transition hover:border-[#0D1321]">
                <ArrowLeft className="h-3.5 w-3.5" />Voltar
              </button>
            ) : (
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-2.5 text-[12px] font-semibold text-[#5A6478] transition hover:border-[#0D1321]">
                Cancelar
              </button>
            )}
            {isLast ? (
              <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-[9px] bg-[#F5C842] px-6 py-2.5 text-[12px] font-bold text-[#0D1321] shadow-[0_4px_16px_rgba(245,200,66,.3)] transition hover:-translate-y-0.5 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {isEditing ? 'Salvar alterações' : 'Criar usuário'}
              </button>
            ) : (
              <button onClick={() => onStep((step + 1) as Step)} className="inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-2.5 text-[12px] font-bold text-white transition hover:-translate-y-0.5">
                Continuar<ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function WizardStepper({ step }: { step: Step }) {
  return (
    <div className="mt-4 flex items-start">
      {WZ_STEP_LABELS.map((label, index) => {
        const num = index + 1;
        const done = num < step;
        const active = num === step;
        return (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={fmzCn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold',
                done ? 'border-[#F5C842] bg-[#F5C842] text-[#0D1321]' :
                active ? 'border-white bg-white text-[#0D1321]' :
                'border-white/25 bg-transparent text-white/40',
              )}>
                {done ? <Check className="h-3 w-3" /> : num}
              </div>
              <span className={fmzCn(
                'whitespace-nowrap text-[9px] font-semibold leading-none',
                done ? 'text-[#F5C842]' : active ? 'text-white' : 'text-white/35',
              )}>{label}</span>
            </div>
            {index < WZ_STEP_LABELS.length - 1 && (
              <div className={fmzCn('mx-2 mt-3 h-px flex-1', done ? 'bg-[#F5C842]/50' : 'bg-white/20')} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function PersonalStep({ form, isEditing, onField }: { form: UserFormState; isEditing: boolean; onField: <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => void }) {
  return (
    <div>
      <p className="mb-1 text-[16px] font-bold text-[#0D1321]">Dados pessoais</p>
      <p className="mb-5 text-[12.5px] leading-[1.5] text-[#5A6478]">Informações de identificação e contato do novo usuário.</p>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Nome completo *" value={form.name} placeholder="Ex.: Ana Beatriz Souza" onChange={(v) => onField('name', v)} />
        <Field className="sm:col-span-2" label="E-mail *" type="email" value={form.email} placeholder="nome@email.com" onChange={(v) => onField('email', v)} />
        <Field label="Telefone / WhatsApp" value={form.phone} placeholder="+55 11 9 0000-0000" onChange={(v) => onField('phone', v)} />
        <Field label="Nascimento" value={form.birthdate} placeholder="DD/MM/AAAA" onChange={(v) => onField('birthdate', formatBirthdateInput(v))} />
        {!isEditing && <Field className="sm:col-span-2" label="Senha *" type="password" value={form.password} placeholder="Mínimo 8 caracteres" onChange={(v) => onField('password', v)} />}
      </div>
      <div className="mb-5">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">Status da conta</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => onField('status', 'active')} className={fmzCn('flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition', form.status === 'active' ? 'border-[#1A8C5B] bg-[#F0FAF5] text-[#1A8C5B]' : 'border-[#E8EAF0] bg-white text-[#5A6478] hover:border-[#0D1321]')}>✓ Ativo</button>
          <button type="button" onClick={() => onField('status', 'inactive')} className={fmzCn('flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition', form.status === 'inactive' ? 'border-[#9AA3B0] bg-[#F0F1F5] text-[#5A6478]' : 'border-[#E8EAF0] bg-white text-[#5A6478] hover:border-[#0D1321]')}>○ Inativo</button>
        </div>
      </div>
    </div>
  );
}

function AddressStep({ form, onField }: { form: UserFormState; onField: <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => void }) {
  return (
    <div>
      <p className="mb-1 text-[16px] font-bold text-[#0D1321]">Endereço</p>
      <p className="mb-5 text-[12.5px] leading-[1.5] text-[#5A6478]">Endereço de cadastro. Usado para correspondência e contratos.</p>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Logradouro e número" value={form.addressLine1} placeholder="Rua das Flores, 142" onChange={(v) => onField('addressLine1', v)} />
        <Field label="Complemento" value={form.addressLine2} placeholder="Apto 31" onChange={(v) => onField('addressLine2', v)} />
        <Field label="Bairro" value={form.district} placeholder="Pinheiros" onChange={(v) => onField('district', v)} />
        <Field label="Cidade" value={form.city} placeholder="São Paulo" onChange={(v) => onField('city', v)} />
        <Field label="Estado" value={form.state} placeholder="SP" onChange={(v) => onField('state', v)} />
        <Field label="CEP" value={form.postalCode} placeholder="00000-000" onChange={(v) => onField('postalCode', v)} />
        <Field label="País" value={form.country} placeholder="BR" onChange={(v) => onField('country', v)} />
      </div>
    </div>
  );
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

function UserKpiStrip({ kpis }: { kpis: UserKpis | null }) {
  // "Total de usuários" has no sub-caption: the reference's "+38 este mês" needs a
  // signups-this-month aggregate that doesn't exist in any endpoint yet — showing a made-up
  // number would be worse than showing none. The other 3 captions are either computable
  // (active/total) or static descriptive text, same as the reference.
  const cards = [
    { label: 'Total de usuários', value: kpis?.total, caption: null, icon: <Users className="h-4 w-4" />, tone: '#2563EB', bg: '#EFF6FF' },
    { label: 'Ativos', value: kpis?.active, caption: kpis && kpis.total > 0 ? `${Math.round((kpis.active / kpis.total) * 100)}% da base` : null, icon: <CheckCircle2 className="h-4 w-4" />, tone: '#1A8C5B', bg: '#F0FAF5' },
    { label: 'Co-proprietários', value: kpis?.owners, caption: 'com tokens ativos', icon: <Target className="h-4 w-4" />, tone: '#1A8C5B', bg: '#F0FAF5' },
    { label: 'Inquilinos', value: kpis?.tenants, caption: 'contratos ativos', icon: <Home className="h-4 w-4" />, tone: '#2563EB', bg: '#EFF6FF' },
  ];
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-[13px] border border-[#E8EAF0] bg-white p-4">
          <span className="mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-[9px]" style={{ background: card.bg, color: card.tone }}>{card.icon}</span>
          <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">{card.label}</p>
          <p className="mt-1 text-[23px] font-extrabold tracking-[-.03em] text-[#0D1321]">{card.value ?? <Loader2 className="inline h-4 w-4 animate-spin text-[#9AA3B0]" />}</p>
          {card.caption && <p className="mt-0.5 text-[11px] text-[#9AA3B0]">{card.caption}</p>}
        </div>
      ))}
    </div>
  );
}

function UserList({ users, roles, roleOptions, query, onQuery, statusFilter, onStatusFilter, roleFilter, onRoleFilter, onCreate, onOpen, pagination, loading }: {
  users: FmzAdminUser[];
  roles: Map<string, FmzAccessControlRole>;
  roleOptions: FmzAccessControlRole[];
  query: string;
  onQuery: (query: string) => void;
  statusFilter: string;
  onStatusFilter: (value: string) => void;
  roleFilter: string;
  onRoleFilter: (value: string) => void;
  onCreate: () => void;
  onOpen: (user: FmzAdminUser) => void;
  pagination: FmzAdminPaginationMeta & { setPage: (page: number) => void; setLimit: (limit: number) => void };
  loading: boolean;
}) {
  const isInitialLoading = loading && users.length === 0;

  return (
    <div className="flex h-[calc(100dvh-152px)] min-h-[560px] min-w-0 animate-[fmzFadeIn_.25s_ease] flex-col overflow-hidden">
      <div className="shrink-0">
        <p className="mb-2 text-[12px] text-[#9AA3B0]">Admin <span className="px-1">›</span> Usuários</p>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[clamp(24px,4vw,34px)] font-extrabold tracking-[-.025em]">Gerenciar usuários</h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#5A6478]">Dados cadastrais, carteira de tokens, imóveis e ações administrativas.</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => exportUsersToCsv(users)} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-3 text-[13px] font-semibold text-[#0D1321] transition hover:border-[#0D1321]">
              <Download className="h-3.5 w-3.5" />Exportar
            </button>
            <button onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#F5C842] px-6 py-3 text-[13px] font-bold text-[#0D1321] transition hover:-translate-y-0.5 hover:bg-[#E8B620]">
              <Plus className="h-3.5 w-3.5" />Novo usuário
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-2.5 sm:flex-row">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B0]" />
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full rounded-[9px] border border-[#E8EAF0] bg-white py-3 pl-10 pr-4 text-[13.5px] outline-none transition focus:border-[#F5C842] focus:shadow-[0_0_0_3px_rgba(245,200,66,.12)]"
            />
          </label>
          <FmzSelect value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)} wrapperClassName="sm:w-[180px]">
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </FmzSelect>
          <FmzSelect value={roleFilter} onChange={(event) => onRoleFilter(event.target.value)} wrapperClassName="sm:w-[200px]">
            <option value="">Todos os perfis</option>
            {roleOptions.map((role) => <option key={roleKey(role)} value={roleKey(role)}>{roleLabel(role)}</option>)}
            <option value="overdue">Aluguel atrasado</option>
          </FmzSelect>
        </div>

        <FmzAdminPagination {...pagination} disabled={loading} onPageChange={pagination.setPage} onLimitChange={pagination.setLimit} />
      </div>

      <div className="relative mt-4 min-h-0 flex-1 overflow-y-auto rounded-[14px] border border-[#E8EAF0] bg-white">
        {isInitialLoading ? (
          <FmzAdminListSkeleton />
        ) : users.length ? (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-[1] bg-[#FCFCFD]">
              <tr>
                <th className="border-b border-[#F0F1F5] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA3B0]">Usuário</th>
                <th className="hidden border-b border-[#F0F1F5] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA3B0] lg:table-cell">Idade</th>
                <th className="hidden border-b border-[#F0F1F5] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA3B0] sm:table-cell">Telefone</th>
                <th className="hidden border-b border-[#F0F1F5] px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA3B0] md:table-cell">Tokens</th>
                <th className="hidden border-b border-[#F0F1F5] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA3B0] md:table-cell">Inquilino</th>
                <th className="hidden border-b border-[#F0F1F5] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA3B0] xl:table-cell">Última ação</th>
                <th className="border-b border-[#F0F1F5] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA3B0]">Status</th>
                <th className="w-8 border-b border-[#F0F1F5] px-4 py-3" />
              </tr>
            </thead>
            <tbody className={fmzCn('transition-opacity', loading && 'opacity-60')}>
              {users.map((user) => <UserTableRow key={user.id || user.email} user={user} roles={roles} onOpen={() => onOpen(user)} />)}
            </tbody>
          </table>
        ) : (
          <EmptyUsers hasQuery={Boolean(query.trim())} onCreate={onCreate} />
        )}

        {loading && !isInitialLoading && (
          <div className="pointer-events-none sticky top-3 z-10 mx-auto flex w-fit items-center gap-2 rounded-full border border-[#E8EAF0] bg-white/95 px-4 py-2 text-[12px] font-semibold text-[#5A6478] shadow-sm backdrop-blur">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />Atualizando lista...
          </div>
        )}
      </div>
      <div className="mt-3 flex shrink-0 items-center justify-between text-[11px] text-[#9AA3B0]">
        <span>FirmezaToken Admin · v2.4.1</span>
        <span>Usuários · {formatAbbrevMonthYear(new Date().toISOString())}</span>
      </div>
    </div>
  );
}

const isUserOverdue = (user: FmzAdminUser): boolean => user.tenantContracts.some((contract) => contract.overdue);

// Exports exactly the rows currently loaded in the table (real backend data, current page) —
// no separate export endpoint exists yet, so this can't include rows outside the active page.
const csvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;
function exportUsersToCsv(users: FmzAdminUser[]): void {
  const header = ['Nome', 'E-mail', 'Telefone', 'Status', 'Perfis', 'Atrasado'];
  const rows = users.map((user) => [
    user.name || '',
    user.email || '',
    user.phone || '',
    user.isActive ? 'Ativo' : 'Inativo',
    user.roleKeys.join('; '),
    isUserOverdue(user) ? 'Sim' : 'Não',
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function UserTableRow({ user, onOpen }: { user: FmzAdminUser; roles: Map<string, FmzAccessControlRole>; onOpen: () => void }) {
  const [bg, fg] = avatarColor(user.id || user.email);
  const overdue = isUserOverdue(user);
  const age = calculateAge(user.birthdate);
  const totalTokens = user.coOwnerProperties.reduce((sum, item) => sum + valueAsNumber(item.tokenBalance), 0);
  return (
    <tr onClick={onOpen} className="cursor-pointer border-b border-[#F0F1F5] transition hover:bg-[#F7F8FA] last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: bg, color: fg }}>{initials(user.name)}</span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold text-[#0D1321]">{user.name || 'Usuário sem nome'}</p>
            <p className="truncate text-[11.5px] text-[#9AA3B0]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-[13px] text-[#5A6478] lg:table-cell">{age !== null ? `${age} anos` : '—'}</td>
      <td className="hidden px-4 py-3 text-[13px] text-[#5A6478] sm:table-cell">{user.phone || '—'}</td>
      <td className="hidden px-4 py-3 text-right text-[13px] font-semibold text-[#0D1321] md:table-cell">
        {user.coOwnerProperties.length ? <>{formatTokenAmount(totalTokens)} <span className="text-[11px] font-normal text-[#9AA3B0]">· {user.coOwnerProperties.length} imóv.</span></> : '—'}
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        {overdue ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-[#F5C4BF] bg-[#FEF5F4] px-2.5 py-0.5 text-[10.5px] font-bold text-[#D94F3D]">Atraso</span>
        ) : user.tenantContracts.length ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-[#9DC0FF]/30 bg-[#2563EB]/10 px-2.5 py-0.5 text-[10.5px] font-bold text-[#2563EB]">Inquilino</span>
        ) : (
          <span className="text-[11.5px] text-[#9AA3B0]">—</span>
        )}
      </td>
      <td className="hidden px-4 py-3 xl:table-cell">
        <p className="text-[12.5px] text-[#0D1321]">{user.lastLoginAt ? 'Login na plataforma' : '—'}</p>
        <p className="mt-0.5 text-[11px] text-[#9AA3B0]">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Sem registro'}</p>
      </td>
      <td className="px-4 py-3">
        <span className={fmzCn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10.5px] font-bold', user.isActive ? 'border-[#A8DFC4] bg-[#F0FAF5] text-[#1A8C5B]' : 'border-[#E8EAF0] bg-[#F7F8FA] text-[#9AA3B0]')}><span className={fmzCn('h-1.5 w-1.5 rounded-full', user.isActive ? 'bg-[#1A8C5B]' : 'bg-[#9AA3B0]')} />{user.isActive ? 'Ativo' : 'Inativo'}</span>
      </td>
      <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-[#9AA3B0]" /></td>
    </tr>
  );
}

type UserDrawerProps = {
  user: FmzAdminUser | null;
  loading: boolean;
  statusToggling: boolean;
  resetLinkLoading: boolean;
  resetLink: ResetLinkState;
  onClose: () => void;
  onEdit: (user: FmzAdminUser) => void;
  onToggleActive: () => void;
  onRequestPasswordReset: () => void;
  onDelete: () => void;
  onDismissResetLink: () => void;
};

function UserDrawer({ user, loading, statusToggling, resetLinkLoading, resetLink, onClose, onEdit, onToggleActive, onRequestPasswordReset, onDelete, onDismissResetLink }: UserDrawerProps) {
  const isOpen = Boolean(user);
  return (
    <>
      <div
        className={fmzCn('fixed inset-0 z-[300] bg-[#0D1321]/30 transition-opacity', isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={fmzCn(
          'fixed right-0 top-0 z-[310] flex h-full w-full max-w-[480px] flex-col bg-[#F7F8FA] shadow-[-12px_0_40px_rgba(13,19,33,.18)] transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!isOpen}
      >
        {user && (
          <>
            <DrawerHeader user={user} onClose={onClose} />
            <div className="flex-1 overflow-y-auto px-[22px] py-[18px]">
              {loading && <p className="mb-4 flex items-center gap-2 text-[12.5px] text-[#5A6478]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Atualizando detalhes...</p>}
              <div className="flex flex-col gap-3.5">
                <PersonalDataCard user={user} />
                <AddressCard user={user} />
                <WalletsCard wallets={user.wallets} />
                <PropertiesCard user={user} />
                <TenantStatusCard contracts={user.tenantContracts.length ? user.tenantContracts : user.contracts} />
                <LastActionCard user={user} />
              </div>
            </div>
            <DrawerActions
              user={user}
              statusToggling={statusToggling}
              onEdit={() => onEdit(user)}
              onToggleActive={onToggleActive}
              onRequestPasswordReset={onRequestPasswordReset}
              onDelete={onDelete}
            />
          </>
        )}
      </aside>
      <ResetLinkModal resetLink={resetLink} loading={resetLinkLoading} onDismiss={onDismissResetLink} />
    </>
  );
}

function DrawerHeader({ user, onClose }: { user: FmzAdminUser; onClose: () => void }) {
  const [bg, fg] = avatarColor(user.id || user.email);
  const overdue = isUserOverdue(user);
  return (
    <div className="relative flex-shrink-0 bg-[#0D1321] px-[22px] pb-5 pt-[22px] text-white">
      <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/20 bg-white/10 transition hover:bg-white/20">
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border-2 border-white/20 text-[16px] font-bold" style={{ background: bg, color: fg }}>{initials(user.name)}</span>
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold tracking-[-.02em]">{user.name || 'Usuário sem nome'}</p>
          <p className="truncate text-[12px] text-white/60">Cadastrado em {user.createdAt ? formatDateTime(user.createdAt) : '—'}{user.id && ` · ID #${user.id.slice(0, 8)}`}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={fmzCn('inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[11px] font-bold', user.isActive ? 'border-[#7EE3B0]/30 bg-[#1A8C5B]/[.22] text-[#7EE3B0]' : 'border-white/[.18] bg-white/10 text-white/70')}>● {user.isActive ? 'Ativo' : 'Inativo'}</span>
        {user.coOwnerProperties.length > 0 && <span className="inline-flex items-center gap-1 rounded-md border border-[#F5C842]/30 bg-[#F5C842]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#F5C842]">Co-proprietário</span>}
        {user.tenantContracts.length > 0 && <span className="inline-flex items-center gap-1 rounded-md border border-[#9DC0FF]/30 bg-[#2563EB]/25 px-2.5 py-0.5 text-[11px] font-bold text-[#9DC0FF]">Inquilino</span>}
        {overdue && <span className="inline-flex items-center gap-1 rounded-md border border-[#F5A99E]/30 bg-[#D94F3D]/25 px-2.5 py-0.5 text-[11px] font-bold text-[#F5A99E]">● Aluguel atrasado</span>}
      </div>
    </div>
  );
}

function TenantStatusCard({ contracts }: { contracts: FmzAdminTenantContract[] }) {
  const overdueContract = contracts.find((contract) => contract.overdue);
  return (
    <DetailCard icon={<Home className="h-4 w-4" />} title="Situação de inquilino" flush={contracts.length > 0}>
      {!contracts.length ? (
        <p className="text-[13px] italic text-[#9AA3B0]">Este usuário não é inquilino de nenhum imóvel.</p>
      ) : (
        <>
          {contracts.map((contract) => (
            <div key={contract.id} className="flex gap-3 border-b border-[#F0F1F5] px-4 py-3 last:border-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#EFF6FF] text-[#2563EB]"><Home className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#0D1321]">{contract.property?.addressLine1 || contract.property?.name || contract.contractNumber || 'Contrato'}</p>
                <p className="mt-0.5 text-[11.5px] text-[#9AA3B0]">{contract.property?.district || '—'} · inquilino desde {formatAbbrevMonthYear(contract.startDate)} · {formatMoney(contract.baseMonthlyRent, contract.currency || 'BRL')}/mês</p>
              </div>
            </div>
          ))}
          {overdueContract?.overdue ? (
            <div className="mx-4 mb-3.5 flex items-start gap-2.5 rounded-[10px] border border-[#F5C4BF] bg-[#FEF5F4] p-3">
              <AlertTriangle className="mt-0.5 h-[15px] w-[15px] shrink-0 text-[#D94F3D]" />
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-[#D94F3D]">Aluguel em atraso — {overdueContract.overdue.months} {overdueContract.overdue.months > 1 ? 'meses' : 'mês'}</p>
                <p className="text-[11.5px] leading-[1.45] text-[#9a4030]">Total devido <strong>{formatMoney(overdueContract.overdue.amount, overdueContract.currency || 'BRL')}</strong> · mais antigo desde {formatMonthYear(overdueContract.overdue.oldestMonth)}</p>
              </div>
            </div>
          ) : (
            <div className="mx-4 mb-3.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#1A8C5B]"><CheckCircle2 className="h-3.5 w-3.5" />Aluguel em dia</div>
          )}
        </>
      )}
    </DetailCard>
  );
}

function LastActionCard({ user }: { user: FmzAdminUser }) {
  return (
    <DetailCard icon={<Clock className="h-4 w-4" />} title="Última ação na plataforma">
      <FieldRow label="Atividade" value={user.lastLoginAt ? 'Login na plataforma' : 'Nenhum login registrado'} />
      <FieldRow label="Quando" value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'} />
    </DetailCard>
  );
}

function DrawerActions({ user, statusToggling, onEdit, onToggleActive, onRequestPasswordReset, onDelete }: { user: FmzAdminUser; statusToggling: boolean; onEdit: () => void; onToggleActive: () => void; onRequestPasswordReset: () => void; onDelete: () => void }) {
  return (
    <div className="grid flex-shrink-0 grid-cols-2 gap-2.5 border-t border-[#E8EAF0] bg-white p-[14px_22px]">
      <button onClick={onEdit} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#0D1321] transition hover:border-[#0D1321]"><Pencil className="h-3.5 w-3.5" />Editar dados</button>
      <button onClick={onRequestPasswordReset} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#0D1321] transition hover:border-[#0D1321]"><KeyRound className="h-3.5 w-3.5" />Resetar senha</button>
      <button disabled={statusToggling} onClick={onToggleActive} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#0D1321] transition hover:border-[#0D1321] disabled:opacity-50">{statusToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}{user.isActive ? 'Desativar usuário' : 'Reativar usuário'}</button>
      <button onClick={onDelete} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#F5C4BF] bg-[#FEF5F4] px-4 py-2.5 text-[12px] font-semibold text-[#D94F3D] transition hover:bg-[#FDEDEC]"><Trash2 className="h-3.5 w-3.5" />Deletar usuário</button>
    </div>
  );
}

// Reference's "Editar dados" is a small modal with only name/email/phone — role/address
// editing stays on the wizard, which the reference doesn't define a UI for at all.
function ContactEditModal({ user, saving, onSave, onDismiss }: { user: FmzAdminUser | null; saving: boolean; onSave: (contact: { name: string; email: string; phone: string }) => void; onDismiss: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const isOpen = Boolean(user);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
  }, [user]);

  return (
    <div className={fmzCn('fixed inset-0 z-[400] grid place-items-center bg-[#0D1321]/40 p-6 transition-opacity', isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}>
      {isOpen && (
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(13,19,33,.3)]">
          <div className="px-[22px] pt-5">
            <h2 className="text-[17px] font-extrabold tracking-[-.02em]">Editar dados</h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#5A6478]">Atualize as informações de contato deste usuário.</p>
          </div>
          <div className="px-[22px] pt-4">
            <Field label="Nome completo" value={name} placeholder="Ex: Mirella Souza" onChange={setName} />
            <Field label="E-mail" type="email" value={email} placeholder="email@exemplo.com" onChange={setEmail} />
            <Field label="Telefone" value={phone} placeholder="+55 11 9 0000-0000" onChange={setPhone} />
          </div>
          <div className="flex justify-end gap-2.5 px-[22px] py-[22px] pt-2">
            <button onClick={onDismiss} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#5A6478]">Cancelar</button>
            <button disabled={saving} onClick={() => onSave({ name, email, phone })} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-4 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResetLinkModal({ resetLink, loading, onDismiss }: { resetLink: ResetLinkState; loading: boolean; onDismiss: () => void }) {
  const isOpen = loading || Boolean(resetLink);
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink.resetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={fmzCn('fixed inset-0 z-[400] grid place-items-center bg-[#0D1321]/40 p-6 transition-opacity', isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}>
      {isOpen && (
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(13,19,33,.3)]">
          <div className="px-[22px] pt-5">
            <span className="mb-3 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#FFFBEB] text-[#D97706]"><KeyRound className="h-5 w-5" /></span>
            <h2 className="text-[17px] font-extrabold tracking-[-.02em]">Link de redefinição de senha</h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#5A6478]">O backend não envia e-mail automaticamente — copie o link abaixo e envie pelo composer de e-mails.</p>
          </div>
          <div className="px-[22px] pt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-[12.5px] text-[#5A6478]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Gerando link...</div>
            ) : resetLink ? (
              <>
                <div className="break-all rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-3 py-2.5 font-mono text-[12px] text-[#0D1321]">{resetLink.resetUrl}</div>
                {resetLink.expiresAt && <p className="mt-2 text-[11.5px] text-[#9AA3B0]">Expira em {formatDateTime(resetLink.expiresAt)}.</p>}
              </>
            ) : null}
          </div>
          <div className="flex justify-end gap-2.5 px-[22px] py-[22px] pt-4">
            <button onClick={onDismiss} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#5A6478]">Fechar</button>
            {resetLink && <button onClick={() => void copyLink()} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-4 py-2.5 text-[12px] font-semibold text-white"><Copy className="h-3.5 w-3.5" />{copied ? 'Copiado!' : 'Copiar link'}</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyUsers({ hasQuery, onCreate }: { hasQuery: boolean; onCreate: () => void }) {
  return <div className="rounded-2xl border border-dashed border-[#D0D4DE] bg-white px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#D0D4DE] bg-[#F7F8FA]"><UsersRound className="h-6 w-6 text-[#9AA3B0]" /></div><h2 className="text-base font-bold">{hasQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</h2><p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-[#5A6478]">{hasQuery ? 'Tente outro termo de busca.' : 'Crie o primeiro usuário para começar.'}</p>{!hasQuery && <button onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-3 text-[13px] font-bold uppercase text-white"><Plus className="h-3.5 w-3.5" />Criar agora</button>}</div>;
}

function ReadOnlyUserDetails({ user }: { user: FmzAdminUser }) {
  const hasDetails = user.wallets.length || user.tenantContracts.length || user.coOwnerProperties.length || user.propertyRelations.length || user.address || user.addressLine1;
  if (!hasDetails) return null;
  return (
    <div className="mb-7 grid gap-4 lg:grid-cols-2">
      <AddressCard user={user} />
      <WalletsCard wallets={user.wallets} />
      <PropertiesCard user={user} />
      <ContractsCard contracts={user.tenantContracts.length ? user.tenantContracts : user.contracts} />
    </div>
  );
}

// Mirrors reference's `.dr-sec`/`.dr-sec-head`/`.dr-sec-body` exactly — no subtitle line
// (the reference's section head is icon + title only). `flush` skips dr-sec-body's padding
// for sections whose content (wallet-total/hold-row) is self-padded and meant to bleed edge
// to edge, same as the reference markup.
function DetailCard({ icon, title, flush = false, children }: { icon: ReactNode; title: string; flush?: boolean; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[13px] border border-[#E8EAF0] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[#E8EAF0] px-4 py-[13px]">
        <span className="text-[#5A6478]">{icon}</span>
        <h2 className="text-[13px] font-extrabold text-[#0D1321]">{title}</h2>
      </div>
      {flush ? children : <div className="px-4 py-3">{children}</div>}
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-baseline justify-between gap-3.5 border-b border-dashed border-[#F0F1F5] py-2 text-[13px] last:border-0"><span className="shrink-0 text-[12px] text-[#5A6478]">{label}</span><span className="text-right font-semibold text-[#0D1321]">{value}</span></div>;
}

function PersonalDataCard({ user }: { user: FmzAdminUser }) {
  const age = calculateAge(user.birthdate);
  return (
    <DetailCard icon={<Users className="h-4 w-4" />} title="Dados pessoais">
      <FieldRow label="Nome completo" value={user.name || '—'} />
      <FieldRow label="E-mail" value={user.email || '—'} />
      <FieldRow label="Telefone" value={user.phone || '—'} />
      <FieldRow label="CPF" value={<span className="italic text-[#9AA3B0]">Não disponível via API</span>} />
      <FieldRow label="Nascimento" value={user.birthdate ? `${formatDateOnly(user.birthdate)}${age !== null ? ` · ${age} anos` : ''}` : '—'} />
    </DetailCard>
  );
}

function AddressCard({ user }: { user: FmzAdminUser }) {
  const street = [user.addressLine1, user.addressLine2].filter(Boolean).join(' · ');
  const neighCity = [user.district, user.city].filter(Boolean).join(' · ');
  const hasAddress = street || neighCity || user.postalCode;
  return (
    <DetailCard icon={<MapPin className="h-4 w-4" />} title="Endereço">
      {hasAddress ? (
        <p className="text-[13px] leading-[1.6] text-[#0D1321]">
          {street}{street && <br />}
          {neighCity}{neighCity && <br />}
          {user.postalCode && <span className="text-[12px] text-[#9AA3B0]">CEP {user.postalCode}</span>}
        </p>
      ) : (
        <p className="text-[13px] italic text-[#9AA3B0]">Endereço não informado.</p>
      )}
    </DetailCard>
  );
}

function WalletsCard({ wallets }: { wallets: FmzAdminUserWallet[] }) {
  return <DetailCard icon={<WalletCards className="h-4 w-4" />} title="Wallets"><div className="flex flex-col gap-3">{wallets.length ? wallets.map((wallet, index) => <div key={wallet.id || wallet.walletAddress} className="rounded-xl border border-[#E8EAF0] bg-[#F7F8FA] p-3"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">Wallet {index + 1}</span><span className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#5A6478]">Chain {wallet.chainId}</span></div><p className="break-all text-[12px] text-[#0D1321]">{wallet.walletAddress}</p><div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]"><Badge>{wallet.walletType}</Badge><Badge>{wallet.custodyType}</Badge><Badge>{wallet.verificationStatus}</Badge><Badge>{wallet.status}</Badge></div></div>) : <p className="text-[13px] italic text-[#9AA3B0]">Nenhuma wallet vinculada.</p>}</div></DetailCard>;
}

// Mirrors reference's "Carteira de tokens" exactly: wallet-total bar + hold-row list are both
// full-bleed (edge to edge, self-padded), not wrapped in the generic padded card body —
// hence `flush`. Falls back to RelationView's plain list when there's no co-ownership at all.
function PropertiesCard({ user }: { user: FmzAdminUser }) {
  const totalTokens = user.coOwnerProperties.reduce((sum, item) => sum + valueAsNumber(item.tokenBalance), 0);
  const hasHoldings = user.coOwnerProperties.length > 0;
  return (
    <DetailCard icon={<Building2 className="h-4 w-4" />} title="Carteira de tokens" flush={hasHoldings}>
      {hasHoldings ? (
        <>
          <div className="flex items-center justify-between border-b border-[#F0D870] bg-[#FFFBEB] px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[.05em] text-[#9A7D0A]">Saldo total</span>
            <span className="font-mono text-[16px] font-bold text-[#0D1321]">{formatTokenAmount(totalTokens)} FRMZ</span>
          </div>
          {user.coOwnerProperties.map((item, index) => <OwnershipView key={item.id || item.propertyId} item={item} colorIndex={index} />)}
        </>
      ) : user.propertyRelations.length ? (
        <div className="flex flex-col gap-3">
          {user.propertyRelations.map((relation) => <RelationView key={relation.id || `${relation.propertyId}-${relation.relationType}`} relation={relation} />)}
        </div>
      ) : (
        <p className="text-[13px] italic text-[#9AA3B0]">Nenhuma propriedade vinculada.</p>
      )}
    </DetailCard>
  );
}

function OwnershipView({ item, colorIndex }: { item: FmzAdminCoOwnerProperty; colorIndex: number }) {
  const palette = HOLD_INITIALS_PALETTE[colorIndex % HOLD_INITIALS_PALETTE.length];
  const street = item.property?.addressLine1 || item.property?.name || 'Imóvel';
  return (
    <div className="flex items-center gap-3 border-b border-[#F0F1F5] px-4 py-3 last:border-0">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[12px] font-extrabold" style={{ background: palette.bg, color: palette.fg }}>{propertyInitials(item.property?.name || street)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-[#0D1321]">{street}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-[#9AA3B0]">{item.property?.district || item.property?.city || '—'}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-[13px] font-extrabold text-[#0D1321]">{formatTokenAmount(item.tokenBalance)} FRMZ</p>
        <p className="mt-0.5 text-[11px] text-[#9AA3B0]">{formatPercentage(item.ownershipPercentage)} do imóvel</p>
      </div>
    </div>
  );
}

function RelationView({ relation }: { relation: FmzAdminPropertyRelation }) {
  return <div className="rounded-xl border border-[#E8EAF0] bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[13.5px] font-bold text-[#0D1321]">{relation.property?.name || 'Propriedade'}</p><p className="mt-1 text-[11.5px] leading-5 text-[#5A6478]">{propertyAddress(relation.property)}</p></div><Badge>{relation.relationType}</Badge></div></div>;
}

function ContractsCard({ contracts }: { contracts: FmzAdminTenantContract[] }) {
  return <DetailCard icon={<Home className="h-4 w-4" />} title="Contratos de inquilino"><div className="flex flex-col gap-3">{contracts.length ? contracts.map((contract) => <div key={contract.id} className="rounded-xl border border-[#E8EAF0] bg-[#F7F8FA] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[13.5px] font-bold text-[#0D1321]">{contract.property?.name || contract.contractNumber || 'Contrato'}</p><p className="mt-1 text-[11.5px] text-[#5A6478]">{propertyAddress(contract.property)}</p></div><Badge>{contract.status || 'sem status'}</Badge></div><div className="mt-3 grid gap-2 text-[11.5px] text-[#5A6478] sm:grid-cols-3"><Metric label="Aluguel" value={formatMoney(contract.baseMonthlyRent, contract.currency || 'BRL')} /><Metric label="Vencimento" value={contract.paymentDay ? `Dia ${contract.paymentDay}` : '—'} /><Metric label="Índice" value={contract.rentAdjustmentIndex || '—'} /></div></div>) : <p className="text-[13px] italic text-[#9AA3B0]">Nenhum contrato como inquilino.</p>}</div></DetailCard>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <span className="rounded-lg bg-white px-3 py-2"><span className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">{label}</span><span className="mt-0.5 block font-semibold text-[#0D1321]">{value}</span></span>;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[#E8EAF0] bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#5A6478]">{children}</span>;
}


const FIELD_FOCUS_CLASSNAME = 'h-auto rounded-[9px] border border-[#E8EAF0] bg-white px-3.5 py-3 focus-within:border-[#F5C842] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(245,200,66,.13)]';

function Field({ label, value, onChange, placeholder, type = 'text', className }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; className?: string }) {
  return (
    <label className={fmzCn('mb-5 block', className)}>
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">{label}</span>
      {type === 'password' ? (
        <FmzPasswordField
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          wrapperClassName={FIELD_FOCUS_CLASSNAME}
          className="text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[9px] border border-[#E8EAF0] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,.13)]"
        />
      )}
    </label>
  );
}

function RolesStep({ roles, selectedRoleKeys, onToggleRole }: { roles: FmzAccessControlRole[]; selectedRoleKeys: string[]; onToggleRole: (roleKey: string) => void }) {
  const selected = new Set(selectedRoleKeys.map(normalizeKey));
  return <div><div className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm sm:p-7"><h2 className="text-base font-bold">O que esse usuário pode acessar?</h2><p className="mt-1 text-[13px] leading-6 text-[#5A6478]">As permissões e páginas vêm das roles retornadas pelo backend.</p><div className="mt-5 flex gap-2.5 rounded-xl border border-[#F0D870] bg-[#FFF9E6] px-4 py-3 text-[12.5px] text-[#7D5A00]"><ShieldCheck className="h-4 w-4 shrink-0" />O frontend envia apenas roles. Wallets, propriedades e ownership não são enviados no salvamento.</div><div className="mt-5 flex flex-col gap-2.5">{roles.map((role, index) => { const key = roleKey(role); const isOn = selected.has(key); const color = role.color || ROLE_COLORS[index % ROLE_COLORS.length]; return <button key={key} onClick={() => onToggleRole(key)} className={fmzCn('overflow-hidden rounded-xl border text-left transition', isOn ? 'border-[#F5C842]' : 'border-[#E8EAF0]')}><span className={fmzCn('flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F7F8FA]', isOn && 'bg-[#FFFDF0] hover:bg-[#FFFDF0]')}><span className={fmzCn('relative h-5 w-9 shrink-0 rounded-full transition', isOn ? 'bg-[#0D1321]' : 'bg-[#E8EAF0]')}><span className={fmzCn('absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', isOn ? 'translate-x-[19px]' : 'translate-x-[3px]')} /></span><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} /><span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-[#0D1321]">{roleLabel(role)}</span><span className="mt-0.5 block text-[11px] text-[#9AA3B0]">{roleDescription(role)}</span></span><span className="hidden whitespace-nowrap text-[11px] text-[#9AA3B0] sm:block">{role.permissionKeys.length} permissão{role.permissionKeys.length === 1 ? '' : 'ões'}</span></span></button>; })}</div></div></div>;
}

function SummaryStep({ form, roles, isEditing, saving, onDelete }: { form: UserFormState; roles: Map<string, FmzAccessControlRole>; isEditing: boolean; saving: boolean; onDelete: () => void }) {
  const [bg, fg] = avatarColor(form.id || form.email);
  return <div><div className="overflow-hidden rounded-2xl border border-[#E8EAF0] bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-[#E8EAF0] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold" style={{ background: bg, color: fg }}>{initials(form.name)}</span><span className="min-w-0 flex-1"><h2 className="truncate text-lg font-extrabold">{form.name || '—'}</h2><p className="mt-0.5 truncate text-[12.5px] text-[#5A6478]">{[form.email, form.phone, form.city].filter(Boolean).join(' · ') || '—'}</p></span><span className={fmzCn('inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold', form.status === 'active' ? 'border-[#A8DFC4] bg-[#F0FAF5] text-[#1A8C5B]' : 'border-[#E8EAF0] bg-[#F0F1F5] text-[#9AA3B0]')}>{form.status === 'active' ? '● Ativo' : '○ Inativo'}</span></div><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2"><div><div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">Tipos de acesso atribuídos</div><div className="flex flex-col gap-3">{form.roleKeys.length ? form.roleKeys.map((key) => { const role = roles.get(normalizeKey(key)); const color = role?.color || '#7F8C8D'; return <div key={key} className="flex items-center gap-3 rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] px-3 py-3"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /><span className="text-[13px] font-medium">{role ? roleLabel(role) : key}</span><span className="ml-auto hidden text-[11.5px] text-[#9AA3B0] sm:block">{role ? roleDescription(role) : 'Role retornada pelo backend'}</span></div>; }) : <div className="py-2 text-[13px] italic text-[#9AA3B0]">Nenhum tipo de acesso selecionado.</div>}</div></div><div><div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">Campos editáveis enviados</div><div className="rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] p-3 text-[12.5px] leading-6 text-[#5A6478]"><p>Nome, e-mail, telefone, status, roles, nascimento e endereço.</p><p className="mt-2 flex gap-2 text-[#7D5A00]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Wallets, contratos e percentuais de posse não são enviados no POST/PATCH.</p></div></div></div></div>{isEditing && <div className="mt-6"><button disabled={saving} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#F5C4BF] bg-[#FEF5F4] px-5 py-3 text-[13px] text-[#D94F3D] disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir usuário</button></div>}</div>;
}

function ToastView({ toast }: { toast: Toast }) {
  return <div className={fmzCn('fixed bottom-6 left-1/2 z-[400] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0D1321] px-5 py-3 text-[13px] font-medium text-white shadow-lg transition-all duration-300', toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}><span className={fmzCn('flex h-4 w-4 items-center justify-center rounded-full', toast?.ok ? 'bg-[#F5C842] text-[#0D1321]' : 'bg-[#D94F3D] text-white')}>{toast?.ok ? <Check className="h-2.5 w-2.5" /> : <Info className="h-2.5 w-2.5" />}</span>{toast?.message || 'Salvo!'}</div>;
}
