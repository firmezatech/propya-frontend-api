'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, Plus, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzFieldErrorMessage, FmzFormAlert } from '../../api-errors/components';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../../api-errors/domain';
import {
  createFeeParameter,
  createOwnershipGoal,
  getAdminTenantSettings,
  listEligibleTenants,
  updateFeeParameter,
  updateOwnershipGoal,
} from '../services';
import type { FmzAdminEligibleTenant, FmzAdminFeeParameter, FmzAdminOwnershipGoal } from '../domain';

// ─── local form types ───────────────────────────────────────────────────────

type FeeValueUiType = 'percentage' | 'currency';
type GoalTargetUiType = 'percentage' | 'token';

type FeeForm = {
  id: string | undefined;
  name: string;
  valueType: FeeValueUiType;
  value: string;
  description: string;
};

type GoalForm = {
  id: string | undefined;
  tenantUserId: string;
  propertyId: string;
  rentalContractId: string;
  propertyTokenizationId: string;
  title: string;
  targetType: GoalTargetUiType;
  targetValue: string;
  rentReduction: string;
  message: string;
};

type FieldErrors = Record<string, string>;
type Toast = { message: string; ok: boolean } | null;

// ─── constants ──────────────────────────────────────────────────────────────

const EMPTY_FEE_FORM: FeeForm = {
  id: undefined,
  name: '',
  valueType: 'percentage',
  value: '',
  description: '',
};

const EMPTY_GOAL_FORM: GoalForm = {
  id: undefined,
  tenantUserId: '',
  propertyId: '',
  rentalContractId: '',
  propertyTokenizationId: '',
  title: '',
  targetType: 'percentage',
  targetValue: '',
  rentReduction: '',
  message: '',
};

const FEE_ICON_COLORS = [
  { bg: '#FFF9E6', color: '#C8A020' },
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#F0FAF5', color: '#1A8C5B' },
  { bg: '#FEF5F4', color: '#D94F3D' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#F0F1F5', color: '#5A6478' },
] as const;

const TOAST_DISPLAY_MS = 2800;
const DEFAULT_PARAMETER_SCOPE = 'global' as const;

// ─── helpers ────────────────────────────────────────────────────────────────

const toSnakeCase = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const toDisplayLabel = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatPct = (value: number): string =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 10 });

// ─── shared sub-components ──────────────────────────────────────────────────

function SectionHeader({
  tag,
  title,
  subtitle,
  onNew,
  newLabel,
}: {
  tag: string;
  title: string;
  subtitle: string;
  onNew: () => void;
  newLabel: string;
}) {
  return (
    <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9AA3B0]">{tag}</div>
        <div className="font-sans text-[17px] font-bold text-[#0D1321]">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-[#5A6478]">{subtitle}</div>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#0D1321] px-[18px] py-[10px] font-sans text-[12px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-px hover:bg-[#162030]"
      >
        <Plus size={11} strokeWidth={2.5} />
        {newLabel}
      </button>
    </div>
  );
}

function TypeToggle({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ key: string; icon: React.ReactNode; title: string; desc: string }>;
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key)}
          className={fmzCn(
            'flex items-start gap-3 rounded-[10px] border-[1.5px] p-3.5 text-left transition',
            selected === opt.key
              ? 'border-[#0D1321] bg-[#F0F1F5]'
              : 'border-[#E8EAF0] bg-white hover:border-[#0D1321]',
          )}
        >
          <div className="shrink-0 pt-0.5">{opt.icon}</div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold leading-snug text-[#0D1321]">{opt.title}</div>
            <div className="text-[12px] leading-snug text-[#5A6478]">{opt.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[18px] last:mb-0">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5A6478]">
        {label}
      </label>
      {children}
      <FmzFieldErrorMessage message={error} />
    </div>
  );
}

function InputSuffix({ suffix, children }: { suffix: string; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      {children}
      <span className="pointer-events-none absolute right-3 text-[13px] font-semibold text-[#9AA3B0]">
        {suffix}
      </span>
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  fmzCn(
    'w-full rounded-[9px] border-[1.5px] bg-[#F7F8FA] px-3.5 py-[11px] font-sans text-[14px] text-[#0D1321] outline-none transition placeholder:text-[#9AA3B0] focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,0.13)]',
    hasError ? 'border-[#F5C4BF] bg-[#FEF5F4]' : 'border-[#E8EAF0]',
  );

function ModalBackdrop({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={fmzCn(
        'fixed inset-0 z-[300] flex items-center justify-center p-5 transition-opacity duration-[220ms]',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={{ background: 'rgba(13,19,33,0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={fmzCn(
          'w-full max-w-[500px] max-h-[calc(100vh-64px)] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(13,19,33,0.22)] transition-transform duration-[220ms]',
          open ? 'translate-y-0 scale-100' : 'translate-y-3 scale-[0.98]',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-[#E8EAF0] px-6 py-5">
      <span className="font-sans text-[17px] font-bold text-[#0D1321]">{title}</span>
      <button
        type="button"
        onClick={onClose}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border-[1.5px] border-[#E8EAF0] text-[#9AA3B0] transition hover:bg-[#F7F8FA] hover:text-[#0D1321]"
      >
        <X size={12} strokeWidth={1.6} />
      </button>
    </div>
  );
}

function ModalFooter({
  onCancel,
  onSave,
  saveLabel,
  saving,
  onDelete,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
  saving: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[#E8EAF0] bg-[#F7F8FA] px-6 py-4">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="mr-auto inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#F5C4BF] bg-[#FEF5F4] px-3.5 py-2 text-[12px] font-medium text-[#D94F3D] transition hover:border-[#D94F3D] hover:bg-[#fde8e6] disabled:opacity-50"
        >
          Excluir
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-4 py-[9px] text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321] disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#F5C842] px-5 py-[10px] font-sans text-[12px] font-bold uppercase tracking-[0.04em] text-[#0D1321] shadow-[0_3px_12px_rgba(245,200,66,0.25)] transition hover:-translate-y-px hover:bg-[#f0c030] disabled:opacity-50"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={1.8} />}
        {saveLabel}
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  onNew,
  newLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onNew: () => void;
  newLabel: string;
}) {
  return (
    <div className="rounded-[12px] border-[1.5px] border-[#E8EAF0] bg-white px-6 py-[52px] text-center">
      <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-dashed border-[#E8EAF0] bg-[#F7F8FA]">
        {icon}
      </div>
      <h3 className="mb-1 font-sans text-[15px] font-bold text-[#0D1321]">{title}</h3>
      <p className="mx-auto mb-[18px] max-w-[280px] text-[13px] leading-[1.6] text-[#5A6478]">{description}</p>
      <button
        type="button"
        onClick={onNew}
        className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#0D1321] px-[18px] py-[10px] font-sans text-[12px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-px hover:bg-[#162030]"
      >
        <Plus size={11} strokeWidth={2.5} />
        {newLabel}
      </button>
    </div>
  );
}

// ─── fee parameter row ───────────────────────────────────────────────────────

function FeeParameterRow({
  parameter,
  colorIndex,
  onEdit,
}: {
  parameter: FmzAdminFeeParameter;
  colorIndex: number;
  onEdit: () => void;
}) {
  const c = FEE_ICON_COLORS[colorIndex % FEE_ICON_COLORS.length];
  const isPct = parameter.valueType === 'percentage';
  const displayValue = isPct
    ? `${formatPct(parameter.parameterValue)}%`
    : `R$ ${formatBRL(parameter.parameterValue)}`;

  return (
    <div className="flex items-center gap-4 rounded-[12px] border-[1.5px] border-[#E8EAF0] bg-white px-5 py-[17px] transition hover:-translate-y-px hover:border-transparent hover:shadow-[0_4px_18px_rgba(13,19,33,0.08)]">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: c.bg }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="14" rx="2" stroke={c.color} strokeWidth="1.6" />
          <path d="M3 10h18" stroke={c.color} strokeWidth="1.3" />
          <path d="M7 14h2M15 14h2" stroke={c.color} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[14px] font-bold text-[#0D1321]">{toDisplayLabel(parameter.parameterKey)}</div>
        <div className="mt-0.5 truncate text-[12px] text-[#5A6478]">{parameter.description ?? '—'}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-sans text-[16px] font-bold text-[#0D1321]">{displayValue}</div>
        <div className="mt-0.5 text-[10px] font-medium text-[#9AA3B0]">{isPct ? 'Percentual' : 'Valor fixo'}</div>
      </div>
      <div className="ml-2 flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          title="Editar taxa"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] border-[1.5px] border-[#E8EAF0] bg-white text-[#5A6478] transition hover:border-[#0D1321] hover:bg-[#F7F8FA] hover:text-[#0D1321]"
        >
          <Pencil size={13} strokeWidth={1.3} />
        </button>
      </div>
    </div>
  );
}

// ─── ownership goal row ──────────────────────────────────────────────────────

function OwnershipGoalRow({
  goal,
  onEdit,
}: {
  goal: FmzAdminOwnershipGoal;
  onEdit: () => void;
}) {
  const isPct = goal.targetPercentage != null;
  const targetValue = isPct
    ? `${goal.targetPercentage}%`
    : `R$ ${formatBRL(goal.targetTokenAmount ?? 0)}`;

  const reductionLabel =
    goal.rentReductionAmount != null && goal.rentReductionAmount > 0
      ? `Redução de R$ ${formatBRL(goal.rentReductionAmount)}/mês`
      : 'Sem redução de aluguel';

  const progress = goal.achievementRate ?? 0;
  const barColor =
    progress >= 100 ? '#1A8C5B' : progress >= 50 ? '#F5C842' : '#3B82F6';
  const badgeStyle =
    progress >= 100
      ? 'bg-[#F0FAF5] text-[#1A8C5B] border border-[#A8DFC4]'
      : 'bg-[#F0F1F5] text-[#5A6478] border border-[#E8EAF0]';

  return (
    <div className="flex items-center gap-4 rounded-[12px] border-[1.5px] border-[#E8EAF0] bg-white px-5 py-[17px] transition hover:-translate-y-px hover:border-transparent hover:shadow-[0_4px_18px_rgba(13,19,33,0.08)]">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: isPct ? '#FFF9E6' : '#EFF6FF' }}
      >
        {isPct ? (
          <span className="font-sans text-[16px] font-bold" style={{ color: '#C8A020' }}>%</span>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="#2563EB" strokeWidth="1.8" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[14px] font-bold text-[#0D1321]">{goal.title}</div>
        <div className="mt-0.5 max-w-[400px] truncate text-[12px] text-[#5A6478]">
          {goal.rewardDescription ?? '—'}
        </div>
      </div>
      <div className="min-w-[100px] shrink-0 text-right">
        <div className="font-sans text-[16px] font-bold text-[#0D1321]">{targetValue}</div>
        <div className="mt-0.5 text-[10px] font-medium text-[#9AA3B0]">{reductionLabel}</div>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5" style={{ minWidth: 130 }}>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] text-[#9AA3B0]">Inquilinos</span>
          <span className="font-sans text-[11.5px] font-bold text-[#0D1321]">{progress}%</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-[#E8EAF0]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%`, background: barColor }}
          />
        </div>
      </div>
      <div
        className={fmzCn(
          'inline-flex shrink-0 items-center rounded-[20px] px-[9px] py-[3px] text-[10.5px] font-semibold whitespace-nowrap',
          badgeStyle,
        )}
      >
        {progress >= 100 ? '✓ Todos' : `${progress}% atingiram`}
      </div>
      <div className="ml-2 flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          title="Editar meta"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] border-[1.5px] border-[#E8EAF0] bg-white text-[#5A6478] transition hover:border-[#0D1321] hover:bg-[#F7F8FA] hover:text-[#0D1321]"
        >
          <Pencil size={13} strokeWidth={1.3} />
        </button>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function FmzAdminTenantSettings() {
  const [parameters, setParameters] = useState<FmzAdminFeeParameter[]>([]);
  const [goals, setGoals] = useState<FmzAdminOwnershipGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<FmzNormalizedApiError | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // fee modal state
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeForm, setFeeForm] = useState<FeeForm>(EMPTY_FEE_FORM);
  const [feeErrors, setFeeErrors] = useState<FieldErrors>({});
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeSaveError, setFeeSaveError] = useState<FmzNormalizedApiError | null>(null);

  // goal modal state
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalForm>(EMPTY_GOAL_FORM);
  const [goalErrors, setGoalErrors] = useState<FieldErrors>({});
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalSaveError, setGoalSaveError] = useState<FmzNormalizedApiError | null>(null);

  // eligible tenants for goal modal
  const [eligibleTenants, setEligibleTenants] = useState<FmzAdminEligibleTenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const selectedTenant = eligibleTenants.find((t) => t.tenantUserId === goalForm.tenantUserId) ?? null;

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, ok });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DISPLAY_MS);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const settings = await getAdminTenantSettings();
      setParameters(settings.parameters);
      setGoals(settings.goals);
    } catch (err) {
      setLoadError(normalizeFmzApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── fee modal ─────────────────────────────────────────────────────────────

  const openFeeModal = useCallback((parameter?: FmzAdminFeeParameter) => {
    setFeeErrors({});
    setFeeSaveError(null);
    if (parameter) {
      setFeeForm({
        id: parameter.id,
        name: parameter.parameterKey,
        valueType: parameter.valueType === 'currency' ? 'currency' : 'percentage',
        value: String(parameter.parameterValue),
        description: parameter.description ?? '',
      });
    } else {
      setFeeForm(EMPTY_FEE_FORM);
    }
    setFeeModalOpen(true);
  }, []);

  const closeFeeModal = useCallback(() => {
    if (feeSaving) return;
    setFeeModalOpen(false);
  }, [feeSaving]);

  const validateFeeForm = useCallback((): boolean => {
    const errs: FieldErrors = {};
    if (!feeForm.name.trim()) errs.name = 'Informe um nome para a taxa.';
    const parsed = parseFloat(feeForm.value);
    if (!feeForm.value || !Number.isFinite(parsed) || parsed < 0)
      errs.value = 'Informe um valor válido.';
    setFeeErrors(errs);
    return Object.keys(errs).length === 0;
  }, [feeForm]);

  const handleSaveFee = useCallback(async () => {
    if (!validateFeeForm()) return;
    setFeeSaving(true);
    setFeeSaveError(null);
    try {
      const draft = {
        parameterKey: toSnakeCase(feeForm.name),
        parameterValue: parseFloat(feeForm.value),
        valueType: feeForm.valueType === 'currency' ? ('currency' as const) : ('percentage' as const),
        parameterScope: DEFAULT_PARAMETER_SCOPE,
        description: feeForm.description.trim() || null,
        isActive: true,
      };

      if (feeForm.id) {
        const updated = await updateFeeParameter(feeForm.id, draft);
        setParameters((prev) =>
          prev.map((p) => (p.id === feeForm.id ? { ...p, ...updated } : p)),
        );
        showToast('Taxa atualizada com sucesso!');
      } else {
        const created = await createFeeParameter(draft);
        setParameters((prev) => [...prev, created]);
        showToast('Taxa criada com sucesso!');
      }
      setFeeModalOpen(false);
    } catch (err) {
      setFeeSaveError(normalizeFmzApiError(err));
    } finally {
      setFeeSaving(false);
    }
  }, [feeForm, showToast, validateFeeForm]);

  // ── goal modal ────────────────────────────────────────────────────────────

  const loadEligibleTenants = useCallback(async () => {
    setTenantsLoading(true);
    setTenantsError(null);
    try {
      const tenants = await listEligibleTenants();
      setEligibleTenants(tenants);
    } catch {
      setTenantsError('Não foi possível carregar as inquilinas. Tente novamente.');
    } finally {
      setTenantsLoading(false);
    }
  }, []);

  const openGoalModal = useCallback((goal?: FmzAdminOwnershipGoal) => {
    setGoalErrors({});
    setGoalSaveError(null);
    if (goal) {
      const isPct = goal.targetPercentage != null;
      setGoalForm({
        id: goal.id,
        tenantUserId: '',
        propertyId: '',
        rentalContractId: '',
        propertyTokenizationId: goal.propertyTokenizationId ?? '',
        title: goal.title,
        targetType: isPct ? 'percentage' : 'token',
        targetValue: isPct
          ? String(goal.targetPercentage ?? '')
          : String(goal.targetTokenAmount ?? ''),
        rentReduction:
          goal.rentReductionAmount != null && goal.rentReductionAmount > 0
            ? String(goal.rentReductionAmount)
            : '',
        message: goal.rewardDescription ?? '',
      });
    } else {
      setGoalForm(EMPTY_GOAL_FORM);
    }
    setGoalModalOpen(true);
    loadEligibleTenants();
  }, [loadEligibleTenants]);

  const closeGoalModal = useCallback(() => {
    if (goalSaving) return;
    setGoalModalOpen(false);
  }, [goalSaving]);

  const validateGoalForm = useCallback((): boolean => {
    const errs: FieldErrors = {};
    const isNew = !goalForm.id;
    if (isNew && !goalForm.tenantUserId) {
      errs.tenantUserId = 'Selecione uma inquilina.';
    } else if (isNew && !goalForm.propertyTokenizationId) {
      errs.tenantUserId = 'A inquilina selecionada não possui imóvel tokenizado.';
    }
    if (!goalForm.title.trim()) errs.title = 'Informe um nome para a meta.';
    const parsed = parseFloat(goalForm.targetValue);
    if (!goalForm.targetValue || !Number.isFinite(parsed) || parsed <= 0)
      errs.targetValue = 'Informe um valor válido.';
    setGoalErrors(errs);
    return Object.keys(errs).length === 0;
  }, [goalForm]);

  const handleSaveGoal = useCallback(async () => {
    if (!validateGoalForm()) return;
    setGoalSaving(true);
    setGoalSaveError(null);
    try {
      const parsed = parseFloat(goalForm.targetValue);
      const reduction = parseFloat(goalForm.rentReduction);
      const baseDraft = {
        goalKey: toSnakeCase(goalForm.title),
        title: goalForm.title.trim(),
        targetPercentage: goalForm.targetType === 'percentage' ? parsed : null,
        targetTokenAmount: goalForm.targetType === 'token' ? parsed : null,
        description: Number.isFinite(reduction) && reduction > 0 ? String(reduction) : null,
        rewardDescription: goalForm.message.trim() || null,
        isActive: true,
      };

      if (goalForm.id) {
        const updated = await updateOwnershipGoal(goalForm.id, baseDraft);
        setGoals((prev) =>
          prev.map((g) => (g.id === goalForm.id ? { ...g, ...updated } : g)),
        );
        showToast('Meta atualizada com sucesso!');
      } else {
        const created = await createOwnershipGoal({
          ...baseDraft,
          tenantUserId: goalForm.tenantUserId,
          propertyId: goalForm.propertyId,
          rentalContractId: goalForm.rentalContractId || null,
          propertyTokenizationId: goalForm.propertyTokenizationId,
        });
        setGoals((prev) => [...prev, created]);
        showToast('Meta criada com sucesso!');
      }
      setGoalModalOpen(false);
    } catch (err) {
      setGoalSaveError(normalizeFmzApiError(err));
    } finally {
      setGoalSaving(false);
    }
  }, [goalForm, showToast, validateGoalForm]);

  // ── render ────────────────────────────────────────────────────────────────

  const feeValueTypeOptions = [
    {
      key: 'percentage',
      icon: (
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-[#FFF9E6] font-sans text-[14px] font-bold" style={{ color: '#C8A020' }}>
          %
        </div>
      ),
      title: 'Percentual',
      desc: 'Ex: 9,41%',
    },
    {
      key: 'currency',
      icon: (
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-[#F0FAF5] font-sans text-[12px] font-bold" style={{ color: '#1A8C5B' }}>
          R$
        </div>
      ),
      title: 'Valor fixo',
      desc: 'Ex: R$ 75,00',
    },
  ];

  const goalTargetTypeOptions = [
    {
      key: 'percentage',
      icon: (
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-[#FFF9E6] font-sans text-[14px] font-bold" style={{ color: '#C8A020' }}>
          %
        </div>
      ),
      title: 'Porcentagem',
      desc: 'Ex: 10% de posse',
    },
    {
      key: 'token',
      icon: (
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-[#EFF6FF]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="#2563EB" strokeWidth="1.8" />
          </svg>
        </div>
      ),
      title: 'Tokens (R$)',
      desc: 'Ex: R$ 4.500',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#9AA3B0]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg pt-16">
        <FmzFormAlert error={loadError} />
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* page header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9AA3B0]">
            Configurações da Plataforma
          </div>
          <h1 className="font-sans text-[26px] font-extrabold tracking-[-0.025em] text-[#0D1321]">
            Parâmetros
          </h1>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#5A6478]">
            Gerencie as taxas operacionais e as metas de aquisição de tokens para os inquilinos.
          </p>
        </div>
      </div>

      {/* fee parameters section */}
      <SectionHeader
        tag="Financeiro"
        title="Taxas da Plataforma"
        subtitle="Taxas aplicadas aos contratos. Cada taxa tem nome, valor e descrição livre."
        onNew={() => openFeeModal()}
        newLabel="Nova taxa"
      />

      <div className="mb-1 flex flex-col gap-2.5">
        {parameters.length === 0 ? (
          <EmptyState
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="14" rx="2" stroke="#D0D4DE" strokeWidth="1.5" />
                <path d="M3 10h18M8 14h2M14 14h2" stroke="#D0D4DE" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
            title="Nenhuma taxa cadastrada"
            description="Crie as taxas que serão aplicadas nos contratos da plataforma."
            onNew={() => openFeeModal()}
            newLabel="Criar primeira taxa"
          />
        ) : (
          parameters.map((p, i) => (
            <FeeParameterRow
              key={p.id}
              parameter={p}
              colorIndex={i}
              onEdit={() => openFeeModal(p)}
            />
          ))
        )}
      </div>

      {/* separator */}
      <div className="my-9 h-px bg-[#E8EAF0]" />

      {/* ownership goals section */}
      <SectionHeader
        tag="Jornada do Inquilino"
        title="Metas de Aquisição"
        subtitle="Marcos de posse que orientam e motivam o inquilino ao longo da jornada."
        onNew={() => openGoalModal()}
        newLabel="Nova meta"
      />

      <div className="flex flex-col gap-2.5">
        {goals.length === 0 ? (
          <EmptyState
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="#D0D4DE" strokeWidth="1.5" />
                <path d="M8 12h8M12 8v8" stroke="#D0D4DE" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
            title="Nenhuma meta cadastrada"
            description="Crie marcos de posse para motivar os inquilinos na jornada de compra."
            onNew={() => openGoalModal()}
            newLabel="Criar primeira meta"
          />
        ) : (
          [...goals]
            .sort((a, b) => {
              const aPct = a.targetPercentage != null;
              const bPct = b.targetPercentage != null;
              if (aPct !== bPct) return aPct ? -1 : 1;
              return (a.targetPercentage ?? a.targetTokenAmount ?? 0) -
                (b.targetPercentage ?? b.targetTokenAmount ?? 0);
            })
            .map((g) => (
              <OwnershipGoalRow key={g.id} goal={g} onEdit={() => openGoalModal(g)} />
            ))
        )}
      </div>

      {/* ── fee parameter modal ─────────────────────────────────────────────── */}
      <ModalBackdrop open={feeModalOpen} onClose={closeFeeModal}>
        <ModalHeader
          title={feeForm.id ? 'Editar taxa' : 'Nova taxa'}
          onClose={closeFeeModal}
        />
        <div className="px-6 py-[22px]">
          <FmzFormAlert error={feeSaveError} />

          <FormField label="Nome da taxa *" error={feeErrors.name}>
            <input
              className={inputClass(Boolean(feeErrors.name))}
              placeholder="Ex: Taxa Administrativa de Aluguel"
              value={feeForm.name}
              onChange={(e) => setFeeForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>

          <FormField label="Tipo do valor *">
            <TypeToggle
              options={feeValueTypeOptions}
              selected={feeForm.valueType}
              onSelect={(k) => setFeeForm((f) => ({ ...f, valueType: k as FeeValueUiType, value: '' }))}
            />
          </FormField>

          <FormField
            label={feeForm.valueType === 'percentage' ? 'Valor (%) *' : 'Valor (R$) *'}
            error={feeErrors.value}
          >
            <InputSuffix suffix={feeForm.valueType === 'percentage' ? '%' : 'R$'}>
              <input
                className={fmzCn(inputClass(Boolean(feeErrors.value)), 'pr-10')}
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={feeForm.value}
                onChange={(e) => setFeeForm((f) => ({ ...f, value: e.target.value }))}
              />
            </InputSuffix>
          </FormField>

          <FormField label="Descrição">
            <textarea
              className={fmzCn(inputClass(), 'resize-y')}
              rows={3}
              placeholder="Explique quando e como essa taxa é aplicada..."
              value={feeForm.description}
              onChange={(e) => setFeeForm((f) => ({ ...f, description: e.target.value }))}
              style={{ minHeight: 72 }}
            />
          </FormField>
        </div>
        <ModalFooter
          onCancel={closeFeeModal}
          onSave={handleSaveFee}
          saveLabel="Salvar taxa"
          saving={feeSaving}
        />
      </ModalBackdrop>

      {/* ── ownership goal modal ────────────────────────────────────────────── */}
      <ModalBackdrop open={goalModalOpen} onClose={closeGoalModal}>
        <ModalHeader
          title={goalForm.id ? 'Editar meta' : 'Nova meta'}
          onClose={closeGoalModal}
        />
        <div className="px-6 py-[22px]">
          <FmzFormAlert error={goalSaveError} />

          {/* ── tenant + property (create only) ──────────────────────────── */}
          {!goalForm.id && (
            <div className="mb-5 rounded-[11px] border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] p-4">
              <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">
                Contexto da meta
              </div>
              <div className="mb-3 text-[12px] text-[#5A6478]">
                Selecione a inquilina para vincular esta meta ao imóvel correto.
              </div>

              <FormField label="Inquilina *" error={goalErrors.tenantUserId}>
                {tenantsLoading ? (
                  <div className={fmzCn(inputClass(), 'flex items-center gap-2 text-[#9AA3B0]')}>
                    <Loader2 size={13} className="animate-spin" />
                    <span className="text-[13px]">Carregando inquilinas…</span>
                  </div>
                ) : tenantsError ? (
                  <div className="rounded-[9px] border-[1.5px] border-[#F5C4BF] bg-[#FEF5F4] px-3.5 py-[11px]">
                    <span className="text-[12.5px] text-[#D94F3D]">{tenantsError}</span>
                    <button
                      type="button"
                      onClick={loadEligibleTenants}
                      className="ml-2 text-[12px] font-medium text-[#D94F3D] underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : eligibleTenants.length === 0 ? (
                  <div className={fmzCn(inputClass(), 'text-[13px] text-[#9AA3B0]')}>
                    Nenhuma inquilina com imóvel e tokenização ativos encontrada.
                  </div>
                ) : (
                  <select
                    className={fmzCn(inputClass(Boolean(goalErrors.tenantUserId)), 'cursor-pointer')}
                    value={goalForm.tenantUserId}
                    onChange={(e) => {
                      const tenant = eligibleTenants.find((t) => t.tenantUserId === e.target.value) ?? null;
                      setGoalForm((f) => ({
                        ...f,
                        tenantUserId: tenant?.tenantUserId ?? '',
                        propertyId: tenant?.propertyId ?? '',
                        rentalContractId: tenant?.rentalContractId ?? '',
                        propertyTokenizationId: tenant?.propertyTokenizationId ?? '',
                      }));
                    }}
                  >
                    <option value="">Selecione uma inquilina</option>
                    {eligibleTenants.map((t) => (
                      <option key={t.tenantUserId} value={t.tenantUserId}>
                        {t.tenantName} — {t.tenantEmail}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              <FormField label="Imóvel vinculado">
                <div
                  className={fmzCn(
                    inputClass(),
                    'cursor-default select-none',
                    selectedTenant
                      ? 'border-[#A8DFC4] bg-[#F0FAF5] text-[#1A8C5B]'
                      : 'text-[#9AA3B0]',
                  )}
                >
                  {selectedTenant
                    ? [selectedTenant.propertyName, selectedTenant.propertyCode].filter(Boolean).join(' — ')
                    : 'Preenchido automaticamente após selecionar a inquilina'}
                </div>
              </FormField>
            </div>
          )}

          <FormField label="Nome da meta *" error={goalErrors.title}>
            <input
              className={inputClass(Boolean(goalErrors.title))}
              placeholder="Ex: Marco dos 10%, Primeiro Passo..."
              value={goalForm.title}
              onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))}
            />
          </FormField>

          <FormField label="Tipo de meta *">
            <TypeToggle
              options={goalTargetTypeOptions}
              selected={goalForm.targetType}
              onSelect={(k) => setGoalForm((f) => ({ ...f, targetType: k as GoalTargetUiType, targetValue: '' }))}
            />
          </FormField>

          <FormField
            label={goalForm.targetType === 'percentage' ? 'Porcentagem alvo *' : 'Valor em tokens (R$) *'}
            error={goalErrors.targetValue}
          >
            <InputSuffix suffix={goalForm.targetType === 'percentage' ? '%' : 'R$'}>
              <input
                className={fmzCn(inputClass(Boolean(goalErrors.targetValue)), 'pr-10')}
                type="number"
                min="0"
                step="0.01"
                placeholder={goalForm.targetType === 'percentage' ? '10' : '50000'}
                value={goalForm.targetValue}
                onChange={(e) => setGoalForm((f) => ({ ...f, targetValue: e.target.value }))}
              />
            </InputSuffix>
          </FormField>

          <FormField label="Redução no aluguel ao atingir (R$)">
            <InputSuffix suffix="R$">
              <input
                className={fmzCn(inputClass(), 'pr-10')}
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={goalForm.rentReduction}
                onChange={(e) => setGoalForm((f) => ({ ...f, rentReduction: e.target.value }))}
              />
            </InputSuffix>
          </FormField>

          <FormField label="Mensagem para o inquilino">
            <textarea
              className={fmzCn(inputClass(), 'resize-y')}
              rows={2}
              placeholder="Ex: Ao atingir 10%, seu aluguel reduz R$ 22,50/mês!"
              value={goalForm.message}
              onChange={(e) => setGoalForm((f) => ({ ...f, message: e.target.value }))}
              style={{ minHeight: 64 }}
            />
          </FormField>
        </div>
        <ModalFooter
          onCancel={closeGoalModal}
          onSave={handleSaveGoal}
          saveLabel="Salvar meta"
          saving={goalSaving || tenantsLoading}
        />
      </ModalBackdrop>

      {/* toast */}
      <div
        className={fmzCn(
          'pointer-events-none fixed bottom-6 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0D1321] px-[18px] py-[11px] text-[13px] font-medium text-white shadow-lg transition-all duration-[280ms]',
          toast ? 'translate-y-0 opacity-100' : 'translate-y-3.5 opacity-0',
        )}
      >
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F5C842]">
          <Check size={8} strokeWidth={1.8} className="text-[#0D1321]" />
        </div>
        <span>{toast?.message}</span>
      </div>
    </>
  );
}
