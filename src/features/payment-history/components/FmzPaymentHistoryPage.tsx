'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, CreditCard, Download, FileText, ReceiptText, Search, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell } from '../../../components/layout';
import { getCurrentTenantDashboard, getCurrentTenantPaymentHistory } from '../../tenant-portal/services';
import type { FmzTenantDashboard, FmzTenantPaymentHistoryItem } from '../../tenant-portal/domain';
import styles from './FmzPaymentHistoryPage.module.css';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

const formatMoney = (v?: number | null) => moneyFmt.format(Number(v ?? 0));
const formatDate = (v?: string | null): string => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : dateFmt.format(d);
};

const MONTH_ABBR = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const MONTH_NAME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function parseMonthBadge(reference: string): { abbr: string; name: string; year: string } {
  const d = new Date(reference);
  if (!Number.isNaN(d.getTime())) {
    const m = d.getMonth();
    return { abbr: MONTH_ABBR[m], name: MONTH_NAME[m], year: String(d.getFullYear()) };
  }
  return { abbr: reference.slice(0, 3).toUpperCase(), name: reference, year: '' };
}

type FilterKey = 'all' | 'pago' | 'aberto' | 'processando';

const STATUS_FILTER: Record<string, FilterKey> = {
  paid: 'pago', received: 'pago', confirmed: 'pago',
  pending: 'aberto', created: 'aberto', registered: 'aberto',
  overdue: 'aberto', expired: 'aberto',
  processing: 'processando',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago', received: 'Pago', confirmed: 'Confirmado',
  pending: 'Em aberto', created: 'Criado', registered: 'Registrado',
  overdue: 'Vencido', expired: 'Expirado', canceled: 'Cancelado',
  cancelled: 'Cancelado', not_generated: 'Não gerado', processing: 'Processando',
};

const STATUS_CLASS: Record<FilterKey, string> = {
  all: styles.statusDefault,
  pago: styles.statusPago,
  aberto: styles.statusAberto,
  processando: styles.statusProcessando,
};

function resolveFilterKey(status?: string | null): FilterKey {
  const k = String(status ?? '').trim().toLowerCase();
  return STATUS_FILTER[k] ?? 'aberto';
}

function resolveStatusLabel(status?: string | null): string {
  const k = String(status ?? '').trim().toLowerCase();
  return STATUS_LABEL[k] ?? status ?? 'Não informado';
}

function PaymentRow({ item }: { item: FmzTenantPaymentHistoryItem }) {
  const [open, setOpen] = useState(false);
  const { abbr, name, year } = parseMonthBadge(item.reference);
  const filter = resolveFilterKey(item.status);
  const isPaid = filter === 'pago';
  const statusClass = STATUS_CLASS[filter] ?? styles.statusDefault;

  return (
    <>
      <div
        className={`${styles.row} ${open ? styles.rowOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className={styles.cell}>
          <div className={styles.month}>
            <span className={`${styles.badgeMon} ${isPaid ? '' : styles.badgeMonMuted}`}>{abbr}</span>
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
          <span className={`${styles.status} ${statusClass}`}>
            <span className={styles.statusDot} />
            {resolveStatusLabel(item.status)}
          </span>
        </div>
        <div className={styles.rowAct}>
          {item.downloadUrl && (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.iconAct}
              title="Ver boleto"
              onClick={(e) => e.stopPropagation()}
            >
              <ReceiptText />
            </a>
          )}
          <button type="button" className={styles.iconAct} title="Detalhes" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
            <ChevronDown className={`${styles.chevIcon} ${open ? styles.chevOpen : ''}`} />
          </button>
        </div>
      </div>

      <div className={`${styles.rowDetail} ${open ? styles.rowDetailOpen : ''}`}>
        <div className={styles.detailInner}>
          <div className={styles.detailLines}>
            <div className={styles.detailLine}>
              <span className={styles.detailL}>
                <span className={styles.detailLi}><ReceiptText /></span>
                Valor total
              </span>
              <span className={styles.detailV}>{formatMoney(item.amount)}</span>
            </div>
            <div className={styles.detailLine}>
              <span className={styles.detailL}>
                <span className={styles.detailLi}><CreditCard /></span>
                Vencimento
              </span>
              <span className={styles.detailV}>{formatDate(item.dueDate)}</span>
            </div>
            {item.paidAt && (
              <div className={styles.detailLine}>
                <span className={styles.detailL}>
                  <span className={styles.detailLi}><FileText /></span>
                  Pago em
                </span>
                <span className={`${styles.detailV} ${styles.detailVGreen}`}>{formatDate(item.paidAt)}</span>
              </div>
            )}
            {item.paymentMethod && (
              <div className={styles.detailLine}>
                <span className={styles.detailL}>
                  <span className={styles.detailLi}><CreditCard /></span>
                  Método
                </span>
                <span className={styles.detailV}>{item.paymentMethod}</span>
              </div>
            )}
          </div>
          <div className={styles.detailActions}>
            {item.downloadUrl ? (
              <a href={item.downloadUrl} target="_blank" rel="noreferrer" className={styles.btnSm}>
                <Download /> Baixar PDF
              </a>
            ) : (
              <button type="button" className={styles.btnSm} disabled>
                <Download /> PDF indisponível
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({
  label, value, sub, featured, icon: Icon,
}: { label: string; value: string; sub: string; featured?: boolean; icon: typeof ReceiptText }) {
  return (
    <div className={`${styles.metric} ${featured ? styles.metricFeatured : ''}`}>
      <div className={styles.metricKey}>
        <span className={styles.metricIco}><Icon /></span>
        {label}
      </div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricSub}>{sub}</div>
    </div>
  );
}

const FILTER_LABELS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pago', label: 'Pagos' },
  { key: 'aberto', label: 'Em aberto' },
  { key: 'processando', label: 'Processando' },
];

export function FmzPaymentHistoryPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [dashboard, setDashboard] = useState<FmzTenantDashboard | null>(null);
  const [history, setHistory] = useState<FmzTenantPaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [data, hist] = await Promise.all([
          getCurrentTenantDashboard(propertyId),
          getCurrentTenantPaymentHistory(propertyId),
        ]);
        if (active) { setDashboard(data); setHistory(hist); }
      } catch {
        if (active) setErrorMessage('Não foi possível carregar o histórico. Verifique se a sessão está ativa.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [propertyId]);

  const filteredHistory = useMemo(() => {
    let items = history;
    if (filter !== 'all') {
      items = items.filter((i) => resolveFilterKey(i.status) === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((i) =>
        i.reference.toLowerCase().includes(q) ||
        formatMoney(i.amount).includes(q) ||
        (i.dueDate ?? '').includes(q)
      );
    }
    return items;
  }, [history, filter, search]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: history.length, pago: 0, aberto: 0, processando: 0 };
    for (const item of history) {
      const k = resolveFilterKey(item.status);
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [history]);

  const totalPaid = useMemo(
    () => history.filter((i) => resolveFilterKey(i.status) === 'pago').reduce((s, i) => s + i.amount, 0),
    [history]
  );
  const savings = dashboard?.rentInsight?.annualSavingsAmount;

  return (
    <FmzConnectedPageShell width="tenant">
      <div className={styles.page}>
      <Link href="/connected/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Voltar ao dashboard
      </Link>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <span className={styles.spinner} />
          <p className={styles.emptyDesc}>Carregando histórico...</p>
        </div>
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
                <span>{history.length} boletos</span>
                {counts.pago === history.length && history.length > 0 && (
                  <span className={styles.pillOk}><span className={styles.dot} />Conta em dia</span>
                )}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <section className={styles.metrics}>
            <MetricCard
              label="Total pago"
              value={formatMoney(totalPaid)}
              sub={`${counts.pago} boletos pagos`}
              featured
              icon={CreditCard}
            />
            <MetricCard
              label="Aluguel economizado"
              value={formatMoney(savings)}
              sub="acumulado por tokens"
              icon={TrendingUp}
            />
            <MetricCard
              label="Boletos em aberto"
              value={String(counts.aberto)}
              sub={`${counts.processando} processando`}
              icon={Target}
            />
          </section>

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
              <button type="button" className={styles.btnExport}>
                <Download /> Exportar CSV
              </button>
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
                <span>{filteredHistory.length} de {history.length} boletos</span>
              </div>
            </section>
          )}
        </>
      )}
      </div>
    </FmzConnectedPageShell>
  );
}
