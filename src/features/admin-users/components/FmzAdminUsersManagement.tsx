'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Home,
  Info,
  KeyRound,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { formatBirthdateInput } from '../../../services/phone-country-format';
import { FmzFormAlert } from '../../api-errors/components';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import type { FmzAccessControlRole } from '../../access-control/domain';
import { createAdminUser, deleteAdminUser, getAdminUser, getAdminUserRoles, getAdminUsers, updateAdminUser } from '../services';
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

type Step = 1 | 2 | 3;
type ViewMode = 'list' | 'edit';
type Toast = { message: string; ok: boolean } | null;

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
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [selectedUser, setSelectedUser] = useState<FmzAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<FmzNormalizedApiError | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const roleByKey = useMemo(() => new Map(roles.map((role) => [roleKey(role), role])), [roles]);
  const isEditing = Boolean(form.id);

  const notify = useCallback((message: string, ok = true) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextUsers, nextRoles] = await Promise.all([
        getAdminUsers(),
        getAdminUserRoles().catch(() => DEFAULT_ROLES),
      ]);
      const mergedRoles = new Map(DEFAULT_ROLES.map((role) => [roleKey(role), role]));
      nextRoles.forEach((role) => mergedRoles.set(roleKey(role), role));
      setUsers(nextUsers);
      setRoles(Array.from(mergedRoles.values()).filter((role) => roleKey(role) !== 'investor'));
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredUsers = useMemo(() => {
    const currentQuery = query.trim().toLowerCase();
    if (!currentQuery) return users;
    return users.filter((user) => [
      user.name,
      user.email,
      user.phone ?? '',
      user.walletAddress ?? user.wallet ?? '',
      user.roleKeys.join(' '),
      user.wallets.map((wallet) => wallet.walletAddress).join(' '),
      user.coOwnerProperties.map((item) => item.property?.name ?? '').join(' '),
      user.tenantContracts.map((contract) => contract.property?.name ?? contract.contractNumber ?? '').join(' '),
      user.propertyRelations.map((relation) => relation.property?.name ?? relation.relationType).join(' '),
    ].some((value) => value.toLowerCase().includes(currentQuery)));
  }, [query, users]);

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

  const validateBasicData = () => {
    if (!form.name.trim()) { notify('Informe o nome completo.', false); return false; }
    if (!isValidEmail(form.email)) { notify('Informe um e-mail válido.', false); return false; }
    if (!isEditing && form.password.trim().length < 8) { notify('A senha precisa ter pelo menos 8 caracteres.', false); return false; }
    if (form.birthdate.trim() && !isValidBrazilianBirthdate(form.birthdate)) { notify('Informe uma data de nascimento válida no formato DD/MM/AAAA.', false); return false; }
    return true;
  };

  const goStep = (nextStep: Step) => {
    if (nextStep > 1 && !validateBasicData()) return;
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
    if (!validateBasicData()) { setStep(1); return; }
    if (!form.roleKeys.length) { notify('Selecione pelo menos um tipo de acesso.', false); setStep(2); return; }
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

  const removeUser = async () => {
    if (!form.id) return;
    if (!window.confirm(`Excluir ${form.name}? Esta ação não pode ser desfeita.`)) return;
    setSaving(true); setError(null);
    try {
      await deleteAdminUser(form.id);
      await loadData();
      notify('Usuário excluído.');
      backToList();
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-124px)] text-[#0D1321]">
      <div className="w-full">
        <FmzFormAlert error={error} />
        {loading ? <Loading /> : view === 'list' ? (
          <UserList users={filteredUsers} roles={roleByKey} query={query} onQuery={setQuery} onCreate={openCreate} onEdit={(user) => void openEdit(user)} />
        ) : (
          <div className="animate-[fmzFadeIn_.25s_ease]">
            <EditHeader isEditing={isEditing} userName={form.name} onBack={backToList} />
            {detailsLoading && <div className="mb-4 rounded-xl border border-[#E8EAF0] bg-white px-4 py-3 text-[13px] text-[#5A6478]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Carregando detalhes do usuário...</div>}
            {selectedUser && <ReadOnlyUserDetails user={selectedUser} />}
            <Steps step={step} />
            {step === 1 && <BasicStep form={form} isEditing={isEditing} onField={setField} onNext={() => goStep(2)} />}
            {step === 2 && <RolesStep roles={roles} selectedRoleKeys={form.roleKeys} onToggleRole={toggleRole} onBack={() => goStep(1)} onNext={() => goStep(3)} />}
            {step === 3 && <SummaryStep form={form} roles={roleByKey} isEditing={isEditing} saving={saving} onBack={() => goStep(2)} onSave={saveUser} onDelete={removeUser} />}
          </div>
        )}
      </div>
      <ToastView toast={toast} />
    </section>
  );
}

function Loading() {
  return <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-[#E8EAF0] bg-white"><span className="flex items-center gap-3 text-sm text-[#5A6478]"><Loader2 className="h-5 w-5 animate-spin" />Carregando usuários...</span></div>;
}

function EditHeader({ isEditing, userName, onBack }: { isEditing: boolean; userName: string; onBack: () => void }) {
  return (
    <div className="mb-6 rounded-2xl border border-[#E8EAF0] bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#9AA3B0]">Gestão de usuários</p>
        <h1 className="mt-1 font-syne text-xl font-extrabold tracking-[-.02em] text-[#0D1321]">{isEditing ? `Editar ${userName || 'usuário'}` : 'Novo usuário'}</h1>
        <p className="mt-1 text-[12.5px] text-[#5A6478]">Campos de wallet, contratos e percentuais são somente leitura e vêm do backend.</p>
      </div>
      <button onClick={onBack} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-4 py-3 font-syne text-[12px] font-bold uppercase tracking-[.04em] text-[#0D1321] transition hover:-translate-y-0.5 hover:border-[#0D1321] sm:mt-0 sm:w-auto">
        <ArrowLeft className="h-4 w-4" />Voltar para a listagem de usuários
      </button>
    </div>
  );
}

function UserList({ users, roles, query, onQuery, onCreate, onEdit }: { users: FmzAdminUser[]; roles: Map<string, FmzAccessControlRole>; query: string; onQuery: (query: string) => void; onCreate: () => void; onEdit: (user: FmzAdminUser) => void }) {
  return <div className="animate-[fmzFadeIn_.25s_ease]"><div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#9AA3B0]">Controle de Acesso</p><h1 className="font-syne text-[clamp(24px,4vw,34px)] font-extrabold tracking-[-.025em]">Usuários</h1><p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#5A6478]">Cadastre, edite e defina quais acessos cada usuário possui.</p></div><button onClick={onCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-3 font-syne text-[13px] font-bold uppercase tracking-[.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#162030] sm:w-auto"><Plus className="h-3.5 w-3.5" />Novo usuário</button></div><label className="relative mb-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B0]" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Buscar por nome, e-mail, telefone, wallet, imóvel ou role..." className="w-full rounded-[9px] border border-[#E8EAF0] bg-white py-3 pl-10 pr-4 text-[13.5px] outline-none transition focus:border-[#F5C842] focus:shadow-[0_0_0_3px_rgba(245,200,66,.12)]" /></label><div className="flex flex-col gap-3">{users.length ? users.map((user) => <UserRow key={user.id || user.email} user={user} roles={roles} onEdit={() => onEdit(user)} />) : <EmptyUsers hasQuery={Boolean(query.trim())} onCreate={onCreate} />}</div></div>;
}

function UserRow({ user, roles, onEdit }: { user: FmzAdminUser; roles: Map<string, FmzAccessControlRole>; onEdit: () => void }) {
  const [bg, fg] = avatarColor(user.id || user.email);
  const walletLabel = user.walletAddress || user.wallet || user.wallets[0]?.walletAddress;
  return <button onClick={onEdit} className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-[#E8EAF0] bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_10px_28px_rgba(13,19,33,.08)] sm:px-5 lg:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"><span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-syne text-[13px] font-bold" style={{ background: bg, color: fg }}>{initials(user.name)}</span><span className="min-w-0 flex-1"><span className="block truncate font-syne text-[14.5px] font-bold text-[#0D1321]">{user.name || 'Usuário sem nome'}</span><span className="mt-0.5 block truncate text-xs text-[#5A6478]">{[user.email, user.phone, walletLabel].filter(Boolean).join(' · ') || 'Sem dados de contato'}</span><span className="mt-2 flex flex-wrap gap-1.5">{user.roleKeys.length ? user.roleKeys.map((key) => { const role = roles.get(normalizeKey(key)); const color = role?.color || '#7F8C8D'; return <span key={key} className="rounded-md border px-2.5 py-0.5 text-[10.5px] font-semibold" style={{ background: `${color}18`, borderColor: `${color}30`, color }}>{role ? roleLabel(role) : key}</span>; }) : <span className="text-[11.5px] italic text-[#9AA3B0]">Sem tipos de acesso</span>}</span></span><span className="hidden items-center gap-5 whitespace-nowrap text-xs text-[#5A6478] lg:flex"><span>{user.wallets.length} wallet{user.wallets.length === 1 ? '' : 's'}</span><span>{user.tenantContracts.length} contrato{user.tenantContracts.length === 1 ? '' : 's'}</span><span>{user.coOwnerProperties.length} propriedade{user.coOwnerProperties.length === 1 ? '' : 's'}</span></span><span className="hidden items-center gap-1.5 whitespace-nowrap text-xs text-[#5A6478] lg:flex"><span className={fmzCn('h-2 w-2 rounded-full', user.status === 'active' ? 'bg-[#1A8C5B]' : 'bg-[#9AA3B0]')} />{user.status === 'active' ? 'Ativo' : 'Inativo'}</span><ChevronRight className="h-5 w-5 shrink-0 text-[#9AA3B0] transition group-hover:translate-x-0.5 group-hover:text-[#0D1321]" /></button>;
}

function EmptyUsers({ hasQuery, onCreate }: { hasQuery: boolean; onCreate: () => void }) {
  return <div className="rounded-2xl border border-dashed border-[#D0D4DE] bg-white px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#D0D4DE] bg-[#F7F8FA]"><UsersRound className="h-6 w-6 text-[#9AA3B0]" /></div><h2 className="font-syne text-base font-bold">{hasQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</h2><p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-[#5A6478]">{hasQuery ? 'Tente outro termo de busca.' : 'Crie o primeiro usuário para começar.'}</p>{!hasQuery && <button onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-3 font-syne text-[13px] font-bold uppercase text-white"><Plus className="h-3.5 w-3.5" />Criar agora</button>}</div>;
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

function DetailCard({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm"><div className="mb-4 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F8FA] text-[#0D1321]">{icon}</span><span><h2 className="font-syne text-[15px] font-bold">{title}</h2><p className="mt-0.5 text-[12px] text-[#9AA3B0]">{subtitle}</p></span></div>{children}</section>;
}

function AddressCard({ user }: { user: FmzAdminUser }) {
  const lines = [user.addressLine1, user.addressLine2, user.district, [user.city, user.state].filter(Boolean).join(' / '), user.postalCode, user.country].filter(Boolean);
  return <DetailCard icon={<MapPin className="h-4 w-4" />} title="Endereço do usuário" subtitle="Informação editável do cadastro"><div className="grid gap-2 text-[13px] text-[#5A6478]">{lines.length ? lines.map((line) => <p key={line}>{line}</p>) : <p className="italic text-[#9AA3B0]">Endereço não informado.</p>}{user.address && <p className="rounded-lg bg-[#F7F8FA] px-3 py-2 text-[#0D1321]">{user.address}</p>}</div></DetailCard>;
}

function WalletsCard({ wallets }: { wallets: FmzAdminUserWallet[] }) {
  return <DetailCard icon={<WalletCards className="h-4 w-4" />} title="Wallets" subtitle="Somente leitura: o administrador não edita wallets"><div className="flex flex-col gap-3">{wallets.length ? wallets.map((wallet, index) => <div key={wallet.id || wallet.walletAddress} className="rounded-xl border border-[#E8EAF0] bg-[#F7F8FA] p-3"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">Wallet {index + 1}</span><span className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#5A6478]">Chain {wallet.chainId}</span></div><p className="break-all font-mono text-[12px] text-[#0D1321]">{wallet.walletAddress}</p><div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]"><Badge>{wallet.walletType}</Badge><Badge>{wallet.custodyType}</Badge><Badge>{wallet.verificationStatus}</Badge><Badge>{wallet.status}</Badge></div></div>) : <p className="text-[13px] italic text-[#9AA3B0]">Nenhuma wallet vinculada.</p>}</div></DetailCard>;
}

function PropertiesCard({ user }: { user: FmzAdminUser }) {
  return <DetailCard icon={<Building2 className="h-4 w-4" />} title="Imóveis e tokens" subtitle="Relações tenant/co-owner e percentuais são somente leitura"><div className="flex flex-col gap-3">{user.coOwnerProperties.length ? user.coOwnerProperties.map((item) => <OwnershipView key={item.id || item.propertyId} item={item} />) : null}{user.propertyRelations.length ? user.propertyRelations.map((relation) => <RelationView key={relation.id || `${relation.propertyId}-${relation.relationType}`} relation={relation} />) : null}{!user.coOwnerProperties.length && !user.propertyRelations.length ? <p className="text-[13px] italic text-[#9AA3B0]">Nenhuma propriedade vinculada.</p> : null}</div></DetailCard>;
}

function OwnershipView({ item }: { item: FmzAdminCoOwnerProperty }) {
  return <div className="rounded-xl border border-[#E8EAF0] bg-[#F7F8FA] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-syne text-[13.5px] font-bold text-[#0D1321]">{item.property?.name || 'Propriedade'}</p><p className="mt-1 text-[11.5px] leading-5 text-[#5A6478]">{propertyAddress(item.property)}</p></div><span className="rounded-full border border-[#A8DFC4] bg-[#F0FAF5] px-2.5 py-1 text-[10.5px] font-bold text-[#1A8C5B]">{formatPercentage(item.ownershipPercentage)}</span></div><div className="mt-3 grid gap-2 text-[11.5px] text-[#5A6478] sm:grid-cols-3"><Metric label="Tokens" value={`${formatTokenAmount(item.tokenBalance)} ${item.tokenization?.tokenSymbol ?? ''}`.trim()} /><Metric label="Pendente" value={formatTokenAmount(item.pendingTokenBalance)} /><Metric label="Token ID" value={String(item.tokenization?.tokenId ?? '—')} /></div></div>;
}

function RelationView({ relation }: { relation: FmzAdminPropertyRelation }) {
  return <div className="rounded-xl border border-[#E8EAF0] bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-syne text-[13.5px] font-bold text-[#0D1321]">{relation.property?.name || 'Propriedade'}</p><p className="mt-1 text-[11.5px] leading-5 text-[#5A6478]">{propertyAddress(relation.property)}</p></div><Badge>{relation.relationType}</Badge></div></div>;
}

function ContractsCard({ contracts }: { contracts: FmzAdminTenantContract[] }) {
  return <DetailCard icon={<Home className="h-4 w-4" />} title="Contratos de inquilino" subtitle="Contratos ativos ou históricos retornados pelo backend"><div className="flex flex-col gap-3">{contracts.length ? contracts.map((contract) => <div key={contract.id} className="rounded-xl border border-[#E8EAF0] bg-[#F7F8FA] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-syne text-[13.5px] font-bold text-[#0D1321]">{contract.property?.name || contract.contractNumber || 'Contrato'}</p><p className="mt-1 text-[11.5px] text-[#5A6478]">{propertyAddress(contract.property)}</p></div><Badge>{contract.status || 'sem status'}</Badge></div><div className="mt-3 grid gap-2 text-[11.5px] text-[#5A6478] sm:grid-cols-3"><Metric label="Aluguel" value={formatMoney(contract.baseMonthlyRent, contract.currency || 'BRL')} /><Metric label="Vencimento" value={contract.paymentDay ? `Dia ${contract.paymentDay}` : '—'} /><Metric label="Índice" value={contract.rentAdjustmentIndex || '—'} /></div></div>) : <p className="text-[13px] italic text-[#9AA3B0]">Nenhum contrato como inquilino.</p>}</div></DetailCard>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <span className="rounded-lg bg-white px-3 py-2"><span className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">{label}</span><span className="mt-0.5 block font-semibold text-[#0D1321]">{value}</span></span>;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[#E8EAF0] bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#5A6478]">{children}</span>;
}

function Steps({ step }: { step: Step }) {
  const labels = ['Dados do usuário', 'Tipos de acesso', 'Confirmar e salvar'];
  return <div className="mb-8 overflow-hidden rounded-xl border border-[#E8EAF0] bg-white md:flex">{labels.map((label, index) => { const currentStep = (index + 1) as Step; const done = currentStep < step; const active = currentStep === step; return <div key={label} className={fmzCn('flex flex-1 items-center gap-3 border-b border-[#E8EAF0] px-4 py-3 md:border-b-0 md:border-r last:border-0', active && 'bg-[#FFFDF0]')}><span className={fmzCn('flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold', done ? 'border-[#1A8C5B] bg-[#1A8C5B] text-white' : active ? 'border-[#0D1321] bg-[#0D1321] text-white' : 'border-[#E8EAF0] bg-[#F7F8FA] text-[#9AA3B0]')}>{done ? <Check className="h-3 w-3" /> : currentStep}</span><span className={fmzCn('text-[12.5px] font-medium', done ? 'text-[#1A8C5B]' : active ? 'font-semibold text-[#0D1321]' : 'text-[#9AA3B0]')}>{label}</span></div>; })}</div>;
}

function BasicStep({ form, isEditing, onField, onNext }: { form: UserFormState; isEditing: boolean; onField: <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => void; onNext: () => void }) {
  return <div><div className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm sm:p-7"><h2 className="font-syne text-base font-bold">Quem é esse usuário?</h2><p className="mt-1 text-[13px] leading-6 text-[#5A6478]">Preencha os dados editáveis. Wallets, contratos e percentuais são somente leitura.</p><div className="mt-6 grid gap-x-5 sm:grid-cols-2"><Field className="sm:col-span-2" label="Nome completo *" value={form.name} placeholder="Ex: Mirella Souza" onChange={(value) => onField('name', value)} /><Field label="E-mail *" type="email" value={form.email} placeholder="email@exemplo.com" onChange={(value) => onField('email', value)} /><Field label="Telefone / WhatsApp" value={form.phone} placeholder="+55 11 9 0000-0000" onChange={(value) => onField('phone', value)} /><Field label={isEditing ? 'Nova senha (deixe em branco para manter)' : 'Senha *'} type="password" value={form.password} placeholder="Mínimo 8 caracteres" onChange={(value) => onField('password', value)} /><Field label="Nascimento" value={form.birthdate} placeholder="DD/MM/AAAA" onChange={(value) => onField('birthdate', formatBirthdateInput(value))} /><div className="mb-5"><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">Status da conta</span><div className="flex gap-2"><button type="button" onClick={() => onField('status', 'active')} className={fmzCn('flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition', form.status === 'active' ? 'border-[#1A8C5B] bg-[#F0FAF5] text-[#1A8C5B]' : 'border-[#E8EAF0] bg-white text-[#5A6478] hover:border-[#0D1321]')}>✓ Ativo</button><button type="button" onClick={() => onField('status', 'inactive')} className={fmzCn('flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition', form.status === 'inactive' ? 'border-[#9AA3B0] bg-[#F0F1F5] text-[#5A6478]' : 'border-[#E8EAF0] bg-white text-[#5A6478] hover:border-[#0D1321]')}>○ Inativo</button></div></div></div><div className="mt-2 rounded-2xl border border-[#E8EAF0] bg-[#F7F8FA] p-4"><div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.08em] text-[#5A6478]"><MapPin className="h-3.5 w-3.5" />Endereço</div><div className="grid gap-x-5 sm:grid-cols-2"><Field className="sm:col-span-2" label="Endereço completo" value={form.address} placeholder="Rua, número, complemento" onChange={(value) => onField('address', value)} /><Field label="Logradouro" value={form.addressLine1} placeholder="Rua X, 123" onChange={(value) => onField('addressLine1', value)} /><Field label="Complemento" value={form.addressLine2} placeholder="Apto 12" onChange={(value) => onField('addressLine2', value)} /><Field label="Bairro" value={form.district} placeholder="Centro" onChange={(value) => onField('district', value)} /><Field label="Cidade" value={form.city} placeholder="São Paulo" onChange={(value) => onField('city', value)} /><Field label="Estado" value={form.state} placeholder="SP" onChange={(value) => onField('state', value)} /><Field label="CEP" value={form.postalCode} placeholder="01000-000" onChange={(value) => onField('postalCode', value)} /><Field label="País" value={form.country} placeholder="BR" onChange={(value) => onField('country', value)} /></div></div></div><div className="mt-6 flex justify-end"><button onClick={onNext} className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 font-syne text-[13px] font-bold uppercase tracking-[.04em] text-white transition hover:-translate-y-0.5 sm:w-auto">Próximo: definir acessos<ChevronRight className="h-3.5 w-3.5" /></button></div></div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', className }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; className?: string }) {
  return <label className={fmzCn('mb-5 block', className)}><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-[9px] border border-[#E8EAF0] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,.13)]" /></label>;
}

function RolesStep({ roles, selectedRoleKeys, onToggleRole, onBack, onNext }: { roles: FmzAccessControlRole[]; selectedRoleKeys: string[]; onToggleRole: (roleKey: string) => void; onBack: () => void; onNext: () => void }) {
  const selected = new Set(selectedRoleKeys.map(normalizeKey));
  return <div><div className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm sm:p-7"><h2 className="font-syne text-base font-bold">O que esse usuário pode acessar?</h2><p className="mt-1 text-[13px] leading-6 text-[#5A6478]">As permissões e páginas vêm das roles retornadas pelo backend.</p><div className="mt-5 flex gap-2.5 rounded-xl border border-[#F0D870] bg-[#FFF9E6] px-4 py-3 text-[12.5px] text-[#7D5A00]"><ShieldCheck className="h-4 w-4 shrink-0" />O frontend envia apenas roles. Wallets, propriedades e ownership não são enviados no salvamento.</div><div className="mt-5 flex flex-col gap-2.5">{roles.map((role, index) => { const key = roleKey(role); const isOn = selected.has(key); const color = role.color || ROLE_COLORS[index % ROLE_COLORS.length]; return <button key={key} onClick={() => onToggleRole(key)} className={fmzCn('overflow-hidden rounded-xl border text-left transition', isOn ? 'border-[#F5C842]' : 'border-[#E8EAF0]')}><span className={fmzCn('flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F7F8FA]', isOn && 'bg-[#FFFDF0] hover:bg-[#FFFDF0]')}><span className={fmzCn('relative h-5 w-9 shrink-0 rounded-full transition', isOn ? 'bg-[#0D1321]' : 'bg-[#E8EAF0]')}><span className={fmzCn('absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', isOn ? 'translate-x-[19px]' : 'translate-x-[3px]')} /></span><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} /><span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-[#0D1321]">{roleLabel(role)}</span><span className="mt-0.5 block text-[11px] text-[#9AA3B0]">{roleDescription(role)}</span></span><span className="hidden whitespace-nowrap text-[11px] text-[#9AA3B0] sm:block">{role.permissionKeys.length} permissão{role.permissionKeys.length === 1 ? '' : 'ões'}</span></span></button>; })}</div></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-3 text-[13px] text-[#5A6478]"><ArrowLeft className="h-3.5 w-3.5" />Voltar</button><button onClick={onNext} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 font-syne text-[13px] font-bold uppercase text-white">Revisar e salvar<ChevronRight className="h-3.5 w-3.5" /></button></div></div>;
}

function SummaryStep({ form, roles, isEditing, saving, onBack, onSave, onDelete }: { form: UserFormState; roles: Map<string, FmzAccessControlRole>; isEditing: boolean; saving: boolean; onBack: () => void; onSave: () => void; onDelete: () => void }) {
  const [bg, fg] = avatarColor(form.id || form.email);
  return <div><div className="overflow-hidden rounded-2xl border border-[#E8EAF0] bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-[#E8EAF0] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-syne text-[15px] font-bold" style={{ background: bg, color: fg }}>{initials(form.name)}</span><span className="min-w-0 flex-1"><h2 className="truncate font-syne text-lg font-extrabold">{form.name || '—'}</h2><p className="mt-0.5 truncate text-[12.5px] text-[#5A6478]">{[form.email, form.phone, form.city].filter(Boolean).join(' · ') || '—'}</p></span><span className={fmzCn('inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold', form.status === 'active' ? 'border-[#A8DFC4] bg-[#F0FAF5] text-[#1A8C5B]' : 'border-[#E8EAF0] bg-[#F0F1F5] text-[#9AA3B0]')}>{form.status === 'active' ? '● Ativo' : '○ Inativo'}</span></div><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2"><div><div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">Tipos de acesso atribuídos</div><div className="flex flex-col gap-3">{form.roleKeys.length ? form.roleKeys.map((key) => { const role = roles.get(normalizeKey(key)); const color = role?.color || '#7F8C8D'; return <div key={key} className="flex items-center gap-3 rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] px-3 py-3"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /><span className="text-[13px] font-medium">{role ? roleLabel(role) : key}</span><span className="ml-auto hidden text-[11.5px] text-[#9AA3B0] sm:block">{role ? roleDescription(role) : 'Role retornada pelo backend'}</span></div>; }) : <div className="py-2 text-[13px] italic text-[#9AA3B0]">Nenhum tipo de acesso selecionado.</div>}</div></div><div><div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">Campos editáveis enviados</div><div className="rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] p-3 text-[12.5px] leading-6 text-[#5A6478]"><p>Nome, e-mail, telefone, status, roles, nascimento e endereço.</p><p className="mt-2 flex gap-2 text-[#7D5A00]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Wallets, contratos e percentuais de posse não são enviados no POST/PATCH.</p></div></div></div></div><div className="mt-6 flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-col-reverse gap-3 sm:flex-row"><button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-3 text-[13px] text-[#5A6478]"><ArrowLeft className="h-3.5 w-3.5" />Voltar</button>{isEditing && <button disabled={saving} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#F5C4BF] bg-[#FEF5F4] px-5 py-3 text-[13px] text-[#D94F3D] disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir usuário</button>}</div><button disabled={saving} onClick={onSave} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#F5C842] px-7 py-3 font-syne text-[13px] font-bold uppercase text-[#0D1321] shadow-[0_4px_16px_rgba(245,200,66,.3)] transition hover:-translate-y-0.5 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Salvar agora</button></div></div>;
}

function ToastView({ toast }: { toast: Toast }) {
  return <div className={fmzCn('fixed bottom-6 left-1/2 z-[400] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0D1321] px-5 py-3 text-[13px] font-medium text-white shadow-lg transition-all duration-300', toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}><span className={fmzCn('flex h-4 w-4 items-center justify-center rounded-full', toast?.ok ? 'bg-[#F5C842] text-[#0D1321]' : 'bg-[#D94F3D] text-white')}>{toast?.ok ? <Check className="h-2.5 w-2.5" /> : <Info className="h-2.5 w-2.5" />}</span>{toast?.message || 'Salvo!'}</div>;
}
