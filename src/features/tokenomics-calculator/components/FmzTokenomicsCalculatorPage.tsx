'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Calculator, Plus, Trash2 } from 'lucide-react';
import { FmzConnectedPageShell } from '../../../components/layout/FmzConnectedPageShell';
import { FmzSelect } from '../../../components/design-system';
import { calculateTokenomicsDistribution } from '../services/fmz-tokenomics-calculator-api';
import type {
  FmzTokenomicsDistributionPayload,
  FmzTokenomicsDistributionResult,
  FmzTokenomicsParticipantInput,
  FmzTokenomicsParticipantRole,
} from '../domain/fmz-tokenomics-calculator.types';

type ParticipantFormRow = FmzTokenomicsParticipantInput & { id: string };

type NumericPayloadField = keyof Pick<
  FmzTokenomicsDistributionPayload,
  | 'property_value'
  | 'rent_gross_amount'
  | 'token_unit_value'
  | 'charges_amount'
  | 'extra_discounts_amount'
  | 'fine_and_interest_amount'
  | 'admin_fee_percent'
  | 'token_admin_fee_percent'
>;

type CalculatorFormState = Omit<FmzTokenomicsDistributionPayload, 'participants'>;

const roleLabels: Record<FmzTokenomicsParticipantRole, string> = {
  investor: 'Investidor',
  owner: 'Proprietário',
  tenant: 'Inquilina',
};

const initialFormState: CalculatorFormState = {
  reference_month: '2026-05',
  property_value: 500000,
  rent_gross_amount: 3000,
  token_unit_value: 1,
  charges_amount: 0,
  extra_discounts_amount: 0,
  fine_and_interest_amount: 0,
  admin_fee_percent: 7.5,
  token_admin_fee_percent: 10,
  admin_fee_mode: 'deduct_from_distribution',
  tenant_receives_cash_distribution: false,
};

const initialParticipants: ParticipantFormRow[] = [
  { id: 'investor-1', name: 'Investidor 1', role: 'investor', ownership_percent: 20, tokens_purchased: 0 },
  { id: 'investor-2', name: 'Investidor 2', role: 'investor', ownership_percent: 15, tokens_purchased: 0 },
  { id: 'owner-1', name: 'Proprietária', role: 'owner', ownership_percent: 55, tokens_purchased: 0 },
  { id: 'tenant-1', name: 'Inquilina', role: 'tenant', ownership_percent: 10, tokens_purchased: 0 },
];

const formatCurrency = (value: string | number | null | undefined): string => {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(numericValue) ? numericValue : 0);
};

const formatPercent = (value: string | number | null | undefined): string => {
  const numericValue = Number(value ?? 0);
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number.isFinite(numericValue) ? numericValue : 0)}%`;
};

const normalizeNumber = (value: string): number => {
  if (!value.trim()) return 0;
  const normalizedValue = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const numericValue = Number(normalizedValue);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const buildParticipantId = (): string => `participant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-[#0D1321] p-5 text-white shadow-sm">
      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">{label}</span>
      <strong className="mt-2 block text-2xl font-extrabold tracking-[-0.03em]">{value}</strong>
    </article>
  );
}

function FinancialSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E8EAF0] py-3 last:border-b-0">
      <dt className="text-sm font-bold text-[#5A6478]">{label}</dt>
      <dd className="text-right text-sm font-extrabold text-[#0D1321]">{value}</dd>
    </div>
  );
}

export function FmzTokenomicsCalculatorPage() {
  const [formState, setFormState] = useState<CalculatorFormState>(initialFormState);
  const [participants, setParticipants] = useState<ParticipantFormRow[]>(initialParticipants);
  const [result, setResult] = useState<FmzTokenomicsDistributionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const totalOwnership = useMemo(
    () => participants.reduce((sum, participant) => sum + Number(participant.ownership_percent || 0), 0),
    [participants],
  );

  const handleNumericChange = useCallback((field: NumericPayloadField, value: string) => {
    setFormState((currentState) => ({ ...currentState, [field]: normalizeNumber(value) }));
  }, []);

  const updateParticipant = useCallback(<K extends keyof FmzTokenomicsParticipantInput>(
    participantId: string,
    field: K,
    value: FmzTokenomicsParticipantInput[K],
  ) => {
    setParticipants((currentParticipants) => currentParticipants.map((participant) => (
      participant.id === participantId ? { ...participant, [field]: value } : participant
    )));
  }, []);

  const addParticipant = useCallback(() => {
    setParticipants((currentParticipants) => [
      ...currentParticipants,
      { id: buildParticipantId(), name: 'Novo participante', role: 'investor', ownership_percent: 0, tokens_purchased: 0 },
    ]);
  }, []);

  const removeParticipant = useCallback((participantId: string) => {
    setParticipants((currentParticipants) => currentParticipants.filter((participant) => participant.id !== participantId));
  }, []);

  const buildPayload = useCallback((): FmzTokenomicsDistributionPayload => ({
    ...formState,
    participants: participants.map(({ id: _id, ...participant }) => participant),
  }), [formState, participants]);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setErrorMessage(null);

    try {
      const response = await calculateTokenomicsDistribution(buildPayload());
      setResult(response);
    } catch (error) {
      const fallbackMessage = 'Não foi possível calcular a distribuição. Verifique os dados e tente novamente.';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        setErrorMessage(response?.data?.message ?? fallbackMessage);
      } else {
        setErrorMessage(fallbackMessage);
      }
    } finally {
      setIsCalculating(false);
    }
  }, [buildPayload]);

  return (
    <FmzConnectedPageShell className="space-y-6 overflow-x-hidden" width="wide">
      <section className="w-full overflow-hidden rounded-[28px] border border-[#E8EAF0] bg-white shadow-sm">
        <div className="border-b border-[#E8EAF0] bg-gradient-to-br from-[#FFF9E6] via-white to-[#F7F8FA] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#C8A020]">
                <Calculator className="h-4 w-4" /> Calculadora tokenomics
              </p>
              <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#0D1321] sm:text-4xl">
                Simule distribuição de aluguel, desconto da inquilina e repasses
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5A6478]">
                Esta página apenas envia os parâmetros para o backend em <strong>POST /tokenomics/calculate</strong> e exibe o resultado. Nada é salvo no banco.
              </p>
            </div>
            <div className="rounded-2xl border border-[#F0D870] bg-white/80 p-4 text-sm text-[#5A6478]">
              <div className="font-bold text-[#0D1321]">Soma da posse informada</div>
              <div className="mt-1 text-2xl font-extrabold text-[#1A8C5B]">{formatPercent(totalOwnership)}</div>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-5 p-4 md:p-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)] 2xl:p-8">
          <section className="min-w-0 space-y-5 rounded-3xl border border-[#E8EAF0] bg-[#F7F8FA] p-4 sm:p-5">
            <div>
              <h2 className="text-lg font-extrabold text-[#0D1321]">Parâmetros gerais</h2>
              <p className="mt-1 text-sm text-[#5A6478]">Informe os valores base para a simulação.</p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Mês de referência
                <input
                  type="month"
                  value={formState.reference_month}
                  onChange={(event) => setFormState((currentState) => ({ ...currentState, reference_month: event.target.value }))}
                  className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Valor do imóvel
                <input type="number" step="0.01" value={formState.property_value} onChange={(event) => handleNumericChange('property_value', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Aluguel bruto
                <input type="number" step="0.01" value={formState.rent_gross_amount} onChange={(event) => handleNumericChange('rent_gross_amount', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Valor unitário do token em %
                <input type="number" step="0.000001" value={formState.token_unit_value} onChange={(event) => handleNumericChange('token_unit_value', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Taxa adm aluguel (%)
                <input type="number" step="0.01" value={formState.admin_fee_percent} onChange={(event) => handleNumericChange('admin_fee_percent', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Taxa adm token (%)
                <input type="number" step="0.01" value={formState.token_admin_fee_percent} onChange={(event) => handleNumericChange('token_admin_fee_percent', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Encargos adicionais
                <input type="number" step="0.01" value={formState.charges_amount} onChange={(event) => handleNumericChange('charges_amount', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Descontos adicionais
                <input type="number" step="0.01" value={formState.extra_discounts_amount} onChange={(event) => handleNumericChange('extra_discounts_amount', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Multa e juros
                <input type="number" step="0.01" value={formState.fine_and_interest_amount} onChange={(event) => handleNumericChange('fine_and_interest_amount', event.target.value)} className="min-h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 text-[#0D1321] outline-none focus:border-[#F5C842]" />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#5A6478]">
                Modo da taxa administrativa
                <FmzSelect
                  value={formState.admin_fee_mode}
                  onChange={(event) => setFormState((currentState) => ({ ...currentState, admin_fee_mode: event.target.value as CalculatorFormState['admin_fee_mode'] }))}
                  wrapperClassName="h-11 rounded-2xl border border-[#E8EAF0] bg-white px-3 focus-within:border-[#F5C842]"
                  className="text-[#0D1321]"
                >
                  <option value="deduct_from_distribution">Deduzir do repasse</option>
                  <option value="add_to_tenant_boleto">Adicionar no boleto da inquilina</option>
                </FmzSelect>
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-[#E8EAF0] bg-white p-4 text-sm font-bold text-[#5A6478]">
              <input
                type="checkbox"
                checked={formState.tenant_receives_cash_distribution}
                onChange={(event) => setFormState((currentState) => ({ ...currentState, tenant_receives_cash_distribution: event.target.checked }))}
                className="h-4 w-4"
              />
              Inquilina também recebe repasse em dinheiro além do desconto
            </label>
          </section>

          <section className="min-w-0 space-y-5 overflow-hidden rounded-3xl border border-[#E8EAF0] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#0D1321]">Participantes</h2>
                <p className="mt-1 text-sm text-[#5A6478]">Parametrize investidores, proprietária e inquilina.</p>
              </div>
              <button type="button" onClick={addParticipant} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FFF9E6] px-4 py-2 text-sm font-extrabold text-[#C8A020] ring-1 ring-[#F0D870] transition hover:bg-[#F5C842]/20">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E8EAF0]">
              <table className="w-full min-w-[680px] table-fixed border-collapse text-left text-sm">
                <thead className="bg-[#F7F8FA] text-xs uppercase tracking-[0.08em] text-[#9AA3B0]">
                  <tr>
                    <th className="w-[23%] px-3 py-3">Nome</th>
                    <th className="w-[18%] px-3 py-3">Tipo</th>
                    <th className="w-[17%] px-3 py-3">% posse</th>
                    <th className="w-[22%] px-3 py-3">Tokens comprados</th>
                    <th className="w-[20%] px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.id} className="border-t border-[#E8EAF0]">
                      <td className="px-3 py-3"><input value={participant.name} onChange={(event) => updateParticipant(participant.id, 'name', event.target.value)} className="min-h-10 w-full rounded-xl border border-[#E8EAF0] px-3 outline-none focus:border-[#F5C842]" /></td>
                      <td className="px-3 py-3">
                        <FmzSelect value={participant.role} onChange={(event) => updateParticipant(participant.id, 'role', event.target.value as FmzTokenomicsParticipantRole)} wrapperClassName="h-10 w-full rounded-xl border border-[#E8EAF0] px-3 focus-within:border-[#F5C842]">
                          {Object.entries(roleLabels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                        </FmzSelect>
                      </td>
                      <td className="px-3 py-3"><input type="number" step="0.0001" value={participant.ownership_percent} onChange={(event) => updateParticipant(participant.id, 'ownership_percent', normalizeNumber(event.target.value))} className="min-h-10 w-full rounded-xl border border-[#E8EAF0] px-3 outline-none focus:border-[#F5C842]" /></td>
                      <td className="px-3 py-3"><input type="number" step="0.01" value={participant.tokens_purchased} onChange={(event) => updateParticipant(participant.id, 'tokens_purchased', normalizeNumber(event.target.value))} className="min-h-10 w-full rounded-xl border border-[#E8EAF0] px-3 outline-none focus:border-[#F5C842]" /></td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => removeParticipant(participant.id)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 px-2.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100">
                          <Trash2 className="h-4 w-4" /> Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-1">
              <button type="button" onClick={handleCalculate} disabled={isCalculating} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0D1321] px-5 text-sm font-extrabold uppercase tracking-[0.08em] text-white transition hover:bg-[#162030] disabled:cursor-not-allowed disabled:opacity-60">
                {isCalculating ? 'Calculando...' : 'Calcular distribuição'}
              </button>
            </div>

            {errorMessage && (
              <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {errorMessage}
              </div>
            )}
          </section>
        </div>
      </section>

      {result && (
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <ResultMetric label="Aluguel a pagar" value={formatCurrency(result.rent_amount_to_pay)} />
            <ResultMetric label="Desconto da inquilina" value={formatCurrency(result.tenant_discount_amount)} />
            <ResultMetric label="Repasse líquido total" value={formatCurrency(result.total_recipients_net_amount)} />
            <ResultMetric label="Soma da posse" value={formatPercent(result.total_ownership_percent)} />
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm font-semibold text-yellow-900">
              {result.warnings.map((warning) => <div key={warning}>{warning}</div>)}
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-[#E8EAF0] bg-white shadow-sm">
            <div className="border-b border-[#E8EAF0] p-5">
              <h2 className="text-lg font-extrabold text-[#0D1321]">Resultado por participante</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left text-sm">
                <thead className="bg-[#F7F8FA] text-xs uppercase tracking-[0.08em] text-[#9AA3B0]">
                  <tr>
                    <th className="w-[23%] px-3 py-3">Nome</th>
                    <th className="w-[18%] px-3 py-3">Tipo</th>
                    <th className="w-[17%] px-3 py-3">% posse</th>
                    <th className="px-4 py-3">Repasse bruto</th>
                    <th className="px-4 py-3">Taxa adm aluguel</th>
                    <th className="px-4 py-3">Taxa adm token</th>
                    <th className="px-4 py-3">Desconto inquilina</th>
                    <th className="px-4 py-3">Valor líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {result.participants.map((participant, index) => (
                    <tr key={`${participant.name}-${participant.role}-${index}`} className="border-t border-[#E8EAF0]">
                      <td className="px-4 py-3 font-bold text-[#0D1321]">{participant.name}</td>
                      <td className="px-4 py-3 text-[#5A6478]">{roleLabels[participant.role as FmzTokenomicsParticipantRole] ?? participant.role}</td>
                      <td className="px-4 py-3">{formatPercent(participant.ownership_percent)}</td>
                      <td className="px-4 py-3">{formatCurrency(participant.gross_rent_share)}</td>
                      <td className="px-4 py-3">{formatCurrency(participant.admin_fee_share)}</td>
                      <td className="px-4 py-3">{formatCurrency(participant.token_admin_fee_share)}</td>
                      <td className="px-4 py-3 text-[#1A8C5B]">{formatCurrency(participant.tenant_discount_amount)}</td>
                      <td className="px-4 py-3 font-extrabold text-[#0D1321]">{formatCurrency(participant.net_amount_to_receive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E8EAF0] bg-white p-5 shadow-sm">
            <div className="mb-2">
              <h2 className="text-lg font-extrabold text-[#0D1321]">Resumo financeiro</h2>
              <p className="mt-1 text-sm text-[#5A6478]">Conferência dos principais valores retornados pelo backend.</p>
            </div>
            <dl className="grid gap-x-8 md:grid-cols-2">
              <FinancialSummaryItem label="Mês de referência" value={result.reference_month} />
              <FinancialSummaryItem label="Valor do imóvel" value={formatCurrency(result.property_value)} />
              <FinancialSummaryItem label="Valor unitário do token" value={formatCurrency(result.token_unit_value)} />
              <FinancialSummaryItem label="Total de tokens informados" value={String(result.total_tokens)} />
              <FinancialSummaryItem label="Aluguel bruto" value={formatCurrency(result.rent_gross_amount)} />
              <FinancialSummaryItem label="Posse total da inquilina" value={formatPercent(result.tenant_total_ownership_percent)} />
              <FinancialSummaryItem label="Aluguel após desconto da inquilina" value={formatCurrency(result.rent_amount_after_tenant_discount)} />
              <FinancialSummaryItem label="Encargos adicionais" value={formatCurrency(result.charges_amount)} />
              <FinancialSummaryItem label="Descontos adicionais" value={formatCurrency(result.extra_discounts_amount)} />
              <FinancialSummaryItem label="Multa e juros" value={formatCurrency(result.fine_and_interest_amount)} />
              <FinancialSummaryItem label="Taxa adm aluguel" value={formatCurrency(result.admin_fee_amount)} />
              <FinancialSummaryItem label="Taxa adm token" value={formatCurrency(result.token_admin_fee_amount)} />
              <FinancialSummaryItem label="Base distribuível após taxas" value={formatCurrency(result.distributable_amount_after_admin_fees)} />
              <FinancialSummaryItem label="Validação de posse" value={result.ownership_validation_status} />
            </dl>
          </div>
        </section>
      )}
    </FmzConnectedPageShell>
  );
}
