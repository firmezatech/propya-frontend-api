'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, Circle, Download,
  House, Plus, Search, Star, TrendingUp, Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell, FmzWalletSkeleton } from '../../../../components/layout';
import { getCurrentTenantDashboard, getUserWallet } from '../../services';
import type { FmzTenantDashboard, FmzUserWallet } from '../../domain';
import styles from './FmzWalletPage.module.css';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const pctFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const numFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const formatMoney = (v?: number | null) => moneyFmt.format(Number(v ?? 0));
const formatPct = (v?: number | null) => `${pctFmt.format(Number(v ?? 0))}%`;
const formatNum = (v?: number | null) => numFmt.format(Number(v ?? 0));

const formatShortDate = (v?: string | null): string => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : dateFmt.format(d);
};

const SPARKLINE_POINTS = 'M0,58 L40,56 L80,54 L120,50 L160,52 L200,46 L240,40 L280,38 L320,34 L360,32 L400,26 L440,24 L480,18 L520,14 L560,10 L600,6';
const SPARKLINE_AREA = `${SPARKLINE_POINTS} L600,64 L0,64 Z`;

type TxFilter = 'all' | 'buy' | 'bonus' | 'reval';

type WalletTransaction = {
  id: string;
  type: 'buy' | 'bonus' | 'reval';
  title: string;
  tag?: string;
  date: string;
  txId?: string;
  quantityLabel: string;
  amountLabel: string;
  monthGroup: string;
};

const TX_FILTER_CONFIG: { key: TxFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'buy', label: 'Compras' },
  { key: 'bonus', label: 'Recompensas' },
  { key: 'reval', label: 'Reavaliações' },
];

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function buildMonthGroup(reference: string): string {
  const d = new Date(reference);
  if (!Number.isNaN(d.getTime())) {
    return `${MONTH_NAMES[d.getMonth()]} · ${d.getFullYear()}`;
  }
  return reference;
}

function buildTransactionsFromMovements(movements: FmzUserWallet['movements']): WalletTransaction[] {
  return movements.map((m, index) => ({
    id: m.referenceId ?? m.occurredAt ?? `movement-${index}`,
    type: m.type === 'rent' ? ('bonus' as const) : ('buy' as const),
    title: m.description ?? (m.type === 'rent' ? 'Rendimento de aluguel' : 'Compra de tokens'),
    tag: m.typeLabel?.toUpperCase() ?? undefined,
    date: formatShortDate(m.date),
    txId: m.referenceId?.slice(0, 20) ?? undefined,
    quantityLabel: m.tokens != null ? formatNum(m.tokens) : '—',
    amountLabel: formatMoney(m.amount),
    monthGroup: m.date ? buildMonthGroup(m.date) : '—',
  }));
}

const TX_ICO_CLASS: Record<WalletTransaction['type'], string> = {
  buy: styles.txIcoBuy,
  bonus: styles.txIcoBonus,
  reval: styles.txIcoReval,
};

function TxTypeIcon({ type }: { type: WalletTransaction['type'] }) {
  if (type === 'bonus') return <Star size={16} />;
  if (type === 'reval') return <TrendingUp size={16} />;
  return <Plus size={16} />;
}

function WalletTransactionSection({ transactions }: { transactions: WalletTransaction[] }) {
  const [filter, setFilter] = useState<TxFilter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const counts: Record<TxFilter, number> = { all: transactions.length, buy: 0, bonus: 0, reval: 0 };
    for (const tx of transactions) counts[tx.type] = (counts[tx.type] ?? 0) + 1;
    return counts;
  }, [transactions]);

  const filtered = useMemo(() => {
    let items = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) => t.title.toLowerCase().includes(q) || t.amountLabel.includes(q) || (t.txId ?? '').toLowerCase().includes(q),
      );
    }
    return items;
  }, [transactions, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, WalletTransaction[]>();
    for (const tx of filtered) {
      const g = tx.monthGroup;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(tx);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <>
      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelTitle}>Histórico de transações</span>
      </div>

      <section className={styles.txCard}>
        <div className={styles.txToolbar}>
          <div className={styles.txFilters} role="tablist">
            {TX_FILTER_CONFIG.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={`${styles.txFilter} ${filter === key ? styles.txFilterActive : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className={styles.txCount}>{counts[key]}</span>
              </button>
            ))}
          </div>
          <div className={styles.txSearch}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar transação…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.txSearchInput}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.txEmpty}>
            <p className={styles.txEmptyTitle}>Nenhuma transação encontrada</p>
            <p className={styles.txEmptyDesc}>
              {transactions.length === 0
                ? 'Suas compras de tokens aparecerão aqui após a primeira aquisição.'
                : 'Tente ajustar os filtros ou o termo de busca.'}
            </p>
          </div>
        ) : (
          <div className={styles.txList}>
            {grouped.map(([group, txs]) => (
              <div key={group}>
                <div className={styles.txGroupHead}>{group}</div>
                {txs.map((tx: WalletTransaction) => (
                  <div key={tx.id} className={styles.txRow}>
                    <div className={`${styles.txIco} ${TX_ICO_CLASS[tx.type]}`}>
                      <TxTypeIcon type={tx.type} />
                    </div>
                    <div className={styles.txBody}>
                      <div className={styles.txTitle}>
                        {tx.title}
                        {tx.tag && <span className={styles.txTag}>{tx.tag}</span>}
                      </div>
                      <div className={styles.txSub}>
                        <span>{tx.date}</span>
                        {tx.txId && <><span className={styles.txSep}>·</span><span className={styles.txMono}>{tx.txId}</span></>}
                      </div>
                    </div>
                    <div className={styles.txQty}>
                      {tx.quantityLabel !== '—' && <span className={styles.deltaPlus}>{tx.quantityLabel}</span>}
                      {tx.quantityLabel === '—' && <span className={styles.txMuted}>—</span>}
                    </div>
                    <div className={styles.txAmount}>{tx.amountLabel}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function WalletHeroCard({ dashboard }: { dashboard: FmzTenantDashboard }) {
  const ownership = dashboard.ownership;
  const tokenBalance = ownership?.tokenBalance ?? 0;
  const ownedValue = ownership?.currentOwnedValue ?? 0;
  const balanceFormatted = formatMoney(ownedValue).replace(/R\$ /g, '');

  return (
    <div className={styles.walletCard}>
      <div className={styles.walletHead}>
        <span className={styles.walletEyebrow}>
          <Wallet size={11} />
          Saldo da carteira
        </span>
      </div>

      <div>
        <div className={styles.walletBalance}>
          <span className={styles.walletCurrency}>R$</span>
          {balanceFormatted}
        </div>
        <div className={styles.walletMeta}>
          <span className={styles.walletChip}>
            <Circle size={10} fill="currentColor" />
            {formatNum(tokenBalance)} tokens
          </span>
          {ownership?.currentPercentage != null && (
            <span className={styles.walletGain}>
              <ArrowUp size={12} />
              {formatPct(ownership.currentPercentage)} de posse
            </span>
          )}
        </div>
      </div>

      <div className={styles.walletChart}>
        <svg viewBox="0 0 600 64" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8B620" stopOpacity=".35" />
              <stop offset="100%" stopColor="#E8B620" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={SPARKLINE_AREA} fill="url(#wfill)" />
          <path d={SPARKLINE_POINTS} fill="none" stroke="#E8B620" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="600" cy="6" r="3" fill="#E8B620" />
          <circle cx="600" cy="6" r="6" fill="#E8B620" opacity=".25" />
        </svg>
        <div className={styles.chartAxis}>
          <span>fev/24</span>
          <span>ago/24</span>
          <span>fev/25</span>
          <span>ago/25</span>
          <span>mai/26</span>
        </div>
      </div>
    </div>
  );
}

function AssetDistributionCard({ dashboard }: { dashboard: FmzTenantDashboard }) {
  const ownership = dashboard.ownership;
  const property = dashboard.property;

  return (
    <div className={styles.distCard}>
      <div className={styles.distHead}>
        <span className={styles.distLabel}>Seus ativos</span>
        <span className={styles.distCount}>{property ? '1 imóvel' : '0 imóveis'}</span>
      </div>

      {property ? (
        <div className={styles.assetRow}>
          <div className={styles.assetThumb}><House size={20} /></div>
          <div className={styles.assetBody}>
            <div className={styles.assetName}>{property.name ?? property.code ?? 'Imóvel'}</div>
            <div className={styles.assetSub}>
              {property.code && <><span>{property.code}</span><span className={styles.assetSep}>·</span></>}
              <span>{formatNum(ownership?.tokenBalance)} / {formatNum(ownership?.totalSupply)} tokens</span>
              <span className={styles.assetSep}>·</span>
              <span>{formatPct(ownership?.currentPercentage)} de posse</span>
            </div>
          </div>
          <div className={styles.assetVal}>
            <div className={styles.assetValAmt}>{formatMoney(ownership?.currentOwnedValue)}</div>
            {ownership?.currentPercentage != null && (
              <div className={styles.assetValPct}>
                <ArrowUp />{formatPct(ownership.currentPercentage)}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.distEmpty}>Nenhum imóvel vinculado.</p>
      )}

      {property && (
        <div className={styles.assetPerf}>
          <div className={styles.perfCol}>
            <span className={styles.perfKey}>Compra mensal</span>
            <span className={styles.perfVal}>{formatMoney(dashboard.contract?.baseMonthlyRent)}</span>
          </div>
          <div className={styles.perfCol}>
            <span className={styles.perfKey}>Próxima compra</span>
            <span className={styles.perfVal}>{dashboard.contract?.paymentDay ? `Dia ${dashboard.contract.paymentDay}` : '—'}</span>
          </div>
          <div className={styles.perfCol}>
            <span className={styles.perfKey}>Aluguel economizado</span>
            <span className={`${styles.perfVal} ${styles.perfValGreen}`}>
              {formatMoney(dashboard.rentInsight?.monthlySavingsAmount)}
              <span className={styles.perfUnit}>/mês</span>
            </span>
          </div>
        </div>
      )}

      <div className={styles.distFoot}>
        <span>Preço médio do token <strong>{formatMoney(ownership?.tokenUnitValue)}</strong></span>
        <Link href="/connected/coming-soon" className={styles.distFootLink}>
          Ver detalhes <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export function FmzWalletPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [dashboard, setDashboard] = useState<FmzTenantDashboard | null>(null);
  const [wallet, setWallet] = useState<FmzUserWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [data, walletData] = await Promise.all([
          getCurrentTenantDashboard(propertyId),
          getUserWallet(),
        ]);
        if (active) { setDashboard(data); setWallet(walletData); }
      } catch {
        if (active) setErrorMessage('Não foi possível carregar os dados da carteira.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [propertyId]);

  const ownership = dashboard?.ownership;
  const transactions = useMemo(() => buildTransactionsFromMovements(wallet?.movements ?? []), [wallet]);

  return (
    <FmzConnectedPageShell width="tenant">
      <div className={styles.page}>
      <Link href="/connected/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} />
        Voltar ao dashboard
      </Link>

      {isLoading ? (
        <FmzWalletSkeleton />
      ) : errorMessage ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Erro ao carregar</p>
          <p className={styles.emptyDesc}>{errorMessage}</p>
        </div>
      ) : (
        <>
          <div className={styles.pageHead}>
            <div className={styles.pageHeadLeft}>
              <h1 className={styles.pageTitle}>Carteira</h1>
            </div>
            <div className={styles.pageHeadRight}>
              <Link href="/connected/wallet/statement" className={styles.btn}>
                <Download size={15} /> Extrato
              </Link>
              {(() => {
                const tokenizationId = dashboard?.ownership?.propertyTokenizationId ?? null;
                const propId = dashboard?.property?.id != null ? String(dashboard.property.id) : null;
                const params = [
                  tokenizationId && `propertyTokenizationId=${encodeURIComponent(tokenizationId)}`,
                  propId && `propertyId=${encodeURIComponent(propId)}`,
                ].filter(Boolean).join('&');
                const buyHref = params
                  ? `/connected/tokens-to-purchase-pix?${params}`
                  : '/connected/tokens-to-purchase-pix';
                return (
                  <Link href={buyHref} className={`${styles.btn} ${styles.btnPrimary}`}>
                    <Plus size={15} /> Comprar tokens
                  </Link>
                );
              })()}
            </div>
          </div>

          {dashboard && (
            <section className={styles.hero}>
              <WalletHeroCard dashboard={dashboard} />
              <AssetDistributionCard dashboard={dashboard} />
            </section>
          )}

          <section className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricKey}>
                <Circle size={13} />
                Tokens em carteira
              </div>
              <div className={styles.metricValue}>
                {formatNum(ownership?.tokenBalance)}
                {ownership?.totalSupply != null && (
                  <span className={styles.metricSmall}>/ {formatNum(ownership.totalSupply)}</span>
                )}
              </div>
              <div className={styles.metricSub}>
                <span className={styles.tagGold}>{formatPct(ownership?.currentPercentage)} de posse</span>
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricKey}>
                <TrendingUp size={13} />
                Preço por token
              </div>
              <div className={styles.metricValue}>{formatMoney(ownership?.tokenUnitValue)}</div>
              <div className={styles.metricSub}>
                <span className={styles.tagUp}>
                  <ArrowUp size={9} />valor de mercado
                </span>
              </div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricKey}>
                <Wallet size={13} />
                Próxima recompensa
              </div>
              <div className={styles.metricValue}>
                {formatPct(dashboard?.nextGoal?.percentage ?? 10)}
                <span className={styles.metricSmall}> de posse</span>
              </div>
              <div className={styles.metricSub}>
                Faltam <strong style={{ color: 'var(--fmz-navy)' }}>{formatMoney(dashboard?.nextGoal?.amountNeeded)}</strong>
              </div>
            </div>
          </section>

          <WalletTransactionSection transactions={transactions} />
        </>
      )}
      </div>
    </FmzConnectedPageShell>
  );
}
