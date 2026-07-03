'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Plus, SlidersHorizontal, Target, Trash2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { normalizeFmzApiError } from '../../api-errors/domain';
import {
  createFeeParameter,
  createOwnershipGoal,
  deleteOwnershipGoal,
  getAdminTenantSettings,
  listEligibleTenants,
  updateFeeParameter,
  updateOwnershipGoal,
} from '../services';
import type {
  FmzAdminEligibleTenant,
  FmzAdminFeeParameter,
  FmzAdminOwnershipGoal,
  FmzTenantSettingsValueType,
} from '../domain';

const moneyFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMoney = (value: number): string => `R$ ${moneyFmt.format(value || 0)}`;
const formatPct = (value: number): string => `${moneyFmt.format(value || 0).replace(/,00$/, '')}%`;

// Two-letter badge from the address (e.g. "Rua Capitão Arantes" → "RC"), falling back to the code.
const initialsOf = (t: FmzAdminEligibleTenant): string => {
  const source = t.addressLine1 || t.propertyName || t.propertyCode || '';
  const words = source.split(/\s+/).filter(Boolean);
  const letters = (words[0]?.[0] ?? '') + (words[1]?.[0] ?? words[0]?.[1] ?? '');
  return letters.toUpperCase() || '—';
};

// Per-property financial overrides (fee-parameter model: currency|percentage). Each reads its
// "current effective value" from the contract when there is no explicit parameter_sets override.
const OVERRIDES: {
  key: string;
  label: string;
  description: string;
  valueType: FmzTenantSettingsValueType;
  contractField: keyof Pick<FmzAdminEligibleTenant, 'condominiumFeeAmount' | 'tokenUnitValue' | 'tokenFeePercent' | 'platformFeePercent'> | null;
}[] = [
  { key: 'condominio_brl', label: 'Valor do condomínio', description: 'Cobrado junto ao aluguel deste imóvel.', valueType: 'currency', contractField: 'condominiumFeeAmount' },
  { key: 'iptu_mensal_brl', label: 'IPTU mensal', description: 'Rateio mensal do IPTU, se houver.', valueType: 'currency', contractField: null },
  { key: 'token_unit_value_brl', label: 'Valor do token', description: 'Preço unitário do token deste imóvel.', valueType: 'currency', contractField: 'tokenUnitValue' },
  { key: 'token_purchase_fee_percent', label: 'Taxa de token', description: 'Taxa sobre compra de token neste imóvel.', valueType: 'percentage', contractField: 'tokenFeePercent' },
  { key: 'platform_admin_fee_percent', label: 'Taxa da plataforma', description: 'Administração sobre o aluguel.', valueType: 'percentage', contractField: 'platformFeePercent' },
];

// ── Property card ─────────────────────────────────────────────────────────────

function PropertyCard({ tenant }: { tenant: FmzAdminEligibleTenant }) {
  const cityLine = [tenant.district, tenant.city, tenant.state].filter(Boolean).join(', ');
  const addressLine = [tenant.addressLine1, tenant.addressLine2].filter(Boolean).join(' · ') || tenant.propertyName;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-[13px] border-[1.5px] border-fmz-border-light bg-white px-[18px] py-3.5">
      <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[11px] bg-[#3B5EA6] text-[13px] font-extrabold tracking-[0.03em] text-white">
        {initialsOf(tenant)}
      </span>
      <div className="min-w-[220px] flex-1">
        <div className="text-[15px] font-bold text-fmz-navy">{addressLine}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fmz-text-muted">
          {cityLine && <span>{cityLine}</span>}
          {cityLine && <span className="h-[3px] w-[3px] rounded-full bg-fmz-border-light" />}
          <span>Inquilino: <b className="font-semibold text-fmz-navy">{tenant.tenantName}</b></span>
          <span className="h-[3px] w-[3px] rounded-full bg-fmz-border-light" />
          <span>{tenant.coOwnersCount} co-proprietária{tenant.coOwnersCount === 1 ? '' : 's'}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-6">
        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-fmz-text-hint">Aluguel base</div>
          <div className="text-[16px] font-extrabold tracking-[-0.02em] text-fmz-navy">{formatMoney(tenant.baseMonthlyRent)}</div>
        </div>
        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-fmz-text-hint">Participação atual</div>
          <div className="text-[16px] font-extrabold tracking-[-0.02em] text-fmz-navy">{moneyFmt.format(tenant.currentOwnershipPercentage).replace(/,00$/, '')}<span className="text-[11px] font-semibold text-fmz-text-muted">%</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Meta card (matches reference: badge, progress line, green when achieved) ────

type GoalStatus = 'ativa' | 'rascunho' | 'concluida';
const STATUS_LABEL: Record<GoalStatus, string> = { ativa: 'Ativa', rascunho: 'Rascunho', concluida: 'Concluída' };

function MetaCard({
  goal,
  index,
  currentOwnership,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  goal: FmzAdminOwnershipGoal;
  index: number;
  currentOwnership: number;
  onSave: (goalId: string, patch: { title: string; targetPercentage: number; isActive: boolean }) => void;
  onDelete: (goal: FmzAdminOwnershipGoal) => void;
  saving: boolean;
  deleting: boolean;
}) {
  const [open, setOpen] = useState(index === 0);
  const [title, setTitle] = useState(goal.title);
  const [target, setTarget] = useState(String(goal.targetPercentage ?? ''));
  const [active, setActive] = useState(goal.isActive);

  const targetNum = Number(target.replace(',', '.')) || 0;
  const achieved = targetNum > 0 && currentOwnership >= targetNum;
  const progressPct = targetNum > 0 ? Math.min(100, Math.round((currentOwnership / targetNum) * 100)) : 0;
  const remaining = Math.max(0, targetNum - currentOwnership);
  const status: GoalStatus = achieved ? 'concluida' : active ? 'ativa' : 'rascunho';

  const dirty = title !== goal.title || String(goal.targetPercentage ?? '') !== target || active !== goal.isActive;
  const valid = title.trim().length > 0 && targetNum > 0 && targetNum <= 100;
  const ownershipLabel = moneyFmt.format(currentOwnership).replace(/,00$/, '');

  return (
    <div className={fmzCn('overflow-hidden rounded-[13px] border-[1.5px] bg-white transition', open ? 'border-fmz-gold/70 shadow-[0_3px_14px_rgba(245,200,66,0.1)]' : 'border-fmz-border-light')}>
      <div className="flex cursor-pointer items-center gap-3 px-4 py-3.5" onClick={() => setOpen((v) => !v)}>
        <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] bg-fmz-navy text-[11px] font-extrabold text-fmz-gold">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-fmz-navy">{title || 'Meta sem título'}</div>
          <div className="mt-0.5 text-[11.5px] text-fmz-text-hint">Atingir {targetNum}% de posse · −{targetNum}% no aluguel</div>
        </div>
        <span className={fmzCn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold',
          status === 'concluida' && 'border-fmz-success-border bg-fmz-success-bg text-fmz-success',
          status === 'ativa' && 'border-fmz-success-border bg-fmz-success-bg text-fmz-success',
          status === 'rascunho' && 'border-fmz-border-light bg-fmz-page text-fmz-text-muted',
        )}>
          {STATUS_LABEL[status]}
        </span>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="h-[6px] w-[74px] overflow-hidden rounded-full bg-fmz-border-light">
            <div className={fmzCn('h-full rounded-full', achieved ? 'bg-fmz-success' : 'bg-gradient-to-r from-fmz-gold-dark to-fmz-gold')} style={{ width: `${progressPct}%` }} />
          </div>
          <span className="w-[34px] text-right font-mono text-[11.5px] font-bold text-fmz-navy">{progressPct}%</span>
        </div>
        <ChevronDown className={fmzCn('h-4 w-4 shrink-0 text-fmz-text-muted transition-transform', open && 'rotate-180')} />
      </div>

      {open && (
        <div className="border-t border-fmz-border-light px-4 pb-[18px] pt-1">
          <div className="mb-3 mt-4 text-[10.5px] font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Meta de posse</div>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
            <label>
              <span className="mb-1.5 block text-[12px] font-semibold text-fmz-navy">Título da meta</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-[9px] border-[1.5px] border-fmz-border-light bg-white px-3 py-2 text-[13.5px] font-medium text-fmz-navy outline-none focus:border-fmz-navy" />
            </label>
            <label>
              <span className="mb-1.5 block text-[12px] font-semibold text-fmz-navy">Participação alvo</span>
              <div className="flex items-stretch overflow-hidden rounded-[9px] border-[1.5px] border-fmz-border-light bg-white focus-within:border-fmz-navy">
                <input type="number" min={0} max={100} value={target} onChange={(e) => setTarget(e.target.value)} className="w-full min-w-0 border-0 bg-transparent px-3 py-2 font-mono text-[13.5px] text-fmz-navy outline-none" />
                <span className="grid place-items-center border-l-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">%</span>
              </div>
            </label>
            <label className="sm:col-span-1">
              <span className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-fmz-navy">Desconto no aluguel <span className="rounded-[5px] border border-fmz-border-light bg-fmz-page px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] text-fmz-text-muted">automático</span></span>
              <div className="flex items-stretch overflow-hidden rounded-[9px] border-[1.5px] border-fmz-border-light bg-fmz-page">
                <input type="text" value={targetNum} disabled className="w-full min-w-0 cursor-not-allowed border-0 bg-transparent px-3 py-2 font-mono text-[13.5px] font-bold text-fmz-text-muted outline-none" />
                <span className="grid place-items-center border-l-[1.5px] border-fmz-border-light bg-fmz-border-light/40 px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">%</span>
              </div>
            </label>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-[11px] border-[1.5px] border-fmz-gold/40 bg-fmz-gold/[0.08] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[#7a5e10]">
            <span className="mt-0.5 text-fmz-gold-dark">💰</span>
            <span>Ao atingir <b className="text-fmz-navy">{targetNum}% de posse</b>, a inquilina passa a pagar <b className="text-fmz-navy">{targetNum}% menos</b> de aluguel. O desconto acompanha a posse automaticamente, sem prazo.</span>
          </div>

          {/* Achievement / progress line */}
          <div className="mt-[18px] rounded-[12px] border-[1.5px] border-fmz-border-light bg-white px-[18px] py-4">
            <div className="mb-2.5 flex items-baseline justify-between">
              <div className="text-[13px] font-semibold text-fmz-navy">Posse atual: <b className="text-[15px] font-extrabold">{ownershipLabel}%</b></div>
              <div className="text-[12px] text-fmz-text-muted">Meta: <span>{targetNum}%</span></div>
            </div>
            <div className="relative h-[10px] overflow-hidden rounded-[6px] bg-fmz-border-light">
              <div className={fmzCn('h-full rounded-[6px] transition-[width]', achieved ? 'bg-fmz-success' : 'bg-gradient-to-r from-fmz-gold-dark to-fmz-gold')} style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-fmz-text-hint">
              <span>0%</span>
              <span className={fmzCn('font-semibold', achieved ? 'text-fmz-success' : 'text-fmz-gold-dark')}>
                {achieved ? `Meta atingida — desconto de ${targetNum}% ativo` : `Faltam ${moneyFmt.format(remaining).replace(/,00$/, '')}% de posse para o desconto de ${targetNum}%`}
              </span>
              <span>Meta {targetNum}%</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-fmz-border-light pt-3.5" onClick={(e) => e.stopPropagation()}>
            <label className="flex items-center gap-2.5">
              <span className="text-[12px] font-semibold text-fmz-navy">Status</span>
              <select value={active ? 'ativa' : 'rascunho'} onChange={(e) => setActive(e.target.value === 'ativa')} className="rounded-[9px] border-[1.5px] border-fmz-border-light bg-white px-3 py-1.5 text-[13px] font-medium text-fmz-navy outline-none focus:border-fmz-navy">
                <option value="ativa">Ativa</option>
                <option value="rascunho">Rascunho</option>
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button type="button" disabled={deleting} onClick={() => onDelete(goal)} className="inline-flex items-center gap-1.5 rounded-[8px] border-[1.5px] border-fmz-error-border bg-fmz-error-bg px-3 py-1.5 text-[12px] font-semibold text-fmz-error transition hover:brightness-95 disabled:opacity-50">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Excluir meta
              </button>
              <button type="button" disabled={!dirty || !valid || saving} onClick={() => onSave(goal.id, { title: title.trim(), targetPercentage: targetNum, isActive: active })} className="inline-flex items-center gap-2 rounded-[9px] bg-fmz-gold px-4 py-2 text-[12.5px] font-bold text-fmz-navy transition hover:bg-fmz-gold-dark disabled:cursor-not-allowed disabled:opacity-45">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Salvar meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Override row (prefilled with the contract's real value) ─────────────────────

function OverrideRow({
  override,
  existing,
  contractValue,
  onSave,
  saving,
}: {
  override: (typeof OVERRIDES)[number];
  existing: FmzAdminFeeParameter | undefined;
  contractValue: number | null;
  onSave: (override: (typeof OVERRIDES)[number], existing: FmzAdminFeeParameter | undefined, value: number) => void;
  saving: boolean;
}) {
  // Effective value = explicit override (parameter_sets) when it exists, otherwise the contract's value.
  const effective = existing ? existing.parameterValue : contractValue;
  const [draft, setDraft] = useState(effective != null ? String(effective) : '');
  useEffect(() => {
    setDraft(effective != null ? String(effective) : '');
  }, [effective]);

  const draftNum = Number(draft.replace(',', '.'));
  const isCurrency = override.valueType === 'currency';
  const baseline = existing ? existing.parameterValue : contractValue;
  const dirty = draft.trim() !== '' && (baseline == null || baseline !== draftNum);
  const valid = Number.isFinite(draftNum) && draftNum >= 0;

  return (
    <div className={fmzCn('flex flex-wrap items-center gap-4 rounded-[12px] border-[1.5px] p-4', existing ? 'border-fmz-gold/60 bg-fmz-gold/[0.06]' : 'border-fmz-border-light')}>
      <div className="min-w-[180px] flex-1">
        <div className="text-[13px] font-bold text-fmz-navy">{override.label}</div>
        <div className="mt-0.5 text-[11.5px] text-fmz-text-hint">{override.description}</div>
      </div>
      <div className="flex w-[220px] flex-col gap-1.5">
        <div className="flex items-stretch overflow-hidden rounded-[9px] border-[1.5px] border-fmz-border-light bg-white focus-within:border-fmz-navy">
          {isCurrency && <span className="grid place-items-center border-r-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">R$</span>}
          <input type="number" value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full min-w-0 border-0 bg-transparent px-3 py-2 font-mono text-[13.5px] text-fmz-navy outline-none" />
          {!isCurrency && <span className="grid place-items-center border-l-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">%</span>}
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-fmz-text-hint">
          {existing ? (
            <span className="rounded-[5px] border border-fmz-gold/70 bg-white px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.03em] text-fmz-gold-dark">Ajustado</span>
          ) : (
            <span>{contractValue != null ? 'Valor do contrato' : 'Específico deste imóvel'}</span>
          )}
          <button type="button" disabled={!dirty || !valid || saving} onClick={() => onSave(override, existing, draftNum)} className="inline-flex items-center gap-1.5 rounded-[8px] bg-fmz-navy px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab ─────────────────────────────────────────────────────────────────────

export function FmzPlatformSettingsPropertyTab({ onToast }: { onToast: (message: string, ok?: boolean) => void }) {
  const [tenants, setTenants] = useState<FmzAdminEligibleTenant[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [goals, setGoals] = useState<FmzAdminOwnershipGoal[]>([]);
  const [parameters, setParameters] = useState<FmzAdminFeeParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [savingOverrideKey, setSavingOverrideKey] = useState<string | null>(null);
  const [addingMeta, setAddingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => tenants.find((t) => t.propertyId === selectedId) ?? null, [tenants, selectedId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const eligible = await listEligibleTenants();
        setTenants(eligible);
        if (eligible.length) setSelectedId(eligible[0].propertyId);
      } catch (err) {
        setError(normalizeFmzApiError(err).description);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadSettings = useCallback(async (propertyId: string) => {
    setSettingsLoading(true);
    try {
      const settings = await getAdminTenantSettings({ propertyId });
      setGoals(settings.goals);
      setParameters(settings.parameters.filter((p) => p.parameterScope === 'property'));
    } catch (err) {
      onToast(normalizeFmzApiError(err).description, false);
    } finally {
      setSettingsLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    if (selectedId) void loadSettings(selectedId);
  }, [selectedId, loadSettings]);

  const handleSaveGoal = useCallback(async (goalId: string, patch: { title: string; targetPercentage: number; isActive: boolean }) => {
    setSavingGoalId(goalId);
    try {
      const updated = await updateOwnershipGoal(goalId, patch);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
      onToast('Meta salva.');
    } catch (err) {
      onToast(normalizeFmzApiError(err).description, false);
    } finally {
      setSavingGoalId(null);
    }
  }, [onToast]);

  const handleDeleteGoal = useCallback(async (goal: FmzAdminOwnershipGoal) => {
    if (!window.confirm(`Excluir a meta "${goal.title}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingGoalId(goal.id);
    try {
      await deleteOwnershipGoal(goal.id);
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      onToast('Meta excluída.');
    } catch (err) {
      onToast(normalizeFmzApiError(err).description, false);
    } finally {
      setDeletingGoalId(null);
    }
  }, [onToast]);

  const handleAddMeta = useCallback(async () => {
    if (!selected) return;
    setAddingMeta(true);
    try {
      const created = await createOwnershipGoal({
        tenantUserId: selected.tenantUserId,
        propertyId: selected.propertyId,
        rentalContractId: selected.rentalContractId,
        propertyTokenizationId: selected.propertyTokenizationId,
        goalKey: `meta_${Date.now()}`,
        title: 'Nova meta de posse',
        targetPercentage: 50,
        isActive: false,
      });
      setGoals((prev) => [...prev, created]);
      onToast('Meta criada.');
    } catch (err) {
      onToast(normalizeFmzApiError(err).description, false);
    } finally {
      setAddingMeta(false);
    }
  }, [selected, onToast]);

  const handleSaveOverride = useCallback(async (override: (typeof OVERRIDES)[number], existing: FmzAdminFeeParameter | undefined, value: number) => {
    if (!selected) return;
    setSavingOverrideKey(override.key);
    try {
      if (existing) {
        const updated = await updateFeeParameter(existing.id, { parameterValue: value });
        setParameters((prev) => prev.map((p) => (p.id === existing.id ? updated : p)));
      } else {
        const created = await createFeeParameter({
          parameterKey: override.key,
          parameterValue: value,
          valueType: override.valueType,
          parameterScope: 'property',
          propertyId: selected.propertyId,
          isActive: true,
        });
        setParameters((prev) => [...prev, created]);
      }
      onToast('Ajuste salvo.');
    } catch (err) {
      onToast(normalizeFmzApiError(err).description, false);
    } finally {
      setSavingOverrideKey(null);
    }
  }, [selected, onToast]);

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-fmz-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Carregando imóveis…</div>;
  }
  if (error) {
    return (
      <div className="rounded-[14px] border border-dashed border-fmz-border-light bg-white p-8 text-center">
        <p className="font-sans text-[15px] font-bold text-fmz-navy">Erro ao carregar</p>
        <p className="mt-2 text-[13px] text-fmz-text-muted">{error}</p>
      </div>
    );
  }
  if (!tenants.length) {
    return (
      <div className="rounded-[14px] border border-dashed border-fmz-border-light bg-white p-8 text-center">
        <p className="font-sans text-[15px] font-bold text-fmz-navy">Nenhum imóvel com inquilino ativo</p>
        <p className="mt-2 text-[13px] text-fmz-text-muted">Ative um contrato de locação para configurar metas e ajustes por imóvel.</p>
      </div>
    );
  }

  const overrideFor = (key: string) => parameters.find((p) => p.parameterKey === key);
  const contractValueFor = (field: (typeof OVERRIDES)[number]['contractField']): number | null =>
    field && selected ? Number(selected[field]) : null;

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Property selector */}
      <div className="flex items-center gap-3">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="rounded-[9px] border-[1.5px] border-fmz-border-light bg-white px-3 py-2 text-[13px] font-semibold text-fmz-navy outline-none focus:border-fmz-navy">
          {tenants.map((t) => (
            <option key={t.propertyId} value={t.propertyId}>{t.propertyName}{t.propertyCode ? ` · ${t.propertyCode}` : ''}</option>
          ))}
        </select>
        <span className="text-[12px] text-fmz-text-hint">{tenants.length} imóvel{tenants.length === 1 ? '' : 'is'} com contrato ativo</span>
      </div>

      {selected && <PropertyCard tenant={selected} />}

      {/* Metas */}
      <section className="overflow-hidden rounded-[14px] border-[1.5px] border-fmz-gold/60 bg-white shadow-[0_4px_18px_rgba(245,200,66,0.12)]">
        <header className="flex items-center gap-3 border-b border-fmz-gold/40 bg-fmz-gold/[0.14] px-[22px] py-4">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-fmz-gold text-fmz-navy"><Target className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-fmz-navy">Metas do inquilino</div>
            <div className="mt-0.5 text-[11.5px] text-fmz-text-hint">Um ou mais objetivos de aquisição de tokens deste imóvel no modelo &quot;alugue enquanto compra&quot;.</div>
          </div>
          <span className="rounded-full border border-fmz-success-border bg-fmz-success-bg px-2.5 py-1 text-[11px] font-bold text-fmz-success">{goals.length} {goals.length === 1 ? 'meta' : 'metas'}</span>
        </header>
        <div className="flex flex-col gap-3.5 p-[22px]">
          {settingsLoading ? (
            <div className="flex items-center gap-2 py-6 text-fmz-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
          ) : goals.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-fmz-border-light py-6 text-center text-[13px] text-fmz-text-hint">Nenhuma meta definida para este imóvel. Adicione a primeira meta abaixo.</div>
          ) : (
            goals.map((g, i) => (
              <MetaCard
                key={g.id}
                goal={g}
                index={i}
                currentOwnership={selected?.currentOwnershipPercentage ?? 0}
                onSave={handleSaveGoal}
                onDelete={handleDeleteGoal}
                saving={savingGoalId === g.id}
                deleting={deletingGoalId === g.id}
              />
            ))
          )}
          <button type="button" disabled={addingMeta} onClick={handleAddMeta} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-fmz-gold/70 bg-fmz-gold/[0.08] py-3 text-[13px] font-bold text-fmz-gold-dark transition hover:bg-fmz-gold/[0.16] disabled:opacity-50">
            {addingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar meta
          </button>
        </div>
      </section>

      {/* Overrides */}
      <section className="overflow-hidden rounded-[14px] border-[1.5px] border-fmz-border-light bg-white">
        <header className="flex items-center gap-3 border-b border-fmz-border-light px-[22px] py-4">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#EFF6FF] text-[#2563EB]"><SlidersHorizontal className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-fmz-navy">Ajustes financeiros do imóvel</div>
            <div className="mt-0.5 text-[11.5px] text-fmz-text-hint">Sobrescreve os parâmetros gerais apenas para este imóvel. Vazio = usa o valor geral da plataforma.</div>
          </div>
        </header>
        <div className="flex flex-col gap-3 p-[22px]">
          {OVERRIDES.map((o) => (
            <OverrideRow
              key={o.key}
              override={o}
              existing={overrideFor(o.key)}
              contractValue={contractValueFor(o.contractField)}
              onSave={handleSaveOverride}
              saving={savingOverrideKey === o.key}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
