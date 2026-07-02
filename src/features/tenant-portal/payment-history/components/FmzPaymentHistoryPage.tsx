'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ChevronDown, Coins, Download, FileText, Home, ReceiptText, Search, Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell, FmzPaymentHistorySkeleton } from '../../../../components/layout';
import { getCurrentTenantPaymentHistory } from '../../services';
import { authenticatedFirmezaFetch } from '../../../../services/firmeza-api-client';
import type { FmzTenantPaymentHistoryItem } from '../../domain';
import styles from './FmzPaymentHistoryPage.module.css';
import { formatDateBR } from '../../../../lib/fmz-date';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percentFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatMoney = (v?: number | null) => moneyFmt.format(Number(v ?? 0));
const formatSignedMoney = (v: number) => `${v < 0 ? '−' : '+'}${moneyFmt.format(Math.abs(v))}`;
const formatPercent = (v?: number | null) => `${percentFmt.format(Number(v ?? 0))}%`;
const formatDate = (v?: string | null): string => formatDateBR(v);
const formatTokenQty = (v?: number | null) => `${Math.round(Number(v ?? 0)).toLocaleString('pt-BR')} un`;

const MONTH_ABBR = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const MONTH_NAME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Uses UTC getters: `reference` is a date-only string (e.g. "2026-06-01") representing a
// calendar month, not an instant — reading it with local getters in a UTC-negative timezone
// (e.g. Brazil) shifts it back to the previous month.
function parseMonthBadge(reference: string): { abbr: string; name: string; year: string } {
  const d = new Date(reference);
  if (!Number.isNaN(d.getTime())) {
    const m = d.getUTCMonth();
    return { abbr: MONTH_ABBR[m], name: MONTH_NAME[m], year: String(d.getUTCFullYear()) };
  }
  return { abbr: reference.slice(0, 3).toUpperCase(), name: reference, year: '' };
}

type FilterKey = 'all' | 'pago' | 'aberto' | 'processando';
type PillKey = 'pago' | 'aberto' | 'vencido' | 'processando' | 'default';

// rent_charges.status is the authoritative enum: open | paid | late | cancelled | refunded.
const STATUS_FILTER: Record<string, FilterKey> = {
  paid: 'pago',
  open: 'aberto',
  late: 'aberto',
  cancelled: 'aberto',
  refunded: 'aberto',
};

const STATUS_PILL_KEY: Record<string, PillKey> = {
  paid: 'pago',
  open: 'aberto',
  late: 'vencido',
  cancelled: 'default',
  refunded: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago',
  open: 'Em aberto',
  late: 'Vencido',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const STATUS_CLASS: Record<PillKey, string> = {
  pago: styles.statusPago,
  aberto: styles.statusAberto,
  vencido: styles.statusVencido,
  processando: styles.statusProcessando,
  default: styles.statusDefault,
};

function resolveFilterKey(status?: string | null): FilterKey {
  const k = String(status ?? '').trim().toLowerCase();
  return STATUS_FILTER[k] ?? 'aberto';
}

function resolvePillKey(status?: string | null): PillKey {
  const k = String(status ?? '').trim().toLowerCase();
  return STATUS_PILL_KEY[k] ?? 'default';
}

function resolveStatusLabel(status?: string | null): string {
  const k = String(status ?? '').trim().toLowerCase();
  return STATUS_LABEL[k] ?? status ?? 'Não informado';
}

async function downloadReceiptPdf(tokenOrderId: string, filename: string): Promise<void> {
  const response = await authenticatedFirmezaFetch(`/tenant/orders/${tokenOrderId}/receipt.pdf`);
  if (!response.ok) throw new Error(`receipt download failed: ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function TokenReceiptButton({ tokenOrderId, reference, label = 'Recibo de tokens' }: {
  tokenOrderId: string;
  reference: string;
  label?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await downloadReceiptPdf(tokenOrderId, `recibo-tokens-${reference}.pdf`);
    } catch (err) {
      console.error('TokenReceiptButton: download failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button type="button" className={styles.btnSm} onClick={handleClick} disabled={isLoading}>
      <ReceiptText /> {isLoading ? 'Baixando…' : label}
    </button>
  );
}

function PaymentRowDetail({ item, isOpenCharge, isPaid }: { item: FmzTenantPaymentHistoryItem; isOpenCharge: boolean; isPaid: boolean }) {
  const hasTokenPurchase = Number(item.totalPurchasedTokens ?? 0) > 0;
  const hasCondominium = Number(item.condominiumFeeAmount ?? 0) > 0;

  return (
    <div className={styles.detailInner}>
      <div className={styles.detailLines}>
        <div className={styles.detailLine}>
          <span className={styles.detailL}>Valor do aluguel mensal</span>
          <span className={`${styles.detailV} ${styles.detailVGreen}`}>{formatMoney(item.discountedRentAmount)}</span>
        </div>
        <div className={styles.detailLine}>
          <span className={styles.detailL}>Taxa da plataforma</span>
          <span className={styles.detailV}>{formatMoney(item.rentalAdminFeeAmount)}</span>
        </div>
        <div className={styles.detailLine}>
          <span className={styles.detailL}>Condomínio</span>
          <span className={styles.detailV}>{hasCondominium ? formatMoney(item.condominiumFeeAmount) : '—'}</span>
        </div>
        <div className={styles.detailLine}>
          <span className={`${styles.detailL} ${hasTokenPurchase ? styles.detailLHighlight : ''}`}>
            <span className={`${styles.detailLi} ${hasTokenPurchase ? styles.detailLiHighlight : ''}`}><Coins /></span>
            Quantidade de tokens
            {hasTokenPurchase && <span className={styles.detailQty}>{formatTokenQty(item.totalPurchasedTokens)}</span>}
          </span>
          <span className={`${styles.detailV} ${hasTokenPurchase ? styles.detailVGold : ''}`}>
            {hasTokenPurchase ? formatMoney(item.tokenPurchaseAmount) : '—'}
          </span>
        </div>
        {hasTokenPurchase && (
          <div className={styles.detailLine}>
            <span className={styles.detailL}>Taxa de tokens</span>
            <span className={styles.detailV}>{formatMoney(item.tokenFeeAmount)}</span>
          </div>
        )}
      </div>
      <div className={styles.detailActions}>
        {isOpenCharge && item.downloadUrl && (
          <a href={item.downloadUrl} target="_blank" rel="noreferrer" className={styles.btnSm}>
            <FileText /> Ver boleto
          </a>
        )}
        {isPaid && (item.downloadUrl ? (
          <a href={item.downloadUrl} target="_blank" rel="noreferrer" className={styles.btnSm}>
            <Download /> Baixar comprovante
          </a>
        ) : (
          <button type="button" className={styles.btnSm} disabled>
            <Download /> Comprovante indisponível
          </button>
        ))}
        {hasTokenPurchase && item.tokenOrderId && (
          <TokenReceiptButton tokenOrderId={item.tokenOrderId} reference={item.reference} />
        )}
      </div>
    </div>
  );
}

function PaymentRow({ item }: { item: FmzTenantPaymentHistoryItem }) {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen((v) => !v);

  const { abbr, name, year } = parseMonthBadge(item.reference);
  const pillKey = resolvePillKey(item.status);
  const isOpenCharge = pillKey === 'aberto' || pillKey === 'vencido';
  const isPaid = pillKey === 'pago';
  const rowActionLabel = isOpenCharge ? 'Ver boleto' : 'Comprovante';

  return (
    <>
      <div
        className={`${styles.row} ${open ? styles.rowOpen : ''}`}
        onClick={toggleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleOpen()}
        aria-expanded={open}
      >
        <div className={styles.cell}>
          <div className={styles.month}>
            <span className={styles.badgeMon}>{abbr}</span>
            <span className={styles.mtext}>
              <span className={styles.mname}>{name}</span>
              <span className={styles.myear}>{year}</span>
            </span>
          </div>
        </div>
        <div className={`${styles.cell} ${styles.amount}`}>{formatMoney(item.amount)}</div>
        <div className={`${styles.cell} ${styles.dateCell}`}>
          <strong>{formatDate(item.dueDate)}</strong>
        </div>
        <div className={`${styles.cell} ${styles.dateCell}`}>
          {item.paidAt ? formatDate(item.paidAt) : <span className={styles.dash}>—</span>}
        </div>
        <div className={styles.cell}>
          <span className={`${styles.status} ${STATUS_CLASS[pillKey]}`}>
            <span className={styles.statusDot} />
            {resolveStatusLabel(item.status)}
          </span>
        </div>
        <div className={styles.rowAct}>
          {(isOpenCharge || isPaid) && item.downloadUrl && (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.iconAct}
              title={rowActionLabel}
              onClick={(e) => e.stopPropagation()}
            >
              <ReceiptText />
            </a>
          )}
          <button type="button" className={styles.iconAct} title="Detalhes" onClick={(e) => { e.stopPropagation(); toggleOpen(); }}>
            <ChevronDown className={`${styles.chevIcon} ${open ? styles.chevOpen : ''}`} />
          </button>
        </div>
      </div>

      <div className={`${styles.rowDetail} ${open ? styles.rowDetailOpen : ''}`}>
        <PaymentRowDetail item={item} isOpenCharge={isOpenCharge} isPaid={isPaid} />
      </div>
    </>
  );
}

const FILTER_LABELS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pago', label: 'Pagos' },
  { key: 'aberto', label: 'Em aberto' },
  { key: 'processando', label: 'Processando' },
];

type ViewMode = 'boletos' | 'aluguel' | 'tokens';

const VIEW_MODES: { key: ViewMode; label: string; icon: typeof Ticket }[] = [
  { key: 'boletos', label: 'Boletos', icon: Ticket },
  { key: 'aluguel', label: 'Aluguel', icon: Home },
  { key: 'tokens', label: 'Compra de tokens', icon: Coins },
];

function AluguelView({ history }: { history: FmzTenantPaymentHistoryItem[] }) {
  const rows = useMemo(() => [...history].sort((a, b) => a.reference.localeCompare(b.reference)), [history]);
  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({
      base: acc.base + Number(r.baseRentAmount ?? 0),
      net: acc.net + (Number(r.discountedRentAmount ?? 0) - Number(r.baseRentAmount ?? 0)),
      total: acc.total + Number(r.discountedRentAmount ?? 0),
    }),
    { base: 0, net: 0, total: 0 },
  ), [rows]);
  const savings = Math.abs(Math.min(totals.net, 0));

  return (
    <section className={styles.vsection}>
      <div className={styles.vsectionHead}>
        <h2 className={styles.vsectionTitle}>
          <span className={`${styles.vsIco} ${styles.vsIcoGreen}`}><Home /></span>
          Pagamentos de aluguel
        </h2>
        <span className={styles.vsSub}>{rows.length} meses · {formatMoney(savings)} economizados no aluguel</span>
      </div>
      <div className={styles.vtableWrap}>
        <table className={styles.vtable}>
          <thead>
            <tr><th>Competência</th><th>Aluguel base</th><th>Ajuste / desconto</th><th>Posse acum.</th><th>Total do aluguel</th></tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r) => {
              const { abbr, name, year } = parseMonthBadge(r.reference);
              const net = Number(r.discountedRentAmount ?? 0) - Number(r.baseRentAmount ?? 0);
              return (
                <tr key={r.id}>
                  <td>
                    <span className={styles.vtComp}>
                      <span className={styles.vtBadge}>{abbr}</span>
                      <span>{name} <span className={styles.vtYear}>{year}</span></span>
                    </span>
                  </td>
                  <td>{formatMoney(r.baseRentAmount)}</td>
                  <td className={net < 0 ? styles.vtNeg : undefined}>{formatSignedMoney(net)}</td>
                  <td>{formatPercent(r.ownershipPercentageAccumulated)}</td>
                  <td className={styles.vtStrong}>{formatMoney(r.discountedRentAmount)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className={styles.vtfoot}>
            <tr>
              <td>Total</td>
              <td>{formatMoney(totals.base)}</td>
              <td className={totals.net < 0 ? styles.vtNeg : undefined}>{formatSignedMoney(totals.net)}</td>
              <td />
              <td className={styles.vtStrong}>{formatMoney(totals.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

// 1 token = R$0.01 (TOKEN_UNIT_VALUE). Used as fallback when the backend hasn't yet
// returned the dedicated `tokenPurchaseAmount` column (old Railway deploy without our code change).
const TOKEN_UNIT_VALUE_BRL = 0.01;

function resolveTokenPurchaseAmountBrl(item: FmzTenantPaymentHistoryItem): number {
  if (item.tokenPurchaseAmount != null && item.tokenPurchaseAmount > 0) return item.tokenPurchaseAmount;
  return Number(item.totalPurchasedTokens ?? 0) * TOKEN_UNIT_VALUE_BRL;
}

function TokensView({ history }: { history: FmzTenantPaymentHistoryItem[] }) {
  const purchases = useMemo(
    () => [...history].filter((r) => Number(r.totalPurchasedTokens ?? 0) > 0).sort((a, b) => b.reference.localeCompare(a.reference)),
    [history],
  );
  const totalPaid = useMemo(() => purchases.reduce((s, r) => s + resolveTokenPurchaseAmountBrl(r), 0), [purchases]);
  const latest = history[0] ?? null;

  if (purchases.length === 0) {
    return (
      <section className={styles.vsection}>
        <div className={styles.vsectionHead}>
          <h2 className={styles.vsectionTitle}>
            <span className={`${styles.vsIco} ${styles.vsIcoGold}`}><Coins /></span>
            Compras de tokens
          </h2>
        </div>
        <div className={styles.empty} style={{ border: 'none' }}>
          <p className={styles.emptyTitle}>Nenhuma compra de tokens ainda</p>
          <p className={styles.emptyDesc}>Compras programadas via boleto mensal aparecerão aqui.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.vsection}>
      <div className={styles.vsectionHead}>
        <h2 className={styles.vsectionTitle}>
          <span className={`${styles.vsIco} ${styles.vsIcoGold}`}><Coins /></span>
          Compras de tokens
        </h2>
        <span className={styles.vsSub}>
          {purchases.length} compras · {formatTokenQty(latest?.tokensAccumulated)} acumulados · {formatPercent(latest?.ownershipPercentageAccumulated)} de posse
        </span>
      </div>
      <div className={styles.vtableWrap}>
        <table className={styles.vtable}>
          <thead>
            <tr><th>Competência</th><th>Valor pago</th><th>Total acumulado</th><th>Posse acum.</th><th /></tr>
          </thead>
          <tbody>
            {purchases.map((r) => {
              const { abbr, name, year } = parseMonthBadge(r.reference);
              return (
                <tr key={r.id}>
                  <td>
                    <span className={styles.vtComp}>
                      <span className={styles.vtBadge}>{abbr}</span>
                      <span>{name} <span className={styles.vtYear}>{year}</span></span>
                    </span>
                  </td>
                  <td className={styles.vtPos}>{formatMoney(resolveTokenPurchaseAmountBrl(r))}</td>
                  <td className={styles.vtStrong}>{formatTokenQty(r.tokensAccumulated)}</td>
                  <td>{formatPercent(r.ownershipPercentageAccumulated)}</td>
                  <td>
                    {r.tokenOrderId
                      ? <TokenReceiptButton tokenOrderId={r.tokenOrderId} reference={r.reference} label="Recibo" />
                      : <span className={styles.dash}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className={styles.vtfoot}>
            <tr>
              <td>Total</td>
              <td className={styles.vtPos}>{formatMoney(totalPaid)}</td>
              <td className={styles.vtStrong}>{formatTokenQty(latest?.tokensAccumulated)}</td>
              <td>{formatPercent(latest?.ownershipPercentageAccumulated)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function FmzPaymentHistoryPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [history, setHistory] = useState<FmzTenantPaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('boletos');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const hist = await getCurrentTenantPaymentHistory(propertyId);
        if (active) setHistory(hist);
      } catch (error) {
        console.error('FmzPaymentHistoryPage: failed to load payment history', error);
        if (active) setErrorMessage('Não foi possível carregar o histórico. Verifique se a sessão está ativa.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [propertyId]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((i) => {
      if (filter !== 'all' && resolveFilterKey(i.status) !== filter) return false;
      if (!q) return true;
      return (
        i.reference.toLowerCase().includes(q) ||
        formatMoney(i.amount).includes(q) ||
        (i.dueDate ?? '').includes(q)
      );
    });
  }, [history, filter, search]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: history.length, pago: 0, aberto: 0, processando: 0 };
    for (const item of history) {
      const k = resolveFilterKey(item.status);
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [history]);

  return (
    <FmzConnectedPageShell width="tenant">
      <div className={styles.page}>
      <Link href="/connected/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Voltar ao dashboard
      </Link>

      {isLoading ? (
        <FmzPaymentHistorySkeleton />
      ) : errorMessage ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Erro ao carregar</p>
          <p className={styles.emptyDesc}>{errorMessage}</p>
        </div>
      ) : (
        <>
          {/* Page head */}
          <div className={styles.pageHead}>
            <div>
              <p className={styles.eyebrow}>Financeiro</p>
              <h1 className={styles.pageTitle}>Histórico de pagamentos</h1>
              <p className={styles.pageSub}>
                <span>{history.length} boletos{history.length > 0 ? ` · desde ${formatDate(history[history.length - 1].dueDate)}` : ''}</span>
                {counts.pago === history.length && history.length > 0 && (
                  <span className={styles.pillOk}><span className={styles.dot} />Conta em dia</span>
                )}
              </p>
            </div>
          </div>

          {/* View mode toggle */}
          <div className={styles.modeseg} role="tablist">
            {VIEW_MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={viewMode === key}
                className={`${styles.modesegBtn} ${viewMode === key ? styles.modesegBtnActive : ''}`}
                onClick={() => setViewMode(key)}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>

          {viewMode === 'aluguel' && <AluguelView history={history} />}
          {viewMode === 'tokens' && <TokensView history={history} />}

          {viewMode === 'boletos' && (
            <>
              {/* Toolbar */}
              <div className={styles.toolbar}>
                <div className={styles.seg} role="tablist">
                  {FILTER_LABELS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={filter === key}
                      className={`${styles.segBtn} ${filter === key ? styles.segBtnActive : ''}`}
                      onClick={() => setFilter(key)}
                    >
                      {label}
                      <span className={styles.segCount}>{counts[key]}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.toolbarRight}>
                  <div className={styles.search}>
                    <Search />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Buscar competência ou valor…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Link href="/connected/coming-soon" className={styles.btnExport}>
                    <Download /> Exportar CSV
                  </Link>
                </div>
              </div>

              {/* List */}
              {filteredHistory.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>Nenhum resultado</p>
                  <p className={styles.emptyDesc}>Tente ajustar os filtros ou o termo de busca.</p>
                </div>
              ) : (
                <section className={styles.list}>
                  <div className={styles.listHead}>
                    <span>Competência</span>
                    <span>Total</span>
                    <span>Vencimento</span>
                    <span>Pagamento</span>
                    <span>Status</span>
                    <span />
                  </div>
                  {filteredHistory.map((item) => (
                    <PaymentRow key={item.id} item={item} />
                  ))}
                  <div className={styles.listFoot}>
                    <span>Mostrando {filteredHistory.length} de {history.length} boletos</span>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
      </div>
    </FmzConnectedPageShell>
  );
}
