'use client';

import { useCallback, useEffect, useMemo, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzFormAlert } from '../../api-errors/components';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import {
  buildDraftFromProperty,
  createAdminProperty,
  deleteAdminProperty,
  emptyAdminPropertyDraft,
  getAdminProperties,
  getAdminProperty,
  lookupCepAddress,
  updateAdminProperty,
} from '../services';
import type { FmzAdminProperty, FmzAdminPropertyDraft, FmzAdminPropertyStatus, FmzAdminPropertyType } from '../domain';

type ViewMode = 'list' | 'edit';
type Step = 1 | 2 | 3 | 4;
type Toast = { message: string; ok: boolean } | null;

type FieldErrors = Partial<Record<keyof FmzAdminPropertyDraft, string>>;

const TOTAL_STEPS = 4;
const PROPERTY_TYPE_OPTIONS: Array<{ key: FmzAdminPropertyType; label: string; icon: string }> = [
  { key: 'apartment', label: 'Apartamento', icon: '🏢' },
  { key: 'house', label: 'Casa', icon: '🏠' },
  { key: 'commercial', label: 'Comercial', icon: '🏪' },
  { key: 'land', label: 'Terreno', icon: '🌳' },
];
const STATUS_OPTIONS: Array<{ key: FmzAdminPropertyStatus; label: string }> = [
  { key: 'disponivel', label: 'Disponível' },
  { key: 'alugado', label: 'Alugado' },
  { key: 'vendido', label: 'Vendido' },
  { key: 'inativo', label: 'Inativo' },
];
const STATE_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const typeIconByKey = new Map(PROPERTY_TYPE_OPTIONS.map((option) => [option.key, option.icon]));
const typeLabelByKey = new Map(PROPERTY_TYPE_OPTIONS.map((option) => [option.key, option.label]));
const statusLabelByKey = new Map(STATUS_OPTIONS.map((option) => [option.key, option.label]));
const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compactMoneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};
const formatMoney = (value: string | number | null | undefined): string => moneyFormatter.format(toNumber(value));
const formatCompactMoney = (value: number): string => compactMoneyFormatter.format(value);
const formatMoneyInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};
const digitsOnly = (value: string): string => value.replace(/\D/g, '');
const propertyAddress = (property: FmzAdminProperty): string => [[property.addressLine1, property.addressNumber].filter(Boolean).join(' '), property.addressLine2, property.district, property.city && property.state ? `${property.city} — ${property.state}` : property.city || property.state].filter(Boolean).join(', ') || 'Endereço não informado';
const summaryAddress = (draft: FmzAdminPropertyDraft): string => [
  [draft.addressLine1, draft.addressNumber].filter(Boolean).join(' '),
  draft.addressLine2,
  draft.district,
  draft.city && draft.state ? `${draft.city} — ${draft.state}` : draft.city || draft.state,
  draft.postalCode,
].filter(Boolean).join(', ') || '—';
const normalizeText = (value: string): string => value.trim().toLowerCase();

const statusClasses: Record<FmzAdminPropertyStatus, { dot: string; badge: string; button: string; label: string }> = {
  disponivel: {
    dot: 'bg-[#1A8C5B]',
    badge: 'border-[#A8DFC4] bg-[#F0FAF5] text-[#1A8C5B]',
    button: 'border-[#1A8C5B] bg-[#F0FAF5] text-[#1A8C5B]',
    label: '✓ Disponível',
  },
  alugado: {
    dot: 'bg-[#3B82F6]',
    badge: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]',
    button: 'border-[#3B82F6] bg-[#EFF6FF] text-[#2563EB]',
    label: '🔑 Alugado',
  },
  vendido: {
    dot: 'bg-[#C8A020]',
    badge: 'border-[#F0D870] bg-[#FFF9E6] text-[#C8A020]',
    button: 'border-[#C8A020] bg-[#FFF9E6] text-[#C8A020]',
    label: '🏷️ Vendido',
  },
  inativo: {
    dot: 'bg-[#9AA3B0]',
    badge: 'border-[#E8EAF0] bg-[#F0F1F5] text-[#5A6478]',
    button: 'border-[#9AA3B0] bg-[#F0F1F5] text-[#5A6478]',
    label: '○ Inativo',
  },
};

function PropertyField({ label, children, error, full = false, span2 = false }: { label: string; children: ReactNode; error?: string; full?: boolean; span2?: boolean }) {
  return (
    <label className={fmzCn('mb-[18px] block', full && 'md:col-span-2', span2 && 'md:col-span-2')}>
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5A6478]">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[11.5px] text-[#D94F3D]">{error}</span> : null}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { className, error, ...rest } = props;
  return (
    <input
      {...rest}
      className={fmzCn(
        'w-full rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] px-[14px] py-[11px] text-sm text-[#0D1321] outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,0.13)]',
        error && 'border-[#F5C4BF] bg-[#FEF5F4]',
        className,
      )}
    />
  );
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  const { className, error, ...rest } = props;
  return (
    <select
      {...rest}
      className={fmzCn(
        'w-full rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] px-[14px] py-[11px] text-sm text-[#0D1321] outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,0.13)]',
        error && 'border-[#F5C4BF] bg-[#FEF5F4]',
        className,
      )}
    />
  );
}

function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  const { className, error, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={fmzCn(
        'min-h-[80px] w-full resize-y rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] px-[14px] py-[11px] text-sm text-[#0D1321] outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,0.13)]',
        error && 'border-[#F5C4BF] bg-[#FEF5F4]',
        className,
      )}
    />
  );
}

export function FmzAdminPropertiesManagement() {
  const [properties, setProperties] = useState<FmzAdminProperty[]>([]);
  const [view, setView] = useState<ViewMode>('list');
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FmzAdminPropertyStatus | ''>('');
  const [form, setForm] = useState<FmzAdminPropertyDraft>(emptyAdminPropertyDraft);
  const [selectedProperty, setSelectedProperty] = useState<FmzAdminProperty | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<FmzNormalizedApiError | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const isEditing = Boolean(form.id);

  const notify = useCallback((message: string, ok = true) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProperties(await getAdminProperties());
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProperties(); }, [loadProperties]);

  const stats = useMemo(() => {
    let totalValue = 0;
    let available = 0;
    properties.forEach((property) => {
      totalValue += property.appraisedValue;
      if (property.status === 'disponivel') available += 1;
    });
    return { total: properties.length, available, totalValue };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const currentQuery = normalizeText(query);
    return properties.filter((property) => {
      const matchesStatus = !statusFilter || property.status === statusFilter;
      if (!matchesStatus) return false;
      if (!currentQuery) return true;
      return [property.name, property.description ?? '', property.addressLine1 ?? '', property.district ?? '', property.city ?? '', property.state ?? '', property.postalCode ?? ''].some((value) => normalizeText(value).includes(currentQuery));
    });
  }, [properties, query, statusFilter]);

  const updateForm = useCallback(<K extends keyof FmzAdminPropertyDraft>(key: K, value: FmzAdminPropertyDraft[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }, []);

  const resetToList = useCallback(() => {
    setView('list');
    setStep(1);
    setSelectedProperty(null);
    setForm(emptyAdminPropertyDraft());
    setFieldErrors({});
  }, []);

  const openNewProperty = useCallback(() => {
    setSelectedProperty(null);
    setForm(emptyAdminPropertyDraft());
    setFieldErrors({});
    setStep(1);
    setView('edit');
  }, []);

  const openProperty = useCallback(async (property: FmzAdminProperty) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const detailedProperty = await getAdminProperty(property.id).catch(() => property);
      setSelectedProperty(detailedProperty);
      setForm(buildDraftFromProperty(detailedProperty));
      setFieldErrors({});
      setStep(1);
      setView('edit');
    } catch (err) {
      setError(normalizeFmzApiError(err));
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const validateStep = useCallback((targetStep: Step): boolean => {
    const nextErrors: FieldErrors = {};
    if (targetStep === 1) {
      if (!form.name.trim()) nextErrors.name = 'Informe um nome para o imóvel.';
      if (!form.propertyType) nextErrors.propertyType = 'Selecione o tipo do imóvel.';
    }
    if (targetStep === 2) {
      if (digitsOnly(form.postalCode).length !== 8) nextErrors.postalCode = 'Informe um CEP válido.';
      if (!form.state.trim()) nextErrors.state = 'Selecione o estado.';
      if (!form.addressLine1.trim()) nextErrors.addressLine1 = 'Informe o logradouro.';
      if (!form.addressNumber.trim()) nextErrors.addressNumber = 'Informe o número.';
      if (!form.district.trim()) nextErrors.district = 'Informe o bairro.';
      if (!form.city.trim()) nextErrors.city = 'Informe a cidade.';
    }
    if (targetStep === 3) {
      if (toNumber(form.appraisedValue) <= 0) nextErrors.appraisedValue = 'Informe o valor total do imóvel.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) notify('Corrija os campos destacados.', false);
    return Object.keys(nextErrors).length === 0;
  }, [form, notify]);

  const goStep = useCallback((nextStep: Step) => {
    if (nextStep > step && !validateStep(step)) return;
    setStep(nextStep);
  }, [step, validateStep]);

  const handleCepBlur = useCallback(async () => {
    const postalCode = form.postalCode;
    if (digitsOnly(postalCode).length !== 8) return;
    setCepLoading(true);
    try {
      const address = await lookupCepAddress(postalCode);
      if (!address) return;
      setForm((previous) => ({
        ...previous,
        postalCode: formatCep(address.postalCode),
        addressLine1: address.addressLine1 || previous.addressLine1,
        district: address.district || previous.district,
        city: address.city || previous.city,
        state: address.state || previous.state,
      }));
    } finally {
      setCepLoading(false);
    }
  }, [form.postalCode]);

  const saveProperty = useCallback(async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setSaving(true);
    setError(null);
    try {
      const savedProperty = isEditing ? await updateAdminProperty(form) : await createAdminProperty(form);
      setProperties((previous) => {
        const currentById = new Map(previous.map((property) => [property.id, property]));
        currentById.set(savedProperty.id, savedProperty);
        return Array.from(currentById.values());
      });
      notify(isEditing ? 'Imóvel atualizado com sucesso! ✓' : 'Novo imóvel cadastrado! ✓');
      resetToList();
    } catch (err) {
      setError(normalizeFmzApiError(err));
      notify('Não foi possível salvar o imóvel.', false);
    } finally {
      setSaving(false);
    }
  }, [form, isEditing, notify, resetToList, validateStep]);

  const removeProperty = useCallback(async () => {
    if (!form.id) return;
    const confirmed = window.confirm(`Excluir "${form.name}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    try {
      await deleteAdminProperty(form.id);
      setProperties((previous) => previous.filter((property) => property.id !== form.id));
      notify('Imóvel excluído.');
      resetToList();
    } catch (err) {
      setError(normalizeFmzApiError(err));
      notify('Não foi possível excluir o imóvel.', false);
    } finally {
      setSaving(false);
    }
  }, [form.id, form.name, notify, resetToList]);

  const stepItems = [
    { id: 1, label: 'Dados do imóvel' },
    { id: 2, label: 'Endereço' },
    { id: 3, label: 'Financeiro' },
    { id: 4, label: 'Confirmar e salvar' },
  ] as const;

  return (
    <section className="min-h-[calc(100vh-124px)] bg-[#F7F8FA] px-4 py-6 text-[#0D1321] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1120px]">
        {error ? <div className="mb-5"><FmzFormAlert error={error} /></div> : null}

        {view === 'list' ? (
        <section>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9AA3B0]">Gestão de Portfólio</div>
              <h1 className="font-['Syne'] text-[26px] font-extrabold tracking-[-0.025em] text-[#0D1321]">Imóveis</h1>
              <p className="mt-1 text-[13px] leading-6 text-[#5A6478]">Cadastre e gerencie os imóveis disponíveis no portfólio.</p>
            </div>
            <button type="button" onClick={openNewProperty} className="inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-[22px] py-[11px] font-['Syne'] text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#162030]">
              <Plus size={14} /> Novo imóvel
            </button>
          </div>

          <div className="mb-[22px] grid grid-cols-1 gap-3 lg:grid-cols-3">
            <article className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white p-4">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] bg-[#F0F1F5]"><Building2 size={18} className="text-[#5A6478]" /></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">Total de imóveis</div><div className="font-['Syne'] text-[22px] font-extrabold text-[#0D1321]">{stats.total}</div></div>
            </article>
            <article className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white p-4">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] bg-[#F0FAF5]"><Check size={18} className="text-[#1A8C5B]" /></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">Disponíveis</div><div className="font-['Syne'] text-[22px] font-extrabold text-[#1A8C5B]">{stats.available}</div></div>
            </article>
            <article className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white p-4">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] bg-[#FFF9E6]"><CircleDollarSign size={18} className="text-[#C8A020]" /></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">Valor total</div><div className="font-['Syne'] text-[15px] font-extrabold text-[#0D1321]">{formatCompactMoney(stats.totalValue)}</div></div>
            </article>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <label className="relative min-w-[180px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B0]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white py-2.5 pl-[38px] pr-3.5 text-[13.5px] text-[#0D1321] outline-none transition focus:border-[#F5C842] focus:shadow-[0_0_0_3px_rgba(245,200,66,0.12)]" placeholder="Buscar por nome, endereço ou cidade..." />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FmzAdminPropertyStatus | '')} className="rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-3.5 py-2.5 text-[13px] text-[#5A6478] outline-none transition focus:border-[#F5C842]">
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border-[1.5px] border-[#E8EAF0] bg-white text-[#5A6478]"><Loader2 className="mr-2 animate-spin" size={18} /> Carregando imóveis...</div>
          ) : filteredProperties.length ? (
            <div className="flex flex-col gap-2.5">
              {filteredProperties.map((property) => (
                <button key={property.id || property.name} type="button" onClick={() => void openProperty(property)} className="group flex w-full flex-col gap-3 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_6px_22px_rgba(13,19,33,0.09)] sm:flex-row sm:items-center md:px-5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center self-start rounded-[10px] bg-[#F0F1F5] text-xl sm:self-auto">{typeIconByKey.get(property.propertyType) ?? '🏢'}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-['Syne'] text-[14.5px] font-bold text-[#0D1321]">{property.name}</div>
                    <div className="mt-0.5 truncate text-xs text-[#5A6478]">{propertyAddress(property)}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded-[5px] border border-[#E8EAF0] bg-[#F0F1F5] px-2 py-0.5 text-[10.5px] font-semibold text-[#5A6478]">{typeLabelByKey.get(property.propertyType)}</span>
                      {property.totalAreaM2 ? <span className="rounded-[5px] border border-[#E8EAF0] bg-[#F0F1F5] px-2 py-0.5 text-[10.5px] font-semibold text-[#5A6478]">{property.totalAreaM2} m²</span> : null}
                      {property.bedroomsCount ? <span className="rounded-[5px] border border-[#E8EAF0] bg-[#F0F1F5] px-2 py-0.5 text-[10.5px] font-semibold text-[#5A6478]">{property.bedroomsCount} quartos</span> : null}
                    </div>
                  </div>
                  <div className="hidden flex-shrink-0 flex-col items-end gap-1.5 sm:flex">
                    <div className="font-['Syne'] text-sm font-bold text-[#0D1321]">{formatMoney(property.appraisedValue)}</div>
                    <div className="flex items-center gap-1.5 text-xs text-[#5A6478]"><span className={fmzCn('h-[7px] w-[7px] rounded-full', statusClasses[property.status].dot)} />{statusLabelByKey.get(property.status)}</div>
                  </div>
                  <ChevronRight size={18} className="hidden flex-shrink-0 text-[#9AA3B0] transition group-hover:translate-x-0.5 group-hover:text-[#0D1321] sm:block" />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-[1.5px] border-[#E8EAF0] bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#E8EAF0] bg-[#F7F8FA]"><Building2 size={24} className="text-[#D0D4DE]" /></div>
              <h3 className="mb-1.5 font-['Syne'] text-base font-bold text-[#0D1321]">{query || statusFilter ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}</h3>
              <p className="mx-auto mb-5 max-w-[300px] text-[13px] leading-6 text-[#5A6478]">{query || statusFilter ? 'Tente outro filtro ou termo de busca.' : 'Adicione o primeiro imóvel ao portfólio.'}</p>
              {!query && !statusFilter ? <button type="button" onClick={openNewProperty} className="inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-[22px] py-[11px] font-['Syne'] text-[13px] font-bold uppercase tracking-[0.04em] text-white"><Plus size={14} /> Cadastrar agora</button> : null}
            </div>
          )}
        </section>
      ) : (
        <section>
          <button type="button" onClick={resetToList} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9AA3B0] transition hover:text-[#0D1321]"><ArrowLeft size={14} /> Voltar para a lista</button>
          {detailsLoading ? <div className="mb-4 flex items-center text-sm text-[#5A6478]"><Loader2 className="mr-2 animate-spin" size={16} /> Carregando detalhes...</div> : null}

          <div className="mb-8 flex flex-col overflow-hidden rounded-xl border-[1.5px] border-[#E8EAF0] bg-white md:flex-row">
            {stepItems.map((item) => {
              const isDone = item.id < step;
              const isActive = item.id === step;
              return (
                <button key={item.id} type="button" onClick={() => goStep(item.id)} className={fmzCn('relative flex flex-1 items-center gap-2.5 px-[18px] py-3.5 text-left transition md:before:absolute md:before:left-0 md:before:top-[20%] md:before:h-[60%] md:before:w-px md:before:bg-[#E8EAF0] first:before:hidden', isDone && 'bg-[#F0FAF5]', isActive && 'bg-[#FFFDF0]')}>
                  <span className={fmzCn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] font-[Syne] text-[11px] font-bold text-[#9AA3B0]', isDone && 'border-[#1A8C5B] bg-[#1A8C5B] text-white', isActive && 'border-[#0D1321] bg-[#0D1321] text-white')}>{isDone ? '✓' : item.id}</span>
                  <span className={fmzCn('text-[12.5px] font-medium text-[#9AA3B0]', isDone && 'text-[#1A8C5B]', isActive && 'font-semibold text-[#0D1321]')}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {step === 1 ? (
            <div>
              <div className="mb-4 rounded-[14px] border-[1.5px] border-[#E8EAF0] bg-white p-7">
                <h2 className="mb-1 font-['Syne'] text-base font-bold text-[#0D1321]">Qual é esse imóvel?</h2>
                <p className="mb-[22px] text-[13px] leading-6 text-[#5A6478]">Informe o nome de identificação, o tipo e o status atual do imóvel.</p>
                <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
                  <PropertyField label="Nome / Identificação *" error={fieldErrors.name} full><TextInput value={form.name} onChange={(event) => updateForm('name', event.target.value)} error={Boolean(fieldErrors.name)} placeholder="Ex: Apartamento Jardins 302" /></PropertyField>
                  <PropertyField label="Código do imóvel"><TextInput value={form.propertyCode} onChange={(event) => updateForm('propertyCode', event.target.value)} placeholder="Ex: apt-jardins-302" /></PropertyField>
                  <PropertyField label="Descrição" full><TextAreaInput value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Descreva brevemente o imóvel, diferenciais, características..." /></PropertyField>
                </div>
                <div className="mb-[18px]">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5A6478]">Tipo do imóvel *</div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <button key={option.key} type="button" onClick={() => updateForm('propertyType', option.key)} className={fmzCn('rounded-[10px] border-[1.5px] border-[#E8EAF0] bg-white px-2.5 py-3.5 text-center transition hover:border-[#0D1321]', form.propertyType === option.key && 'border-[#0D1321] bg-[#F0F1F5]')}>
                        <div className="mb-1.5 text-[22px]">{option.icon}</div>
                        <div className={fmzCn('text-[11.5px] font-semibold text-[#5A6478]', form.propertyType === option.key && 'text-[#0D1321]')}>{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 lg:grid-cols-3">
                  <PropertyField label="Área total (m²)"><TextInput type="number" min={1} value={form.totalAreaM2} onChange={(event) => updateForm('totalAreaM2', event.target.value)} placeholder="Ex: 85" /></PropertyField>
                  <PropertyField label="Área privativa (m²)"><TextInput type="number" min={0} value={form.privateAreaM2} onChange={(event) => updateForm('privateAreaM2', event.target.value)} placeholder="Ex: 72" /></PropertyField>
                  <PropertyField label="Quartos"><TextInput type="number" min={0} value={form.bedroomsCount} onChange={(event) => updateForm('bedroomsCount', event.target.value)} placeholder="Ex: 2" /></PropertyField>
                  <PropertyField label="Banheiros"><TextInput type="number" min={0} value={form.bathroomsCount} onChange={(event) => updateForm('bathroomsCount', event.target.value)} placeholder="Ex: 2" /></PropertyField>
                  <PropertyField label="Vagas"><TextInput type="number" min={0} value={form.parkingSpacesCount} onChange={(event) => updateForm('parkingSpacesCount', event.target.value)} placeholder="Ex: 1" /></PropertyField>
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5A6478]">Status do imóvel *</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button key={option.key} type="button" onClick={() => updateForm('status', option.key)} className={fmzCn('min-w-[80px] flex-1 rounded-lg border-[1.5px] border-[#E8EAF0] bg-white px-2 py-2.5 text-center text-[12.5px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]', form.status === option.key && statusClasses[option.key].button)}>{statusClasses[option.key].label}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end"><button type="button" onClick={() => goStep(2)} className="inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 font-['Syne'] text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#162030]">Próximo: endereço <ChevronRight size={14} /></button></div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <div className="mb-4 rounded-[14px] border-[1.5px] border-[#E8EAF0] bg-white p-7">
                <h2 className="mb-1 font-['Syne'] text-base font-bold text-[#0D1321]">Onde fica esse imóvel?</h2>
                <p className="mb-[22px] text-[13px] leading-6 text-[#5A6478]">Preencha o endereço completo. Essas informações aparecem no portfólio e nos contratos.</p>
                <div className="mb-[18px] flex items-start gap-2.5 rounded-[10px] border border-[#F0D870] bg-[#FFF9E6] px-3.5 py-3 text-[12.5px] leading-6 text-[#7D5A00]"><Info size={16} className="mt-1 flex-shrink-0 text-[#C8A020]" />Digite o CEP para preencher automaticamente o logradouro, bairro e cidade.</div>
                <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
                  <PropertyField label="CEP *" error={fieldErrors.postalCode}><div className="relative"><TextInput value={form.postalCode} onChange={(event) => updateForm('postalCode', formatCep(event.target.value))} onBlur={() => void handleCepBlur()} error={Boolean(fieldErrors.postalCode)} placeholder="00000-000" maxLength={9} />{cepLoading ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#9AA3B0]" size={16} /> : null}</div></PropertyField>
                  <PropertyField label="Estado (UF) *" error={fieldErrors.state}><SelectInput value={form.state} onChange={(event) => updateForm('state', event.target.value)} error={Boolean(fieldErrors.state)}><option value="">Selecione...</option>{STATE_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}</SelectInput></PropertyField>
                  <PropertyField label="Logradouro (Rua / Av.) *" error={fieldErrors.addressLine1} span2><TextInput value={form.addressLine1} onChange={(event) => updateForm('addressLine1', event.target.value)} error={Boolean(fieldErrors.addressLine1)} placeholder="Ex: Av. Paulista" /></PropertyField>
                  <PropertyField label="Número *" error={fieldErrors.addressNumber}><TextInput value={form.addressNumber} onChange={(event) => updateForm('addressNumber', event.target.value)} error={Boolean(fieldErrors.addressNumber)} placeholder="Ex: 1000" /></PropertyField>
                  <PropertyField label="Complemento"><TextInput value={form.addressLine2} onChange={(event) => updateForm('addressLine2', event.target.value)} placeholder="Apto, Sala, Bloco..." /></PropertyField>
                  <PropertyField label="Bairro *" error={fieldErrors.district}><TextInput value={form.district} onChange={(event) => updateForm('district', event.target.value)} error={Boolean(fieldErrors.district)} placeholder="Ex: Bela Vista" /></PropertyField>
                  <PropertyField label="Cidade *" error={fieldErrors.city}><TextInput value={form.city} onChange={(event) => updateForm('city', event.target.value)} error={Boolean(fieldErrors.city)} placeholder="Ex: São Paulo" /></PropertyField>
                </div>
              </div>
              <div className="mt-6 flex justify-between gap-2"><button type="button" onClick={() => goStep(1)} className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-5 py-3 text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"><ArrowLeft size={14} /> Voltar</button><button type="button" onClick={() => goStep(3)} className="inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 font-['Syne'] text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#162030]">Próximo: financeiro <ChevronRight size={14} /></button></div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <div className="mb-4 rounded-[14px] border-[1.5px] border-[#E8EAF0] bg-white p-7">
                <h2 className="mb-1 font-['Syne'] text-base font-bold text-[#0D1321]">Dados financeiros</h2>
                <p className="mb-[22px] text-[13px] leading-6 text-[#5A6478]">Informe os valores de venda, locação e condições financeiras do imóvel.</p>
                <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
                  <PropertyField label="Valor total do imóvel (R$) *" error={fieldErrors.appraisedValue} full><div className="relative"><span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-[#5A6478]">R$</span><TextInput value={form.appraisedValue} onChange={(event) => updateForm('appraisedValue', formatMoneyInput(event.target.value))} error={Boolean(fieldErrors.appraisedValue)} className="pl-[38px]" placeholder="0,00" /></div></PropertyField>
                  <PropertyField label="Valor de locação (R$/mês)"><div className="relative"><span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-[#5A6478]">R$</span><TextInput value={form.monthlyRentAmount} onChange={(event) => updateForm('monthlyRentAmount', formatMoneyInput(event.target.value))} className="pl-[38px]" placeholder="0,00" /></div></PropertyField>
                  <PropertyField label="IPTU anual (R$)"><div className="relative"><span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-[#5A6478]">R$</span><TextInput value={form.annualPropertyTaxAmount} onChange={(event) => updateForm('annualPropertyTaxAmount', formatMoneyInput(event.target.value))} className="pl-[38px]" placeholder="0,00" /></div></PropertyField>
                  <PropertyField label="Condomínio (R$/mês)"><div className="relative"><span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-[#5A6478]">R$</span><TextInput value={form.monthlyCondoFeeAmount} onChange={(event) => updateForm('monthlyCondoFeeAmount', formatMoneyInput(event.target.value))} className="pl-[38px]" placeholder="0,00" /></div></PropertyField>
                </div>
                <PropertyField label="Observações financeiras"><TextAreaInput value={form.financialNotes} onChange={(event) => updateForm('financialNotes', event.target.value)} className="min-h-[70px]" placeholder="Ex: Aceita permuta parcial, entrada mínima 20%..." /></PropertyField>
              </div>
              <div className="mt-6 flex justify-between gap-2"><button type="button" onClick={() => goStep(2)} className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-5 py-3 text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"><ArrowLeft size={14} /> Voltar</button><button type="button" onClick={() => goStep(4)} className="inline-flex items-center gap-2 rounded-[9px] bg-[#0D1321] px-7 py-3 font-['Syne'] text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-[#162030]">Revisar e salvar <ChevronRight size={14} /></button></div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <div className="mb-4 overflow-hidden rounded-[14px] border-[1.5px] border-[#E8EAF0] bg-white">
                <div className="flex items-center gap-3.5 border-b border-[#E8EAF0] px-[22px] py-[18px]">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#F0F1F5] text-[22px]">{typeIconByKey.get(form.propertyType) ?? '🏢'}</div>
                  <div className="min-w-0"><div className="truncate font-['Syne'] text-[17px] font-extrabold text-[#0D1321]">{form.name || '—'}</div><div className="mt-0.5 truncate text-xs text-[#9AA3B0]">{[form.addressLine1, form.addressNumber].filter(Boolean).join(' ') || '—'}</div></div>
                  <div className={fmzCn('ml-auto inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold', statusClasses[form.status].badge)}>{statusLabelByKey.get(form.status)}</div>
                </div>
                <div className="p-[22px]">
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    <div className="col-span-full text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Características</div>
                    <SummaryField label="Tipo" value={typeLabelByKey.get(form.propertyType) ?? '—'} />
                    <SummaryField label="Área total" value={form.totalAreaM2 ? `${form.totalAreaM2} m²` : '—'} />
                    <SummaryField label="Área privativa" value={form.privateAreaM2 ? `${form.privateAreaM2} m²` : '—'} />
                    <SummaryField label="Quartos" value={form.bedroomsCount || '—'} />
                    <SummaryField label="Banheiros" value={form.bathroomsCount || '—'} />
                    <SummaryField label="Vagas" value={form.parkingSpacesCount || '—'} />
                    <SummaryField label="Status" value={statusLabelByKey.get(form.status) ?? '—'} />
                    <div className="col-span-full mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Localização</div>
                    <SummaryField label="Endereço completo" value={summaryAddress(form)} full />
                    <div className="col-span-full mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Valores</div>
                    <SummaryField label="Valor total" value={form.appraisedValue ? `R$ ${form.appraisedValue}` : '—'} full highlight />
                    <SummaryField label="Locação / mês" value={form.monthlyRentAmount ? `R$ ${form.monthlyRentAmount}/mês` : '—'} />
                    <SummaryField label="IPTU anual" value={form.annualPropertyTaxAmount ? `R$ ${form.annualPropertyTaxAmount}/ano` : '—'} />
                    <SummaryField label="Condomínio / mês" value={form.monthlyCondoFeeAmount ? `R$ ${form.monthlyCondoFeeAmount}/mês` : '—'} />
                    <SummaryField label="Observações" value={form.financialNotes || '—'} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-2">
                <div className="flex gap-2"><button type="button" onClick={() => goStep(3)} className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-5 py-3 text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"><ArrowLeft size={14} /> Voltar</button>{isEditing ? <button type="button" onClick={() => void removeProperty()} disabled={saving} className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#F5C4BF] bg-[#FEF5F4] px-4 py-2.5 text-[13px] font-medium text-[#D94F3D] transition hover:border-[#D94F3D] hover:bg-[#FDE8E6] disabled:opacity-60"><Trash2 size={14} /> Excluir</button> : null}</div>
                <button type="button" onClick={() => void saveProperty()} disabled={saving} className="inline-flex items-center gap-2 rounded-[9px] bg-[#F5C842] px-7 py-3 font-['Syne'] text-[13px] font-bold uppercase tracking-[0.04em] text-[#0D1321] shadow-[0_4px_16px_rgba(245,200,66,0.3)] transition hover:-translate-y-0.5 hover:bg-[#C8A020] disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} {isEditing ? 'Atualizar imóvel' : 'Salvar imóvel'}</button>
              </div>
            </div>
          ) : null}
        </section>
      )}

      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[400] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0D1321] px-[18px] py-[11px] text-[13px] font-medium text-white shadow-lg">
          <span className={fmzCn('flex h-4 w-4 items-center justify-center rounded-full', toast.ok ? 'bg-[#F5C842]' : 'bg-[#D94F3D]')}><Check size={10} className="text-[#0D1321]" /></span>
          {toast.message}
        </div>
      ) : null}
    </section>
  );
}

function SummaryField({ label, value, full = false, highlight = false }: { label: string; value: string; full?: boolean; highlight?: boolean }) {
  return (
    <div className={fmzCn('rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-3.5 py-3', full && 'md:col-span-2', highlight && 'border-[#F0D870] bg-[#FFFDF0]')}>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">{label}</div>
      <div className={fmzCn('text-[13.5px] font-medium text-[#0D1321]', highlight && 'font-[Syne] text-base font-bold')}>{value}</div>
    </div>
  );
}
