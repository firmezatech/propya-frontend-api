'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Check, Loader2, Share2, SlidersHorizontal } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { normalizeFmzApiError } from '../../api-errors/domain';
import { listPlatformParams, updatePlatformParam } from '../services/fmz-platform-params-api';
import type { FmzPlatformParam } from '../domain';

// Which platform_parameters keys each card edits, and the display affix for each field.
// Labels/descriptions come from the DB rows (listPlatformParams), so this only declares grouping.
const COMPANY_KEYS = [
  'brand_name',
  'company_legal_name',
  'company_cnpj',
  'company_address',
  'support_email',
  'support_whatsapp_url',
] as const;

const SOCIAL_KEYS = [
  'social_instagram',
  'social_tiktok',
  'social_linkedin',
  'social_youtube',
  'social_facebook',
  'social_x',
] as const;

const GENERAL_KEYS = [
  'token_unit_value_brl',
  'token_purchase_fee_percent',
  'platform_admin_fee_percent',
  'min_repasse_brl',
  'default_due_day',
  'late_fee_percent',
  'daily_interest_percent',
  'token_symbol',
  'token_decimals',
] as const;

// Prefix/suffix affix per key (falls back to none). Percent params get a "%" suffix from value_type.
const AFFIX: Record<string, { prefix?: string; suffix?: string }> = {
  token_unit_value_brl: { prefix: 'R$' },
  min_repasse_brl: { prefix: 'R$' },
  default_due_day: { prefix: 'Dia' },
  support_whatsapp_url: { prefix: 'wa.me' },
};

type ParamState = {
  label: string;
  description: string | null;
  valueType: FmzPlatformParam['valueType'];
  original: string;
  draft: string;
};

const paramToString = (p: FmzPlatformParam): string => {
  if (p.valueType === 'numeric' || p.valueType === 'percent') {
    return p.numericValue != null ? String(p.numericValue) : '';
  }
  return p.textValue ?? '';
};

const affixFor = (key: string, valueType: FmzPlatformParam['valueType']) => {
  const base = AFFIX[key] ?? {};
  if (valueType === 'percent' && !base.suffix) return { ...base, suffix: '%' };
  return base;
};

function FieldRow({
  paramKey,
  state,
  onChange,
}: {
  paramKey: string;
  state: ParamState;
  onChange: (key: string, value: string) => void;
}) {
  const { prefix, suffix } = affixFor(paramKey, state.valueType);
  const isNumeric = state.valueType === 'numeric' || state.valueType === 'percent';
  return (
    <div className="mb-5 min-w-0">
      <label className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-fmz-navy">
        {state.label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-[9px] border-[1.5px] border-fmz-border-light bg-white transition focus-within:border-fmz-navy focus-within:ring-[3px] focus-within:ring-fmz-navy/[0.06]">
        {prefix && (
          <span className="grid place-items-center border-r-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">
            {prefix}
          </span>
        )}
        <input
          type={isNumeric ? 'number' : 'text'}
          value={state.draft}
          onChange={(event) => onChange(paramKey, event.target.value)}
          className={fmzCn(
            'w-full min-w-0 border-0 bg-transparent px-3 py-2.5 text-[13.5px] font-medium text-fmz-navy outline-none placeholder:text-fmz-text-hint',
            isNumeric && 'font-mono',
          )}
        />
        {suffix && (
          <span className="grid place-items-center border-l-[1.5px] border-fmz-border-light bg-fmz-page px-3 font-mono text-[12.5px] font-bold text-fmz-text-muted">
            {suffix}
          </span>
        )}
      </div>
      {state.description && (
        <p className="mt-1.5 text-[11px] leading-[1.4] text-fmz-text-hint">{state.description}</p>
      )}
    </div>
  );
}

function SettingsCard({
  icon,
  iconClass,
  title,
  description,
  keys,
  states,
  onChange,
  onSave,
  saving,
  columns,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  keys: readonly string[];
  states: Record<string, ParamState>;
  onChange: (key: string, value: string) => void;
  onSave: (keys: readonly string[]) => void;
  saving: boolean;
  columns: 2 | 3;
}) {
  const present = keys.filter((k) => states[k]);
  const dirty = present.some((k) => states[k].draft !== states[k].original);
  return (
    <section className="overflow-hidden rounded-[14px] border-[1.5px] border-fmz-border-light bg-white">
      <header className="flex items-center gap-3 border-b border-fmz-border-light px-[22px] py-4">
        <span className={fmzCn('grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px]', iconClass)}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold tracking-[-0.01em] text-fmz-navy">{title}</div>
          <div className="mt-0.5 text-[11.5px] text-fmz-text-hint">{description}</div>
        </div>
      </header>
      <div className="p-[22px]">
        <div className={fmzCn('grid min-w-0 gap-x-5', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {present.map((key) => (
            <FieldRow key={key} paramKey={key} state={states[key]} onChange={onChange} />
          ))}
        </div>
      </div>
      <footer className="flex items-center gap-2.5 border-t border-fmz-border-light bg-[#FCFCFD] px-[22px] py-3">
        <span
          className={fmzCn(
            'mr-auto inline-flex items-center gap-1.5 text-[12px] font-semibold transition-opacity',
            dirty ? 'text-fmz-warning opacity-100' : 'opacity-0',
          )}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-current" />
          Alterações não salvas
        </span>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => onSave(keys)}
          className="inline-flex items-center gap-2 rounded-[9px] bg-fmz-gold px-4 py-2 text-[12.5px] font-bold text-fmz-navy shadow-[0_2px_8px_rgba(245,200,66,0.25)] transition hover:bg-fmz-gold-dark disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Salvar seção
        </button>
      </footer>
    </section>
  );
}

export function FmzPlatformSettingsGeneralTab({ onToast }: { onToast: (message: string, ok?: boolean) => void }) {
  const [states, setStates] = useState<Record<string, ParamState>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = await listPlatformParams();
      const next: Record<string, ParamState> = {};
      for (const p of params) {
        const value = paramToString(p);
        next[p.parameterKey] = {
          label: p.label || p.parameterKey,
          description: p.description,
          valueType: p.valueType,
          original: value,
          draft: value,
        };
      }
      setStates(next);
    } catch (error) {
      setLoadError(normalizeFmzApiError(error).description);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleChange = useCallback((key: string, value: string) => {
    setStates((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], draft: value } } : prev));
  }, []);

  const handleSave = useCallback(
    async (keys: readonly string[], cardId: string) => {
      const changed = keys.filter((k) => states[k] && states[k].draft !== states[k].original);
      if (!changed.length) return;
      setSavingCard(cardId);
      try {
        for (const key of changed) {
          await updatePlatformParam(key, states[key].draft.trim());
        }
        setStates((prev) => {
          const next = { ...prev };
          for (const key of changed) next[key] = { ...next[key], original: next[key].draft };
          return next;
        });
        onToast('Seção salva com sucesso.');
      } catch (error) {
        onToast(normalizeFmzApiError(error).description, false);
      } finally {
        setSavingCard(null);
      }
    },
    [states, onToast],
  );

  const cards = useMemo(
    () => [
      {
        id: 'company',
        title: 'Dados da empresa',
        description: 'Informações usadas em boletos, contratos, e-mails e comprovantes.',
        icon: <Building2 className="h-4 w-4" />,
        iconClass: 'bg-[#F5F3FF] text-[#7C3AED]',
        keys: COMPANY_KEYS,
        columns: 2 as const,
      },
      {
        id: 'social',
        title: 'Redes sociais',
        description: 'Links exibidos nos rodapés do site, dos e-mails e dos comprovantes. Vazio oculta a rede.',
        icon: <Share2 className="h-4 w-4" />,
        iconClass: 'bg-[#EFF6FF] text-[#2563EB]',
        keys: SOCIAL_KEYS,
        columns: 2 as const,
      },
      {
        id: 'general',
        title: 'Parâmetros financeiros padrão',
        description: 'Valores aplicados a todos os imóveis, exceto quando há ajuste específico.',
        icon: <SlidersHorizontal className="h-4 w-4" />,
        iconClass: 'bg-fmz-success-bg text-fmz-success',
        keys: GENERAL_KEYS,
        columns: 3 as const,
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-fmz-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando configurações…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-[14px] border border-dashed border-fmz-border-light bg-white p-8 text-center">
        <p className="font-sans text-[15px] font-bold text-fmz-navy">Erro ao carregar</p>
        <p className="mt-2 text-[13px] text-fmz-text-muted">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {cards.map((card) => (
        <SettingsCard
          key={card.id}
          icon={card.icon}
          iconClass={card.iconClass}
          title={card.title}
          description={card.description}
          keys={card.keys}
          columns={card.columns}
          states={states}
          onChange={handleChange}
          onSave={(keys) => handleSave(keys, card.id)}
          saving={savingCard === card.id}
        />
      ))}
    </div>
  );
}
