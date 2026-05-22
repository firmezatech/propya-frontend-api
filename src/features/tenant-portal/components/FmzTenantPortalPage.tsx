'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Download, House, ReceiptText, WalletCards } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell } from '../../../components/layout';
import { getCurrentTenantDashboard, getCurrentTenantPaymentHistory, getCurrentTenantWallets } from '../services';
import type { FmzTenantDashboard, FmzTenantPaymentHistoryItem, FmzTenantWallet } from '../domain';

type FmzTenantPortalPageKind = 'invoice' | 'paymentHistory' | 'wallet' | 'tokens';

type FmzTenantPortalPageProps = {
  kind: FmzTenantPortalPageKind;
};

const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percentFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const tokenFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });

const formatMoney = (value?: number | null): string => moneyFormatter.format(Number(value ?? 0));
const formatPercent = (value?: number | null): string => `${percentFormatter.format(Number(value ?? 0))}%`;
const formatTokenAmount = (value?: number | null): string => tokenFormatter.format(Number(value ?? 0));

const formatDate = (value?: string | null): string => {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pago',
  received: 'Pago',
  confirmed: 'Confirmado',
  pending: 'Aguardando pagamento',
  created: 'Criado',
  registered: 'Registrado',
  overdue: 'Vencido',
  expired: 'Expirado',
  canceled: 'Cancelado',
  cancelled: 'Cancelado',
  not_generated: 'Não gerado',
};

const statusLabel = (status?: string | null): string => {
  const normalized = String(status ?? '').trim().toLowerCase();
  return STATUS_LABELS[normalized] ?? status ?? 'Não informado';
};

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-fmz-border-light bg-white p-8 text-center">
      <p className="text-xl font-bold text-fmz-navy">{title}</p>
      <p className="mt-2 text-sm leading-6 text-fmz-text-muted">{description}</p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof ReceiptText }) {
  return (
    <div className="rounded-2xl border border-fmz-border-light bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fmz-page text-fmz-navy"><Icon className="h-4 w-4" /></span>
      </div>
      <strong className="mt-4 block text-2xl text-fmz-navy">{value}</strong>
    </div>
  );
}

function TenantInvoiceView({ dashboard }: { dashboard: FmzTenantDashboard | null }) {
  const boleto = dashboard?.boleto;
  const summary = dashboard?.monthlySummary;

  if (!dashboard) {
    return <EmptyState title="Boleto não encontrado" description="A rota GET /tenant/dashboard não retornou dados de boleto para esta inquilina." />;
  }

  const canDownload = Boolean(boleto?.downloadUrl);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-fmz-border-light bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Boleto da competência</p>
            <h2 className="mt-2 text-3xl font-extrabold text-fmz-navy">{dashboard.competence?.label ?? dashboard.competence?.month ?? 'Atual'}</h2>
          </div>
          <span className="rounded-full border border-fmz-success-border bg-fmz-success-bg px-3 py-1.5 text-xs font-bold text-fmz-success">
            {statusLabel(boleto?.status ?? summary?.status)}
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MetricCard label="Total a pagar" value={formatMoney(summary?.totalDueAmount)} icon={ReceiptText} />
          <MetricCard label="Vencimento" value={formatDate(summary?.dueDate)} icon={ReceiptText} />
          <MetricCard label="Desconto" value={formatMoney(summary?.discountAmount)} icon={ReceiptText} />
        </div>

        <div className="mt-8 divide-y divide-fmz-border-light rounded-2xl border border-fmz-border-light">
          {(summary?.lines ?? []).map((line) => (
            <div key={line.key} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-fmz-text-muted">{line.label}</span>
              <strong className="text-fmz-navy">{formatMoney(line.amount)}</strong>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {canDownload ? (
            <a href={boleto?.downloadUrl ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-fmz-navy px-5 py-3 text-sm font-bold uppercase tracking-[0.03em] text-white no-underline transition hover:bg-[#162030]">
              <Download className="h-4 w-4" /> Baixar boleto
            </a>
          ) : (
            <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-fmz-border-light px-5 py-3 text-sm font-bold uppercase tracking-[0.03em] text-fmz-text-hint">
              <Download className="h-4 w-4" /> Boleto indisponível
            </button>
          )}
        </div>
      </section>

      <aside className="rounded-2xl border border-fmz-border-light bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-fmz-navy">Dados bancários</h3>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Provedor</dt>
            <dd className="mt-1 text-fmz-navy">{boleto?.paymentProvider ?? 'Não informado'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Referência externa</dt>
            <dd className="mt-1 break-all text-fmz-navy">{boleto?.externalReference ?? 'Não informado'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Linha digitável</dt>
            <dd className="mt-1 break-all text-fmz-navy">{boleto?.digitableLine ?? 'Não informado'}</dd>
          </div>
          {boleto?.digitableLine ? (
            <button type="button" onClick={() => navigator.clipboard?.writeText(boleto.digitableLine ?? '')} className="inline-flex items-center gap-2 rounded-xl border border-fmz-border-light bg-white px-4 py-2 text-sm font-bold text-fmz-navy transition hover:bg-fmz-page">
              <Copy className="h-4 w-4" /> Copiar linha digitável
            </button>
          ) : null}
        </dl>
      </aside>
    </div>
  );
}

function TenantPaymentHistoryView({ history }: { history: FmzTenantPaymentHistoryItem[] }) {
  if (history.length === 0) {
    return <EmptyState title="Histórico vazio" description="A rota GET /tenant/dashboard ainda não retornou cobranças vinculadas a esta inquilina." />;
  }

  return (
    <section className="rounded-2xl border border-fmz-border-light bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Histórico</p>
          <h2 className="mt-1 text-2xl font-extrabold text-fmz-navy">Pagamentos da inquilina</h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-fmz-text-hint">
              <th className="border-b border-fmz-border-light px-3 py-3">Referência</th>
              <th className="border-b border-fmz-border-light px-3 py-3">Vencimento</th>
              <th className="border-b border-fmz-border-light px-3 py-3">Pagamento</th>
              <th className="border-b border-fmz-border-light px-3 py-3">Status</th>
              <th className="border-b border-fmz-border-light px-3 py-3 text-right">Valor</th>
              <th className="border-b border-fmz-border-light px-3 py-3">Boleto</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="text-fmz-text-muted">
                <td className="border-b border-fmz-border-light px-3 py-4 font-medium text-fmz-navy">{item.reference}</td>
                <td className="border-b border-fmz-border-light px-3 py-4">{formatDate(item.dueDate)}</td>
                <td className="border-b border-fmz-border-light px-3 py-4">{formatDate(item.paidAt)}</td>
                <td className="border-b border-fmz-border-light px-3 py-4">{statusLabel(item.status)}</td>
                <td className="border-b border-fmz-border-light px-3 py-4 text-right font-bold text-fmz-navy">{formatMoney(item.amount)}</td>
                <td className="border-b border-fmz-border-light px-3 py-4">
                  {item.downloadUrl ? <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="font-bold text-fmz-navy underline">Baixar</a> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TenantWalletView({ dashboard, wallets }: { dashboard: FmzTenantDashboard | null; wallets: FmzTenantWallet[] }) {
  const ownership = dashboard?.ownership;
  const tokenBalance = ownership?.tokenBalance ?? 0;
  const pendingTokenBalance = ownership?.pendingTokenBalance ?? 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-fmz-border-light bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Minha carteira</p>
            <h2 className="mt-1 text-2xl font-extrabold text-fmz-navy">Wallet vinculada à inquilina</h2>
          </div>
          <WalletCards className="h-7 w-7 text-fmz-navy" />
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <MetricCard label="Tokens disponíveis" value={formatTokenAmount(tokenBalance)} icon={WalletCards} />
          <MetricCard label="Tokens pendentes" value={formatTokenAmount(pendingTokenBalance)} icon={ReceiptText} />
          <MetricCard label="Participação atual" value={formatPercent(ownership?.currentPercentage)} icon={House} />
        </div>

        {wallets.length === 0 ? (
          <EmptyState title="Carteira não encontrada" description="A rota GET /listWallets não retornou uma wallet vinculada ao usuário autenticado." />
        ) : (
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <article key={wallet.id ?? wallet.walletAddress ?? wallet.publicKey} className="rounded-2xl border border-fmz-border-light bg-fmz-page p-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">ID da wallet</p>
                    <p className="mt-2 break-all text-sm font-semibold text-fmz-navy">{wallet.id ?? 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-fmz-text-hint">Endereço</p>
                    <p className="mt-2 break-all text-sm text-fmz-navy">{wallet.walletAddress ?? wallet.publicKey ?? 'Não informado'}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div><span className="text-xs text-fmz-text-hint">Tokens</span><strong className="block text-sm text-fmz-navy">{formatTokenAmount(tokenBalance)}</strong></div>
                  <div><span className="text-xs text-fmz-text-hint">Rede</span><strong className="block text-sm text-fmz-navy">{wallet.chainId ?? '—'}</strong></div>
                  <div><span className="text-xs text-fmz-text-hint">Tipo</span><strong className="block text-sm text-fmz-navy">{wallet.walletType ?? '—'}</strong></div>
                  <div><span className="text-xs text-fmz-text-hint">Status</span><strong className="block text-sm text-fmz-navy">{wallet.status ?? wallet.verificationStatus ?? '—'}</strong></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-fmz-border-light bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-fmz-navy">Resumo de tokens</h3>
        <div className="mt-5 grid gap-3">
          <MetricCard label="Saldo de tokens" value={formatTokenAmount(tokenBalance)} icon={WalletCards} />
          <MetricCard label="Tokens pendentes" value={formatTokenAmount(pendingTokenBalance)} icon={ReceiptText} />
          <MetricCard label="Participação atual" value={formatPercent(ownership?.currentPercentage)} icon={House} />
          <MetricCard label="Valor já adquirido" value={formatMoney(ownership?.currentOwnedValue)} icon={ReceiptText} />
        </div>
      </aside>
    </div>
  );
}

export function FmzTenantPortalPage({ kind }: FmzTenantPortalPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [dashboard, setDashboard] = useState<FmzTenantDashboard | null>(null);
  const [wallets, setWallets] = useState<FmzTenantWallet[]>([]);
  const [history, setHistory] = useState<FmzTenantPaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTenantPageData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextDashboard, nextHistory, nextWallets] = await Promise.all([
          getCurrentTenantDashboard(propertyId),
          kind === 'paymentHistory' ? getCurrentTenantPaymentHistory(propertyId) : Promise.resolve([]),
          kind === 'wallet' || kind === 'tokens' ? getCurrentTenantWallets() : Promise.resolve([]),
        ]);

        if (!isMounted) return;
        setDashboard(nextDashboard);
        setHistory(nextHistory);
        setWallets(nextWallets);
      } catch {
        if (!isMounted) return;
        setErrorMessage('Não foi possível carregar os dados desta página. Verifique se a sessão está ativa e se a role tenant possui permissão para a rota do backend.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadTenantPageData();

    return () => {
      isMounted = false;
    };
  }, [kind, propertyId]);

  const titleByKind: Record<FmzTenantPortalPageKind, string> = {
    invoice: 'Boletos',
    paymentHistory: 'Histórico de pagamentos',
    wallet: 'Minha carteira',
    tokens: 'Meus tokens',
  };

  return (
    <FmzConnectedPageShell width="tenant">
      <button type="button" onClick={() => router.back()} className="mb-7 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-fmz-text-hint transition hover:text-fmz-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar
      </button>

      <div className="mb-8">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-fmz-text-hint">Área da inquilina</p>
        <h1 className="text-3xl font-extrabold tracking-[-0.025em] text-fmz-navy">{titleByKind[kind]}</h1>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-fmz-border-light bg-white p-8 text-center text-sm text-fmz-text-muted">
          <span className="mx-auto mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-fmz-border-light border-t-fmz-navy" />
          Carregando dados da rota do backend...
        </div>
      ) : errorMessage ? (
        <EmptyState title="Erro ao carregar" description={errorMessage} />
      ) : kind === 'invoice' ? (
        <TenantInvoiceView dashboard={dashboard} />
      ) : kind === 'paymentHistory' ? (
        <TenantPaymentHistoryView history={history} />
      ) : (
        <TenantWalletView dashboard={dashboard} wallets={wallets} />
      )}
    </FmzConnectedPageShell>
  );
}
