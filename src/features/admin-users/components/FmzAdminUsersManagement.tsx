'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Info, Loader2, Plus, Search, Trash2, UserRound, UsersRound } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzFormAlert } from '../../api-errors/components';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import type { FmzAccessControlRole } from '../../access-control/domain';
import { createAdminUser, deleteAdminUser, getAdminUserRoles, getAdminUsers, updateAdminUser } from '../services';
import type { FmzAdminUser, FmzAdminUserDraft, FmzAdminUserStatus } from '../domain';

type Step = 1 | 2 | 3;
type ViewMode = 'list' | 'edit';
type Toast = { message: string; ok: boolean } | null;

type UserFormState = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  status: FmzAdminUserStatus;
  roleKeys: string[];
};

const EMPTY_FORM: UserFormState = { name: '', email: '', phone: '', password: '', status: 'active', roleKeys: [] };
const ROLE_COLORS = ['#E74C3C', '#2980B9', '#8E44AD', '#27AE60', '#7F8C8D', '#F5C842'] as const;
const DEFAULT_ROLES: FmzAccessControlRole[] = [
  { id: 'admin', name: 'admin', description: 'Acesso total ao sistema', color: '#E74C3C', permissionKeys: [], isProtected: true },
  { id: 'tenant', name: 'tenant', description: 'Acesso da inquilina às próprias informações', color: '#27AE60', permissionKeys: [], isProtected: true },
  { id: 'co-owner', name: 'co-owner', description: 'Co-proprietário que recebe rentabilidades e vende porções de tokens', color: '#2980B9', permissionKeys: [], isProtected: true },
];

const normalizeKey = (value: string): string => value.trim().toLowerCase();
const roleKey = (role: FmzAccessControlRole): string => normalizeKey(role.id || role.name);
const roleLabel = (role: FmzAccessControlRole): string => {
  const key = roleKey(role);
  const labels: Record<string, string> = { admin: 'Administrador', tenant: 'Tenant', 'co-owner': 'Co-owner', co_owner: 'Co-owner' };
  return labels[key] ?? role.name;
};
const roleDescription = (role: FmzAccessControlRole): string => role.description || `${role.permissionKeys.length} permissões vinculadas`;
const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const initials = (name: string): string => name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'FT';
const avatarColor = (seed: string): readonly [string, string] => {
  const palette = [
    ['#FDE8D8', '#A04000'], ['#D5F5E3', '#1E8449'], ['#D6EAF8', '#1A5276'], ['#F9F0FF', '#6C3483'],
    ['#FEF9E7', '#9A7D0A'], ['#FDEDEC', '#C0392B'], ['#EAF2FF', '#154360'], ['#FDFEFE', '#616A6B'],
  ] as const;
  const sum = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[sum % palette.length];
};

const formFromUser = (user: FmzAdminUser): UserFormState => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  password: '',
  status: user.status,
  roleKeys: user.roleKeys,
});

export function FmzAdminUsersManagement() {
  const [users, setUsers] = useState<FmzAdminUser[]>([]);
  const [roles, setRoles] = useState<FmzAccessControlRole[]>(DEFAULT_ROLES);
  const [view, setView] = useState<ViewMode>('list');
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
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
    return users.filter((user) => [user.name, user.email, user.phone, user.wallet, user.roleKeys.join(' ')].some((value) => value.toLowerCase().includes(currentQuery)));
  }, [query, users]);

  const openCreate = () => { setForm(EMPTY_FORM); setStep(1); setView('edit'); setError(null); };
  const openEdit = (user: FmzAdminUser) => { setForm(formFromUser(user)); setStep(1); setView('edit'); setError(null); };
  const backToList = () => { setView('list'); setForm(EMPTY_FORM); setStep(1); setError(null); };
  const setField = <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => setForm((current) => ({ ...current, [field]: value }));

  const validateBasicData = () => {
    if (!form.name.trim()) { notify('Informe o nome completo.', false); return false; }
    if (!isValidEmail(form.email)) { notify('Informe um e-mail válido.', false); return false; }
    if (!isEditing && form.password.trim().length < 8) { notify('A senha precisa ter pelo menos 8 caracteres.', false); return false; }
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
    const payload: FmzAdminUserDraft = { ...form };
    try {
      if (isEditing) await updateAdminUser(payload);
      else await createAdminUser(payload);
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
    <section className="min-h-[calc(100vh-124px)] bg-[#F7F8FA] px-4 py-6 text-[#0D1321] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1120px]">
        <FmzFormAlert error={error} />
        {loading ? <Loading /> : view === 'list' ? (
          <UserList users={filteredUsers} roles={roleByKey} query={query} onQuery={setQuery} onCreate={openCreate} onEdit={openEdit} />
        ) : (
          <div className="animate-[fmzFadeIn_.25s_ease]">
            <button onClick={backToList} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9AA3B0] transition hover:text-[#0D1321]"><ArrowLeft className="h-3.5 w-3.5" />Voltar para a lista</button>
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

function UserList({ users, roles, query, onQuery, onCreate, onEdit }: { users: FmzAdminUser[]; roles: Map<string, FmzAccessControlRole>; query: string; onQuery: (query: string) => void; onCreate: () => void; onEdit: (user: FmzAdminUser) => void }) {
  return <div className="animate-[fmzFadeIn_.25s_ease]"><div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#9AA3B0]">Controle de Acesso</p><h1 className="font-syne text-[clamp(24px,4vw,34px)] font-extrabold tracking-[-.025em]">Usuários</h1><p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#5A6478]">Cadastre, edite e defina quais acessos cada usuário possui.</p></div><button onClick={onCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-3 font-syne text-[13px] font-bold uppercase tracking-[.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#162030] sm:w-auto"><Plus className="h-3.5 w-3.5" />Novo usuário</button></div><label className="relative mb-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B0]" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Buscar por nome, e-mail, telefone, wallet ou role..." className="w-full rounded-[9px] border border-[#E8EAF0] bg-white py-3 pl-10 pr-4 text-[13.5px] outline-none transition focus:border-[#F5C842] focus:shadow-[0_0_0_3px_rgba(245,200,66,.12)]" /></label><div className="flex flex-col gap-2.5">{users.length ? users.map((user) => <UserRow key={user.id || user.email} user={user} roles={roles} onEdit={() => onEdit(user)} />) : <EmptyUsers hasQuery={Boolean(query.trim())} onCreate={onCreate} />}</div></div>;
}

function UserRow({ user, roles, onEdit }: { user: FmzAdminUser; roles: Map<string, FmzAccessControlRole>; onEdit: () => void }) {
  const [bg, fg] = avatarColor(user.id || user.email);
  return <button onClick={onEdit} className="group flex w-full items-center gap-4 rounded-xl border border-[#E8EAF0] bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_6px_22px_rgba(13,19,33,.09)] sm:px-5"><span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-syne text-[13px] font-bold" style={{ background: bg, color: fg }}>{initials(user.name)}</span><span className="min-w-0 flex-1"><span className="block truncate font-syne text-[14.5px] font-bold text-[#0D1321]">{user.name || 'Usuário sem nome'}</span><span className="mt-0.5 block truncate text-xs text-[#5A6478]">{[user.email, user.phone, user.wallet].filter(Boolean).join(' · ') || 'Sem dados de contato'}</span><span className="mt-2 flex flex-wrap gap-1.5">{user.roleKeys.length ? user.roleKeys.map((key) => { const role = roles.get(normalizeKey(key)); const color = role?.color || '#7F8C8D'; return <span key={key} className="rounded-md border px-2.5 py-0.5 text-[10.5px] font-semibold" style={{ background: `${color}18`, borderColor: `${color}30`, color }}>{role ? roleLabel(role) : key}</span>; }) : <span className="text-[11.5px] italic text-[#9AA3B0]">Sem tipos de acesso</span>}</span></span><span className="hidden items-center gap-1.5 text-xs text-[#5A6478] sm:flex"><span className={fmzCn('h-2 w-2 rounded-full', user.status === 'active' ? 'bg-[#1A8C5B]' : 'bg-[#9AA3B0]')} />{user.status === 'active' ? 'Ativo' : 'Inativo'}</span><ChevronRight className="h-5 w-5 shrink-0 text-[#9AA3B0] transition group-hover:translate-x-0.5 group-hover:text-[#0D1321]" /></button>;
}

function EmptyUsers({ hasQuery, onCreate }: { hasQuery: boolean; onCreate: () => void }) {
  return <div className="rounded-2xl border border-dashed border-[#D0D4DE] bg-white px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#D0D4DE] bg-[#F7F8FA]"><UsersRound className="h-6 w-6 text-[#9AA3B0]" /></div><h2 className="font-syne text-base font-bold">{hasQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</h2><p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-[#5A6478]">{hasQuery ? 'Tente outro termo de busca.' : 'Crie o primeiro usuário para começar.'}</p>{!hasQuery && <button onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-3 font-syne text-[13px] font-bold uppercase text-white"><Plus className="h-3.5 w-3.5" />Criar agora</button>}</div>;
}

function Steps({ step }: { step: Step }) {
  const labels = ['Dados do usuário', 'Tipos de acesso', 'Confirmar e salvar'];
  return <div className="mb-8 overflow-hidden rounded-xl border border-[#E8EAF0] bg-white md:flex">{labels.map((label, index) => { const currentStep = (index + 1) as Step; const done = currentStep < step; const active = currentStep === step; return <div key={label} className={fmzCn('relative flex flex-1 items-center gap-3 px-4 py-3.5 transition md:px-5', done && 'bg-[#F0FAF5]', active && 'bg-[#FFFDF0]', index > 0 && 'border-t border-[#E8EAF0] md:border-l md:border-t-0')}><span className={fmzCn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold', done ? 'border-[#1A8C5B] bg-[#1A8C5B] text-white' : active ? 'border-[#0D1321] bg-[#0D1321] text-white' : 'border-[#E8EAF0] bg-[#F7F8FA] text-[#9AA3B0]')}>{done ? <Check className="h-3 w-3" /> : currentStep}</span><span className={fmzCn('text-[12.5px] font-medium', done ? 'text-[#1A8C5B]' : active ? 'font-semibold text-[#0D1321]' : 'text-[#9AA3B0]')}>{label}</span></div>; })}</div>;
}

function BasicStep({ form, isEditing, onField, onNext }: { form: UserFormState; isEditing: boolean; onField: <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => void; onNext: () => void }) {
  return <div><div className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm sm:p-7"><h2 className="font-syne text-base font-bold">Quem é esse usuário?</h2><p className="mt-1 text-[13px] leading-6 text-[#5A6478]">Preencha os dados de contato. O e-mail será usado para acesso ao sistema.</p><div className="mt-6 grid gap-x-5 sm:grid-cols-2"><Field className="sm:col-span-2" label="Nome completo *" value={form.name} placeholder="Ex: Mirella Souza" onChange={(value) => onField('name', value)} /><Field label="E-mail *" type="email" value={form.email} placeholder="email@exemplo.com" onChange={(value) => onField('email', value)} /><Field label="Telefone / WhatsApp" value={form.phone} placeholder="+55 11 9 0000-0000" onChange={(value) => onField('phone', value)} /><Field label={isEditing ? 'Nova senha (deixe em branco para manter)' : 'Senha *'} type="password" value={form.password} placeholder="Mínimo 8 caracteres" onChange={(value) => onField('password', value)} /><div className="mb-5"><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">Status da conta</span><div className="flex gap-2"><button type="button" onClick={() => onField('status', 'active')} className={fmzCn('flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition', form.status === 'active' ? 'border-[#1A8C5B] bg-[#F0FAF5] text-[#1A8C5B]' : 'border-[#E8EAF0] bg-white text-[#5A6478] hover:border-[#0D1321]')}>✓ Ativo</button><button type="button" onClick={() => onField('status', 'inactive')} className={fmzCn('flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition', form.status === 'inactive' ? 'border-[#9AA3B0] bg-[#F0F1F5] text-[#5A6478]' : 'border-[#E8EAF0] bg-white text-[#5A6478] hover:border-[#0D1321]')}>○ Inativo</button></div></div></div></div><div className="mt-6 flex justify-end"><button onClick={onNext} className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 font-syne text-[13px] font-bold uppercase tracking-[.04em] text-white transition hover:-translate-y-0.5 sm:w-auto">Próximo: definir acessos<ChevronRight className="h-3.5 w-3.5" /></button></div></div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', className }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; className?: string }) {
  return <label className={fmzCn('mb-5 block', className)}><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-3.5 py-3 text-sm outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,.13)]" /></label>;
}

function RolesStep({ roles, selectedRoleKeys, onToggleRole, onBack, onNext }: { roles: FmzAccessControlRole[]; selectedRoleKeys: string[]; onToggleRole: (roleKey: string) => void; onBack: () => void; onNext: () => void }) {
  const selected = new Set(selectedRoleKeys.map(normalizeKey));
  return <div><div className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm sm:p-7"><h2 className="font-syne text-base font-bold">O que esse usuário pode acessar?</h2><p className="mt-1 text-[13px] leading-6 text-[#5A6478]">Ative os tipos de acesso que fazem sentido para esse perfil. Um usuário pode ter mais de um.</p><div className="mt-5 flex gap-2.5 rounded-xl border border-[#F0D870] bg-[#FFF9E6] px-4 py-3 text-[12.5px] text-[#7D5A00]"><Info className="h-4 w-4 shrink-0" />Os tipos de acesso controlam quais telas e funcionalidades esse usuário enxerga no sistema.</div><div className="mt-5 flex flex-col gap-2.5">{roles.map((role, index) => { const key = roleKey(role); const isOn = selected.has(key); const color = role.color || ROLE_COLORS[index % ROLE_COLORS.length]; return <button key={key} onClick={() => onToggleRole(key)} className={fmzCn('overflow-hidden rounded-xl border text-left transition', isOn ? 'border-[#F5C842]' : 'border-[#E8EAF0]')}><span className={fmzCn('flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F7F8FA]', isOn && 'bg-[#FFFDF0] hover:bg-[#FFFDF0]')}><span className={fmzCn('relative h-5 w-9 shrink-0 rounded-full transition', isOn ? 'bg-[#0D1321]' : 'bg-[#E8EAF0]')}><span className={fmzCn('absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', isOn ? 'translate-x-[19px]' : 'translate-x-[3px]')} /></span><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} /><span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-[#0D1321]">{roleLabel(role)}</span><span className="mt-0.5 block text-[11px] text-[#9AA3B0]">{roleDescription(role)}</span></span><span className="hidden whitespace-nowrap text-[11px] text-[#9AA3B0] sm:block">{role.permissionKeys.length} permissão{role.permissionKeys.length === 1 ? '' : 'ões'}</span></span></button>; })}</div></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-3 text-[13px] text-[#5A6478]"><ArrowLeft className="h-3.5 w-3.5" />Voltar</button><button onClick={onNext} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 font-syne text-[13px] font-bold uppercase text-white">Revisar e salvar<ChevronRight className="h-3.5 w-3.5" /></button></div></div>;
}

function SummaryStep({ form, roles, isEditing, saving, onBack, onSave, onDelete }: { form: UserFormState; roles: Map<string, FmzAccessControlRole>; isEditing: boolean; saving: boolean; onBack: () => void; onSave: () => void; onDelete: () => void }) {
  const [bg, fg] = avatarColor(form.id || form.email);
  return <div><div className="overflow-hidden rounded-2xl border border-[#E8EAF0] bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-[#E8EAF0] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-syne text-[15px] font-bold" style={{ background: bg, color: fg }}>{initials(form.name)}</span><span className="min-w-0 flex-1"><h2 className="truncate font-syne text-lg font-extrabold">{form.name || '—'}</h2><p className="mt-0.5 truncate text-[12.5px] text-[#5A6478]">{[form.email, form.phone].filter(Boolean).join(' · ') || '—'}</p></span><span className={fmzCn('inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold', form.status === 'active' ? 'border-[#A8DFC4] bg-[#F0FAF5] text-[#1A8C5B]' : 'border-[#E8EAF0] bg-[#F0F1F5] text-[#9AA3B0]')}>{form.status === 'active' ? '● Ativo' : '○ Inativo'}</span></div><div className="p-5 sm:p-6"><div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">Tipos de acesso atribuídos</div><div className="flex flex-col gap-2.5">{form.roleKeys.length ? form.roleKeys.map((key) => { const role = roles.get(normalizeKey(key)); const color = role?.color || '#7F8C8D'; return <div key={key} className="flex items-center gap-3 rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] px-3 py-3"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /><span className="text-[13px] font-medium">{role ? roleLabel(role) : key}</span><span className="ml-auto hidden text-[11.5px] text-[#9AA3B0] sm:block">{role ? roleDescription(role) : 'Role retornada pelo backend'}</span></div>; }) : <div className="py-2 text-[13px] italic text-[#9AA3B0]">Nenhum tipo de acesso selecionado.</div>}</div></div></div><div className="mt-6 flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-col-reverse gap-3 sm:flex-row"><button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-3 text-[13px] text-[#5A6478]"><ArrowLeft className="h-3.5 w-3.5" />Voltar</button>{isEditing && <button disabled={saving} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#F5C4BF] bg-[#FEF5F4] px-5 py-3 text-[13px] text-[#D94F3D] disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir usuário</button>}</div><button disabled={saving} onClick={onSave} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#F5C842] px-7 py-3 font-syne text-[13px] font-bold uppercase text-[#0D1321] shadow-[0_4px_16px_rgba(245,200,66,.3)] transition hover:-translate-y-0.5 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Salvar agora</button></div></div>;
}

function ToastView({ toast }: { toast: Toast }) {
  return <div className={fmzCn('fixed bottom-6 left-1/2 z-[400] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0D1321] px-5 py-3 text-[13px] font-medium text-white shadow-lg transition-all duration-300', toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}><span className={fmzCn('flex h-4 w-4 items-center justify-center rounded-full', toast?.ok ? 'bg-[#F5C842] text-[#0D1321]' : 'bg-[#D94F3D] text-white')}>{toast?.ok ? <Check className="h-2.5 w-2.5" /> : <Info className="h-2.5 w-2.5" />}</span>{toast?.message || 'Salvo!'}</div>;
}
