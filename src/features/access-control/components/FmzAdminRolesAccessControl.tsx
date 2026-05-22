'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronRight, FileText, Info, Loader2, Plus, Trash2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzFormAlert } from '../../api-errors/components';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain/fmz-api-error-normalizer';
import type { FmzAccessControlCatalog, FmzAccessControlPermission, FmzAccessControlRole } from '../domain';
import { createAccessControlRole, deleteAccessControlRole, getAccessControlCatalog, getAccessControlRole, getAccessControlRoles, updateAccessControlRole } from '../services';

const ROLE_COLORS = ['#E74C3C', '#E67E22', '#F1C40F', '#27AE60', '#16A085', '#2980B9', '#8E44AD', '#D35400', '#2C3E50', '#7F8C8D'] as const;
type Step = 1 | 2 | 3;
type Toast = { message: string; ok: boolean } | null;
const roleKey = (role: FmzAccessControlRole) => role.id || role.name;
const check = <Check className="h-3 w-3" aria-hidden="true" />;

export function FmzAdminRolesAccessControl() {
  const [catalog, setCatalog] = useState<FmzAccessControlCatalog>({ pages: [], permissions: [] });
  const [roles, setRoles] = useState<FmzAccessControlRole[]>([]);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [step, setStep] = useState<Step>(1);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(ROLE_COLORS[0]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<FmzNormalizedApiError | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const pageByKey = useMemo(() => new Map(catalog.pages.map((page) => [page.key, page])), [catalog.pages]);
  const permissionByKey = useMemo(() => new Map(catalog.permissions.map((permission) => [permission.key, permission])), [catalog.permissions]);
  const selectedRole = useMemo(() => roles.find((role) => roleKey(role) === editKey || role.id === editKey || role.name === editKey) ?? null, [editKey, roles]);
  const protectedRole = Boolean(selectedRole?.isProtected);

  const notify = useCallback((message: string, ok = true) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextCatalog, nextRoles] = await Promise.all([getAccessControlCatalog(), getAccessControlRoles()]);
      setCatalog(nextCatalog);
      setRoles(nextRoles);
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const resetForm = useCallback(() => {
    setStep(1); setName(''); setDescription(''); setColor(ROLE_COLORS[0]);
    setSelectedPermissions(new Set()); setExpandedPermissions(new Set()); setError(null);
  }, []);

  const openCreate = () => { resetForm(); setEditKey(null); setView('edit'); };
  const openEdit = async (role: FmzAccessControlRole) => {
    resetForm(); setEditKey(roleKey(role)); setView('edit');
    setName(role.name); setDescription(role.description); setColor(role.color || ROLE_COLORS[0]); setSelectedPermissions(new Set(role.permissionKeys));
    try {
      const details = await getAccessControlRole(roleKey(role));
      setName(details.name); setDescription(details.description); setColor(details.color || ROLE_COLORS[0]); setSelectedPermissions(new Set(details.permissionKeys));
      setRoles((currentRoles) => currentRoles.map((currentRole) => roleKey(currentRole) === roleKey(role) ? details : currentRole));
    } catch (err) { setError(normalizeFmzApiError(err)); }
  };
  const backToList = () => { setView('list'); setEditKey(null); resetForm(); };
  const goStep = (nextStep: Step) => {
    if (nextStep > 1 && !name.trim()) { notify('Informe o nome do tipo de acesso.', false); return; }
    setStep(nextStep);
  };
  const togglePermission = (permissionKey: string) => {
    if (protectedRole) return;
    setSelectedPermissions((current) => {
      const next = new Set(current);
      next.has(permissionKey) ? next.delete(permissionKey) : next.add(permissionKey);
      return next;
    });
  };
  const toggleExpanded = (permissionKey: string) => {
    setExpandedPermissions((current) => {
      const next = new Set(current);
      next.has(permissionKey) ? next.delete(permissionKey) : next.add(permissionKey);
      return next;
    });
  };
  const saveRole = async () => {
    if (!name.trim()) { notify('Informe o nome do tipo de acesso.', false); setStep(1); return; }
    if (protectedRole) { notify('Essa role é protegida e não pode ser alterada.', false); return; }
    if (Array.from(selectedPermissions).some((permissionKey) => !permissionByKey.has(permissionKey))) { notify('Existe uma permissão inválida selecionada.', false); setStep(2); return; }
    setSaving(true); setError(null);
    try {
      const payload = { name: name.trim(), description: description.trim(), color, permissionKeys: Array.from(selectedPermissions) };
      editKey ? await updateAccessControlRole(editKey, payload) : await createAccessControlRole(payload);
      setRoles(await getAccessControlRoles());
      notify(editKey ? 'Tipo de acesso atualizado.' : 'Novo tipo de acesso criado.');
      backToList();
    } catch (err) { setError(normalizeFmzApiError(err)); } finally { setSaving(false); }
  };
  const removeRole = async () => {
    if (!editKey || protectedRole) { notify('Essa role não pode ser excluída.', false); return; }
    if (!window.confirm('Excluir este tipo de acesso? Usuários com ele podem perder acesso ao sistema.')) return;
    setSaving(true); setError(null);
    try { await deleteAccessControlRole(editKey); setRoles(await getAccessControlRoles()); notify('Tipo de acesso excluído.'); backToList(); }
    catch (err) { setError(normalizeFmzApiError(err)); } finally { setSaving(false); }
  };

  return (
    <section className="min-h-[calc(100vh-124px)] w-full text-[#0D1321]">
      <div className="w-full">
        <div className="min-w-0">
          <FmzFormAlert error={error} />
          {loading ? <Loading /> : view === 'list' ? (
            <RoleList roles={roles} permissionByKey={permissionByKey} onCreate={openCreate} onEdit={openEdit} />
          ) : (
            <div className="animate-[fmzFadeIn_.25s_ease]">
              <button onClick={backToList} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9AA3B0] transition hover:text-[#0D1321]"><ArrowLeft className="h-3.5 w-3.5" />Voltar para a lista</button>
              <Steps step={step} />
              {protectedRole && <div className="mb-5 flex gap-3 rounded-xl border border-[#F0D870] bg-[#FFF9E6] px-4 py-3 text-[13px] text-[#7D5A00]"><Info className="h-4 w-4 shrink-0" />Essa role é protegida pelo sistema. Você pode consultar, mas não pode alterar ou excluir.</div>}
              {step === 1 && <BasicStep name={name} description={description} color={color} readOnly={protectedRole} onName={setName} onDescription={setDescription} onColor={setColor} onNext={() => goStep(2)} />}
              {step === 2 && <PermissionStep catalog={catalog} pageByKey={pageByKey} selected={selectedPermissions} expanded={expandedPermissions} readOnly={protectedRole} onToggle={togglePermission} onExpand={toggleExpanded} onBack={() => goStep(1)} onNext={() => goStep(3)} />}
              {step === 3 && <SummaryStep isEditing={Boolean(editKey)} protectedRole={protectedRole} saving={saving} name={name} description={description} color={color} permissions={Array.from(selectedPermissions).map((permissionKey) => permissionByKey.get(permissionKey)).filter(Boolean) as FmzAccessControlPermission[]} pageByKey={pageByKey} onBack={() => goStep(2)} onSave={saveRole} onDelete={removeRole} />}
            </div>
          )}
        </div>
      </div>
      <ToastView toast={toast} />
    </section>
  );
}

function Loading() { return <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-[#E8EAF0] bg-white"><span className="flex items-center gap-3 text-sm text-[#5A6478]"><Loader2 className="h-5 w-5 animate-spin" />Carregando controle de acesso...</span></div>; }
function RoleList({ roles, permissionByKey, onCreate, onEdit }: { roles: FmzAccessControlRole[]; permissionByKey: Map<string, FmzAccessControlPermission>; onCreate: () => void; onEdit: (role: FmzAccessControlRole) => void }) {
  return <div className="animate-[fmzFadeIn_.25s_ease]"><div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#9AA3B0]">Controle de Acesso</p><h1 className="text-[clamp(24px,4vw,34px)] font-extrabold tracking-[-.025em]">Tipos de Acesso (Roles)</h1><p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#5A6478]">Defina quais tipos de usuários existem no sistema e quais ações cada role pode executar.</p></div><button onClick={onCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-3 text-[13px] font-bold uppercase tracking-[.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#162030] sm:w-auto"><Plus className="h-3.5 w-3.5" />Criar novo tipo</button></div><div className="flex flex-col gap-3">{roles.length ? roles.map((role) => { const labels = role.permissionKeys.map((key) => permissionByKey.get(key)?.label ?? key); return <button key={roleKey(role)} onClick={() => onEdit(role)} className="group flex w-full items-center gap-4 rounded-xl border border-[#E8EAF0] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_8px_28px_rgba(13,19,33,.10)] sm:p-5"><span className="h-12 w-3 shrink-0 rounded" style={{ background: role.color }} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-[15px] font-bold">{role.name}{role.isProtected && <span className="rounded-full bg-[#FFF9E6] px-2 py-0.5 text-[10px] text-[#C8A020]">Protegida</span>}</span><span className="mt-0.5 block text-[12.5px] text-[#5A6478]">{role.description || 'Sem descrição'}</span><span className="mt-2 flex flex-wrap gap-1.5">{labels.length ? labels.slice(0, 4).map((label) => <span key={label} className="rounded-md border border-[#E8EAF0] bg-[#F7F8FA] px-2.5 py-0.5 text-[10.5px] text-[#5A6478]">{label}</span>) : <span className="text-xs italic text-[#9AA3B0]">Nenhum acesso definido</span>}{labels.length > 4 && <span className="rounded-md bg-[#0D1321] px-2.5 py-0.5 text-[10.5px] text-white">+{labels.length - 4} mais</span>}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-[#9AA3B0] transition group-hover:translate-x-0.5 group-hover:text-[#0D1321]" /></button>; }) : <div className="rounded-2xl border border-dashed border-[#D0D4DE] bg-white px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#D0D4DE] bg-[#F7F8FA]"><Plus className="h-6 w-6 text-[#9AA3B0]" /></div><h2 className="text-base font-bold">Nenhum tipo de acesso criado</h2><p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-[#5A6478]">Crie o primeiro tipo para começar a organizar quem pode fazer o quê no sistema.</p><button onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-6 py-3 text-[13px] font-bold uppercase text-white"><Plus className="h-3.5 w-3.5" />Criar agora</button></div>}</div></div>;
}
function Steps({ step }: { step: Step }) { const items: Array<[Step, string]> = [[1, 'Dados básicos'], [2, 'O que pode fazer?'], [3, 'Confirmar e salvar']]; return <div className="mb-8 overflow-hidden rounded-xl border border-[#E8EAF0] bg-white sm:flex">{items.map(([id, label], index) => <div key={id} className={fmzCn('flex flex-1 items-center gap-2.5 px-4 py-3.5 transition sm:px-5', id < step && 'bg-[#F0FAF5]', id === step && 'bg-[#FFFDF0]', index > 0 && 'border-t border-[#E8EAF0] sm:border-l sm:border-t-0')}><span className={fmzCn('flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold', id < step ? 'border-[#1A8C5B] bg-[#1A8C5B] text-white' : id === step ? 'border-[#0D1321] bg-[#0D1321] text-white' : 'border-[#E8EAF0] bg-[#F7F8FA] text-[#9AA3B0]')}>{id < step ? check : id}</span><span className={fmzCn('text-[12.5px] font-medium', id < step ? 'text-[#1A8C5B]' : id === step ? 'font-semibold text-[#0D1321]' : 'text-[#9AA3B0]')}>{label}</span></div>)}</div>; }
function BasicStep({ name, description, color, readOnly, onName, onDescription, onColor, onNext }: { name: string; description: string; color: string; readOnly: boolean; onName: (value: string) => void; onDescription: (value: string) => void; onColor: (value: string) => void; onNext: () => void }) { return <div className="animate-[fmzFadeIn_.25s_ease]"><div className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm sm:p-7"><h2 className="text-base font-bold">Como se chama esse tipo de usuário?</h2><p className="mt-1 text-[13px] leading-6 text-[#5A6478]">Dê um nome e descreva brevemente o que essa pessoa faz no sistema.</p><div className="mt-6 space-y-5"><label className="block"><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">Nome do tipo *</span><input disabled={readOnly} value={name} onChange={(event) => onName(event.target.value)} placeholder="Ex: Gerente, Investidor, Analista..." className="w-full rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-3.5 py-3 text-sm outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,.13)] disabled:opacity-60" /></label><label className="block"><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">Descrição <span className="normal-case tracking-normal text-[#9AA3B0]">(opcional)</span></span><input disabled={readOnly} value={description} onChange={(event) => onDescription(event.target.value)} placeholder="Ex: Responsável por aprovar investimentos" className="w-full rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-3.5 py-3 text-sm outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,.13)] disabled:opacity-60" /></label><div><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.07em] text-[#5A6478]">Cor de identificação</span><div className="flex flex-wrap gap-2">{ROLE_COLORS.map((item) => <button key={item} disabled={readOnly} onClick={() => onColor(item)} className={fmzCn('relative h-7 w-7 rounded-full border-[2.5px] transition hover:scale-110 disabled:opacity-60', item === color ? 'scale-110 border-[#0D1321]' : 'border-transparent')} style={{ background: item }}>{item === color && <Check className="absolute inset-0 m-auto h-3 w-3 text-white" />}</button>)}</div></div></div></div><div className="mt-6 flex justify-end"><button onClick={onNext} className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 text-[13px] font-bold uppercase text-white transition hover:-translate-y-0.5 sm:w-auto">Próximo: definir acessos<ChevronRight className="h-3.5 w-3.5" /></button></div></div>; }
function PermissionStep({ catalog, pageByKey, selected, expanded, readOnly, onToggle, onExpand, onBack, onNext }: { catalog: FmzAccessControlCatalog; pageByKey: Map<string, FmzAccessControlCatalog['pages'][number]>; selected: Set<string>; expanded: Set<string>; readOnly: boolean; onToggle: (key: string) => void; onExpand: (key: string) => void; onBack: () => void; onNext: () => void }) { return <div className="animate-[fmzFadeIn_.25s_ease]"><div className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-sm sm:p-7"><h2 className="text-base font-bold">O que esse tipo de usuário pode fazer?</h2><p className="mt-1 text-[13px] leading-6 text-[#5A6478]">Ative os acessos que fazem sentido para esse perfil. Clique na setinha para ver quais telas cada acesso libera.</p><div className="mt-5 flex gap-2.5 rounded-xl border border-[#F0D870] bg-[#FFF9E6] px-4 py-3 text-[12.5px] text-[#7D5A00]"><Info className="h-4 w-4 shrink-0" />Os acessos disponíveis são definidos pelo time técnico no backend. Você escolhe quais deles essa role vai ter.</div><div className="mt-5 flex flex-col gap-2.5">{catalog.permissions.map((permission) => { const isOn = selected.has(permission.key); const isExpanded = expanded.has(permission.key); const pages = permission.pageKeys.map((pageKey) => pageByKey.get(pageKey)).filter(Boolean); return <div key={permission.key} className={fmzCn('overflow-hidden rounded-xl border transition', isOn ? 'border-[#F5C842]' : 'border-[#E8EAF0]')}><div role="button" tabIndex={0} onClick={() => !readOnly && onToggle(permission.key)} className={fmzCn('flex cursor-pointer items-center gap-3 bg-white px-4 py-3.5 transition hover:bg-[#F7F8FA]', isOn && 'bg-[#FFFDF0] hover:bg-[#FFFDF0]', readOnly && 'cursor-default')}><span className={fmzCn('relative h-5 w-9 shrink-0 rounded-full transition', isOn ? 'bg-[#0D1321]' : 'bg-[#E8EAF0]')}><span className={fmzCn('absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', isOn ? 'translate-x-[19px]' : 'translate-x-[3px]')} /></span><span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium">{permission.label}</span><span className="mt-0.5 block truncate text-[11px] text-[#9AA3B0]">{permission.key}</span></span><button onClick={(event) => { event.stopPropagation(); onExpand(permission.key); }} className="rounded-md p-1 text-[#9AA3B0] transition hover:bg-white hover:text-[#0D1321]"><ChevronDown className={fmzCn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} /></button></div>{isExpanded && <div className={fmzCn('animate-[fmzFadeIn_.2s_ease] border-t border-dashed border-[#E8EAF0] px-4 pb-4 pt-3', isOn ? 'bg-[#FFFBF0]' : 'bg-[#FAFBFC]')}><div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-[#9AA3B0]"><FileText className="h-3 w-3" />Telas que esse acesso libera:</div><div className="flex flex-wrap gap-1.5">{pages.length ? pages.map((page) => <span key={page?.key} className="inline-flex items-center gap-1 rounded-md border border-[#E8EAF0] bg-white px-2.5 py-1 text-[11px] text-[#5A6478]"><FileText className="h-2.5 w-2.5 text-[#9AA3B0]" />{page?.label || page?.name}</span>) : <span className="text-xs italic text-[#9AA3B0]">Nenhuma tela vinculada.</span>}</div></div>}</div>; })}</div></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-3 text-[13px] text-[#5A6478]"><ArrowLeft className="h-3.5 w-3.5" />Voltar</button><button onClick={onNext} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 text-[13px] font-bold uppercase text-white">Revisar e salvar<ChevronRight className="h-3.5 w-3.5" /></button></div></div>; }
function SummaryStep({ isEditing, protectedRole, saving, name, description, color, permissions, pageByKey, onBack, onSave, onDelete }: { isEditing: boolean; protectedRole: boolean; saving: boolean; name: string; description: string; color: string; permissions: FmzAccessControlPermission[]; pageByKey: Map<string, FmzAccessControlCatalog['pages'][number]>; onBack: () => void; onSave: () => void; onDelete: () => void }) { return <div className="animate-[fmzFadeIn_.25s_ease]"><div className="overflow-hidden rounded-2xl border border-[#E8EAF0] bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-[#E8EAF0] px-5 py-4 sm:px-6"><span className="h-10 w-1.5 rounded" style={{ background: color }} /><span><h2 className="text-lg font-extrabold">{name || '—'}</h2><p className="mt-0.5 text-[12.5px] text-[#5A6478]">{description || 'Sem descrição'}</p></span></div><div className="p-5 sm:p-6"><div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.08em] text-[#9AA3B0]">✅ Acessos que essa role terá</div><div className="flex flex-col gap-2.5">{permissions.length ? permissions.map((permission) => <div key={permission.key} className="flex gap-3 rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] px-3 py-3"><span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-[#0D1321] text-white">{check}</span><span><span className="block text-[13px] font-medium">{permission.label}</span><span className="mt-1 flex flex-wrap gap-1">{permission.pageKeys.map((pageKey) => pageByKey.get(pageKey)).filter(Boolean).map((page) => <span key={page?.key} className="rounded border border-[#AED6F1] bg-[#EBF5FB] px-2 py-0.5 text-[10px] text-[#1A5276]">{page?.label || page?.name}</span>)}</span></span></div>) : <div className="py-2 text-[13px] italic text-[#9AA3B0]">Nenhum acesso selecionado.</div>}</div></div></div><div className="mt-6 flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-col-reverse gap-3 sm:flex-row"><button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#E8EAF0] bg-white px-5 py-3 text-[13px] text-[#5A6478]"><ArrowLeft className="h-3.5 w-3.5" />Voltar</button>{isEditing && <button disabled={protectedRole || saving} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#F5C4BF] bg-[#FEF5F4] px-5 py-3 text-[13px] text-[#D94F3D] disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir este tipo</button>}</div><button disabled={protectedRole || saving} onClick={onSave} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#F5C842] px-7 py-3 text-[13px] font-bold uppercase text-[#0D1321] shadow-[0_4px_16px_rgba(245,200,66,.3)] transition hover:-translate-y-0.5 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Salvar agora</button></div></div>; }
function ToastView({ toast }: { toast: Toast }) { return <div className={fmzCn('fixed bottom-6 left-1/2 z-[400] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0D1321] px-5 py-3 text-[13px] font-medium text-white shadow-lg transition-all duration-300', toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}><span className={fmzCn('flex h-4 w-4 items-center justify-center rounded-full', toast?.ok ? 'bg-[#F5C842] text-[#0D1321]' : 'bg-[#D94F3D] text-white')}>{toast?.ok ? <Check className="h-2.5 w-2.5" /> : <Info className="h-2.5 w-2.5" />}</span>{toast?.message || 'Salvo!'}</div>; }
