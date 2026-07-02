'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, SlidersHorizontal, Target } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { normalizeFmzApiError } from '../../api-errors/domain';
import {
  createFeeParameter,
  createOwnershipGoal,
  getAdminTenantSettings,
  listEligibleTenants,
  updateFeeParameter,
  updateOwnershipGoal,
} from '../services';
import { listPlatformParams } from '../services/fmz-platform-params-api';
import type {
  FmzAdminEligibleTenant,
  FmzAdminFeeParameter,
  FmzAdminOwnershipGoal,
  FmzTenantSettingsValueType,
} from '../domain';

// The 5 per-property financial overrides representable by the fee-parameter model
// (currency|percentage). Each maps to the global platform_parameters key that supplies the
// "valor geral" fallback shown beside it (null = the value only ever exists per-property).
const OVERRIDES: {
  key: string;
  label: string;
  description: string;
  valueType: FmzTenantSettingsValueType;
  generalKey: string | null;
}[] = [
  { key: 'condominio_brl', label: 'Valor do condomínio', description: 'Cobrado junto ao aluguel deste imóvel.', valueType: 'currency', generalKey: null },
  { key: 'iptu_mensal_brl', label: 'IPTU mensal', description: 'Rateio mensal do IPTU, se houver.', valueType: 'currency', generalKey: null },
  { key: 'token_unit_value_brl', label: 'Valor do token', description: 'Preço unitário do token deste imóvel.', valueType: 'currency', generalKey: 'token_unit_value_brl' },
  { key: 'token_purchase_fee_percent', label: 'Taxa de token', description: 'Taxa sobre compra de token neste imóvel.', valueType: 'percentage', generalKey: 'token_purchase_fee_percent' },
  { key: 'platform_admin_fee_percent', label: 'Taxa da plataforma', description: 'Administração sobre o aluguel.', valueType: 'percentage', generalKey: 'platform_admin_fee_percent' },
];

const fmtGeneral = (value: number | null, valueType: FmzTenantSettingsValueType): string => {
  if (value == null) return '';
  return valueType === 'currency'
    ? `R$ ${value.toFixed(2).replace('.', ',')}`
    : `${String(value).replace('.', ',')}%`;
};

// ── Metas ───────────────────────────────────────────────────────────────────

function MetaRow({
  goal,
  onSave,
  saving,
}: {
  goal: FmzAdminOwnershipGoal;
  onSave: (goalId: string, patch: { title: string; targetPercentage: number; isActive: boolean }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(goal.title);
  const [target, setTarget] = useState(String(goal.targetPercentage ?? ''));
  const [active, setActive] = useState(goal.isActive);

  const targetNum = Number(target.replace(',', '.'));
  const dirty = title !== goal.title || String(goal.targetPercentage ?? '') !== target || active !== goal.isActive;
  const valid = title.trim().length > 0 && Number.isFinite(targetNum) && targetNum > 0 && targetNum <= 100;

  return (
    <div className="rounded-[13px] border-[1.5px] border-fmz-border-light bg-white p-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <label className="min-w-[200px] flex-1">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-fmz-text-muted">Título da meta</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-[9px] border-[1.5px] border-fmz-border-light bg-white px-3 py-2 text-[13.5px] font-medium text-fmz-navy outline-none focus:border-fmz-navy"
          />
        </label>
        <label className="w-[150px]">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-fmz-text-muted">Participação alvo</span>
          <div className="flex items-stretch overflow-hidden rounded-[9px] border-[1.5px] border-fmz-border-light bg-white focus-within:border-fmz-navy">
            <input
              type="number"
              min={0}
              max={100}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full min-w-0 border-0 bg-transparent px-3 py-2 font-mono text-[13.5px] text-fmz-navy outline-none"
            />
            <span className="grid place-items-center border-l-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">%</span>
          </div>
        </label>
        <button
          type="button"
          onClick={() => setActive((v) => !v)}
          className={fmzCn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition',
            active ? 'border-fmz-success-border bg-fmz-success-bg text-fmz-success' : 'border-fmz-border-light bg-fmz-page text-fmz-text-muted',
          )}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-current" />
          {active ? 'Ativa' : 'Rascunho'}
        </button>
      </div>
      <p className="mt-3 rounded-[10px] border-[1.5px] border-fmz-gold/40 bg-fmz-gold/[0.08] px-3 py-2 text-[12px] leading-[1.5] text-fmz-navy">
        Ao atingir <b>{Number.isFinite(targetNum) ? targetNum : 0}% de posse</b>, a inquilina passa a pagar{' '}
        <b>{Number.isFinite(targetNum) ? targetNum : 0}% menos</b> de aluguel — o desconto acompanha a posse.
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={!dirty || !valid || saving}
          onClick={() => onSave(goal.id, { title: title.trim(), targetPercentage: targetNum, isActive: active })}
          className="inline-flex items-center gap-2 rounded-[9px] bg-fmz-gold px-4 py-2 text-[12.5px] font-bold text-fmz-navy transition hover:bg-fmz-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Salvar meta
        </button>
      </div>
    </div>
  );
}

// ── Overrides ─────────────────────────────────────────────────────────────────

function OverrideRow({
  override,
  existing,
  generalValue,
  onSave,
  saving,
}: {
  override: (typeof OVERRIDES)[number];
  existing: FmzAdminFeeParameter | undefined;
  generalValue: number | null;
  onSave: (override: (typeof OVERRIDES)[number], existing: FmzAdminFeeParameter | undefined, value: number) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(existing ? String(existing.parameterValue) : '');
  useEffect(() => {
    setDraft(existing ? String(existing.parameterValue) : '');
  }, [existing]);

  const draftNum = Number(draft.replace(',', '.'));
  const dirty = draft.trim() !== '' && (!existing || existing.parameterValue !== draftNum);
  const valid = Number.isFinite(draftNum) && draftNum >= 0;
  const isCurrency = override.valueType === 'currency';

  return (
    <div className={fmzCn('flex flex-wrap items-center gap-4 rounded-[12px] border-[1.5px] p-4', existing ? 'border-fmz-gold/60 bg-fmz-gold/[0.06]' : 'border-fmz-border-light')}>
      <div className="min-w-[180px] flex-1">
        <div className="text-[13px] font-bold text-fmz-navy">{override.label}</div>
        <div className="mt-0.5 text-[11.5px] text-fmz-text-hint">{override.description}</div>
      </div>
      <div className="flex w-[220px] flex-col gap-1.5">
        <div className="flex items-stretch overflow-hidden rounded-[9px] border-[1.5px] border-fmz-border-light bg-white focus-within:border-fmz-navy">
          {isCurrency && <span className="grid place-items-center border-r-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">R$</span>}
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-w-0 border-0 bg-transparent px-3 py-2 font-mono text-[13.5px] text-fmz-navy outline-none"
          />
          {!isCurrency && <span className="grid place-items-center border-l-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">%</span>}
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-fmz-text-hint">
          {existing ? (
            <span className="rounded-[5px] border border-fmz-gold/70 bg-white px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.03em] text-fmz-gold-dark">Ajustado</span>
          ) : (
            <span>{generalValue != null ? `Usando geral: ${fmtGeneral(generalValue, override.valueType)}` : 'Específico deste imóvel'}</span>
          )}
          <button
            type="button"
            disabled={!dirty || !valid || saving}
            onClick={() => onSave(override, existing, draftNum)}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-fmz-navy px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
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
  const [generalValues, setGeneralValues] = useState<Record<string, number | null>>({});
  const [selectedId, setSelectedId] = useState<string>('');
  const [goals, setGoals] = useState<FmzAdminOwnershipGoal[]>([]);
  const [parameters, setParameters] = useState<FmzAdminFeeParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [savingOverrideKey, setSavingOverrideKey] = useState<string | null>(null);
  const [addingMeta, setAddingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => tenants.find((t) => t.propertyId === selectedId) ?? null, [tenants, selectedId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [eligible, params] = await Promise.all([listEligibleTenants(), listPlatformParams()]);
        setTenants(eligible);
        const generals: Record<string, number | null> = {};
        for (const p of params) generals[p.parameterKey] = p.numericValue;
        setGeneralValues(generals);
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

  const handleSaveGoal = useCallback(
    async (goalId: string, patch: { title: string; targetPercentage: number; isActive: boolean }) => {
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
    },
    [onToast],
  );

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

  const handleSaveOverride = useCallback(
    async (override: (typeof OVERRIDES)[number], existing: FmzAdminFeeParameter | undefined, value: number) => {
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
    },
    [selected, onToast],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-fmz-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando imóveis…
      </div>
    );
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

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Picker */}
      <div className="flex flex-wrap items-center gap-4 rounded-[13px] border-[1.5px] border-fmz-border-light bg-white px-[18px] py-3.5">
        <label className="min-w-[260px] flex-1">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-fmz-text-hint">Imóvel</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-[9px] border-[1.5px] border-fmz-border-light bg-white px-3 py-2.5 text-[14px] font-bold text-fmz-navy outline-none focus:border-fmz-navy"
          >
            {tenants.map((t) => (
              <option key={t.propertyId} value={t.propertyId}>
                {t.propertyName}{t.propertyCode ? ` · ${t.propertyCode}` : ''}
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <div className="text-[12px] text-fmz-text-muted">
            Inquilino: <b className="font-semibold text-fmz-navy">{selected.tenantName}</b>
          </div>
        )}
      </div>

      {/* Metas */}
      <section className="overflow-hidden rounded-[14px] border-[1.5px] border-fmz-border-light bg-white">
        <header className="flex items-center gap-3 border-b border-fmz-border-light px-[22px] py-4">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-fmz-gold text-fmz-navy"><Target className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-fmz-navy">Metas do inquilino</div>
            <div className="mt-0.5 text-[11.5px] text-fmz-text-hint">Objetivos de aquisição de tokens deste imóvel no modelo &quot;alugue enquanto compra&quot;.</div>
          </div>
          <span className="rounded-full bg-fmz-page px-2.5 py-1 text-[11px] font-bold text-fmz-text-muted">{goals.length} {goals.length === 1 ? 'meta' : 'metas'}</span>
        </header>
        <div className="flex flex-col gap-3 p-[22px]">
          {settingsLoading ? (
            <div className="flex items-center gap-2 py-6 text-fmz-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
          ) : goals.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-fmz-border-light py-6 text-center text-[13px] text-fmz-text-hint">Nenhuma meta definida para este imóvel.</div>
          ) : (
            goals.map((g) => <MetaRow key={g.id} goal={g} onSave={handleSaveGoal} saving={savingGoalId === g.id} />)
          )}
          <button
            type="button"
            disabled={addingMeta}
            onClick={handleAddMeta}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-fmz-gold/70 bg-fmz-gold/[0.08] py-3 text-[13px] font-bold text-fmz-gold-dark transition hover:bg-fmz-gold/[0.16] disabled:opacity-50"
          >
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
              generalValue={o.generalKey ? generalValues[o.generalKey] ?? null : null}
              onSave={handleSaveOverride}
              saving={savingOverrideKey === o.key}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
