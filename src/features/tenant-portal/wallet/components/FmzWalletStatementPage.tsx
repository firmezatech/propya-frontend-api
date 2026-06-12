'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { getUserWallet } from '../../services';
import { getTenantProfile } from '../../services/fmz-tenant-profile-api';
import { getPlatformInfo, type FmzPlatformInfo } from '../../services/fmz-platform-info-api';
import type { FmzUserWallet, FmzUserWalletMovement } from '../../domain';
import type { TenantUserData } from '../../domain/fmz-tenant-profile.types';
import styles from './FmzWalletStatementPage.module.css';

// ── Formatters ────────────────────────────────────────────────────────────────

const brlFmt   = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numFmt   = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });
const dateFmt  = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFmt  = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

const fmtBRL = (v: number | null | undefined): string => {
  const n = Number(v ?? 0);
  if (n === 0) return '—';
  const sign = n < 0 ? '−' : '+';
  return `${sign} R$ ${brlFmt.format(Math.abs(n))}`;
};

const fmtBRLSplit = (v: number | null | undefined) => {
  const n = Math.abs(Number(v ?? 0));
  const str = brlFmt.format(n);
  const dot = str.lastIndexOf(',');
  return { integer: str.slice(0, dot), cents: str.slice(dot) };
};

const fmtDate  = (v: string | null | undefined) => v ? dateFmt.format(new Date(v)) : '—';
const fmtTime  = (v: string | null | undefined) => v ? timeFmt.format(new Date(v)) : '';
const fmtMonth = (v: string | null | undefined) => v ? monthFmt.format(new Date(v)) : '—';

// ── Doc ID + integrity hash ───────────────────────────────────────────────────

function buildDocId(user: TenantUserData | null): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const initials = user
    ? (user.firstName[0] ?? '') + (user.lastName[0] ?? '')
    : 'XX';
  return `EXT-${ymd}-${initials.toUpperCase()}`;
}

function buildHash(movements: FmzUserWalletMovement[]): string {
  let h = movements.length * 31;
  for (const m of movements) h = (h * 31 + Number(m.amount ?? 0) * 100) | 0;
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `${hex.slice(0, 4)}·${hex.slice(4)}`;
}

// ── Status badge helpers ──────────────────────────────────────────────────────

function resolveStatClass(status: string | null): string {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'applied' || s === 'ok') return styles.tStatOk;
  if (s === 'pending' || s === 'awaiting' || s === 'aguardando')          return styles.tStatWait;
  return styles.tStatBlue;
}

function resolveStatLabel(m: FmzUserWalletMovement): string {
  if (m.statusLabel) return m.statusLabel;
  const s = (m.status ?? '').toLowerCase();
  if (s === 'paid' || s === 'completed') return 'Compensado';
  if (s === 'pending')                   return 'Aguardando';
  return m.status ?? '—';
}

// ── Row component ─────────────────────────────────────────────────────────────

function StatementRow({ m }: { m: FmzUserWalletMovement }) {
  const isBuy  = m.type === 'buy';
  const isRent = m.type === 'rent';
  const typeClass = isBuy ? styles.tTypeBuy : isRent ? styles.tTypeRent : '';
  const amtClass  = (m.amount ?? 0) < 0 ? styles.tAmtNeg : (m.amount ?? 0) > 0 ? styles.tAmtPos : '';

  return (
    <tr>
      <td className={styles.tDate}>
        {fmtDate(m.occurredAt ?? m.date)}
        <small className={styles.tDateSmall}>{fmtTime(m.occurredAt)}</small>
      </td>
      <td>
        <span className={styles.tDesc}>{m.description ?? (isBuy ? 'Compra de tokens' : 'Rendimento de aluguel')}</span>
        {m.referenceId && (
          <span className={styles.tDescSub}>
            <span className={styles.tId}>{m.referenceId}</span>
          </span>
        )}
      </td>
      <td>
        <span className={`${styles.tType} ${typeClass}`}>
          <span className={`${styles.tTypeDot}`} />
          {m.typeLabel ?? (isBuy ? 'Compra' : isRent ? 'Aluguel' : 'Outro')}
        </span>
      </td>
      <td className={styles.tTokens}>
        {(m.tokens ?? 0) > 0
          ? <span className={styles.tTokensPlus}>+{numFmt.format(m.tokens!)}</span>
          : <span className={styles.tTokensNeutral}>—</span>}
      </td>
      <td className={`${styles.tAmt} ${amtClass}`}>{fmtBRL(m.amount)}</td>
      <td style={{ textAlign: 'center' }}>
        <span className={`${styles.tStat} ${resolveStatClass(m.status)}`}>
          <span className={styles.tStatDot} />
          {resolveStatLabel(m)}
        </span>
      </td>
    </tr>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SCard({ label, value, sub, accent }: {
  label: string;
  value: number | null | undefined;
  sub?: string;
  accent?: 'gold' | 'navy' | 'green' | 'amber' | 'red';
}) {
  const accentClass = {
    gold:  '',
    navy:  styles.sCardNavy,
    green: styles.sCardGreen,
    amber: styles.sCardAmber,
    red:   styles.sCardRed,
  }[accent ?? 'gold'];

  const { integer, cents } = fmtBRLSplit(value);

  return (
    <div className={`${styles.sCard} ${accentClass}`}>
      <div className={styles.sCardKey}>{label}</div>
      <div className={styles.sCardVal}>
        <span className={styles.sCardCurrency}>R$</span>
        {integer}
        <span className={styles.sCardCents}>{cents}</span>
      </div>
      {sub && <div className={styles.sCardSub}>{sub}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FmzWalletStatementPage() {
  const [wallet, setWallet]         = useState<FmzUserWallet | null>(null);
  const [user,   setUser]           = useState<TenantUserData | null>(null);
  const [platformInfo, setPlatform] = useState<FmzPlatformInfo | null>(null);
  const [isLoading, setLoading]     = useState(true);
  const [error,  setError]          = useState<string | null>(null);
  const issuedRef                   = useRef(new Date());

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [walletData, profileData, info] = await Promise.all([
          getUserWallet(),
          getTenantProfile(),
          getPlatformInfo(),
        ]);
        if (!active) return;
        setWallet(walletData);
        setUser(profileData.profile.user);
        setPlatform(info);
      } catch {
        if (active) setError('Não foi possível carregar o extrato. Tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (isLoading) return <div className={styles.screen}><div className={styles.stateCenter}>Carregando extrato…</div></div>;
  if (error || !wallet) return <div className={styles.screen}><div className={styles.stateCenter}>{error ?? 'Extrato indisponível.'}</div></div>;

  const movements = wallet.movements ?? [];
  const summary   = wallet.summary;
  const period    = wallet.period;
  const docId     = buildDocId(user);
  const hash      = buildHash(movements);
  const issued    = issuedRef.current;
  const issuedStr = `${dateFmt.format(issued)} · ${timeFmt.format(issued)}`;

  const periodStr = period?.from && period?.to
    ? `${fmtMonth(period.from)} a ${fmtMonth(period.to)} · ${period.days ?? '—'} dias`
    : '—';

  const totalOutflows = Math.abs(Number(summary?.totalOutflows ?? 0));
  const totalInflows  = Math.abs(Number(summary?.totalInflows  ?? 0));
  const net           = Number(summary?.netBalance ?? 0);

  return (
    <div className={styles.screen}>
      {/* Toolbar — hidden in print */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Link href="/connected/wallet">
            <ArrowLeft size={14} />
            Voltar à carteira
          </Link>
        </div>
        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.tbBtn} ${styles.tbBtnPrimary}`}
            onClick={() => window.print()}
          >
            <Printer size={13} />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* A4 document */}
      <article className={styles.doc}>
        {/* Header */}
        <header className={styles.head}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="#0E1626" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M12 3V21M3 8.5L21 15.5M21 8.5L3 15.5" stroke="#0E1626" strokeWidth="1.1" strokeOpacity=".4" />
              </svg>
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>{platformInfo?.brand_name ?? 'FirmezaToken'}</span>
              <span className={styles.brandTagline}>A revolução imobiliária começou.</span>
            </div>
          </div>

          <div className={styles.headCenter}>
            <div className={styles.docType}>Extrato da carteira</div>
            <div className={styles.docTitle}>Movimentações de tokens</div>
          </div>

          <div className={styles.headRight}>
            <div className={styles.headKey}>Documento</div>
            <div className={styles.headVal}>{docId}</div>
            <div style={{ marginTop: 6 }} className={styles.headKey}>Emitido em</div>
            <div className={styles.headVal}>{issuedStr}</div>
          </div>
        </header>

        {/* Meta */}
        <section className={styles.meta}>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Titular</span>
            <span className={styles.metaVal}>{user?.fullName ?? '—'}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>E-mail</span>
            <span className={`${styles.metaVal} ${styles.metaValMono}`}>{user?.email ?? '—'}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Período</span>
            <span className={styles.metaVal}>{periodStr}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Tokens em carteira</span>
            <span className={styles.metaVal}>
              {numFmt.format(Number(summary?.tokensInWallet ?? 0))}
              {summary?.ownershipPercent != null && (
                <> · {(summary.ownershipPercent * 100).toFixed(2)}% de posse</>
              )}
            </span>
          </div>
        </section>

        {/* Summary strip */}
        <section className={styles.summary}>
          <SCard
            label="Investido em tokens"
            value={summary?.investedInTokens}
            sub={summary?.purchaseCount ? `${summary.purchaseCount} compra${summary.purchaseCount !== 1 ? 's' : ''}` : undefined}
            accent="gold"
          />
          <SCard
            label="Economia de aluguel"
            value={summary?.rentSavings}
            sub="descontos aplicados"
            accent="green"
          />
          <SCard
            label="Total de saídas"
            value={totalOutflows}
            sub="compras + taxas"
            accent="navy"
          />
          <SCard
            label="Saldo líquido"
            value={net}
            sub="entradas − saídas"
            accent={net >= 0 ? 'green' : 'red'}
          />
        </section>

        {/* Table */}
        <div className={styles.tblHead}>
          Lançamentos
          <span className={styles.tblCount}>{movements.length} movimento{movements.length !== 1 ? 's' : ''}</span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 74 }}>Data</th>
              <th>Descrição</th>
              <th style={{ width: 96 }}>Tipo</th>
              <th style={{ width: 80 }} className="r">Tokens</th>
              <th style={{ width: 96 }} className="r">Valor (R$)</th>
              <th style={{ width: 96 }} className="c">Status</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--st-hint)', padding: '24px 12px' }}>
                  Nenhuma movimentação no período.
                </td>
              </tr>
            ) : (
              movements.map((m, i) => <StatementRow key={m.referenceId ?? i} m={m} />)
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
                <span className={styles.tfootLab}>Resumo do período</span>
                Saídas R$ {brlFmt.format(totalOutflows)} · Entradas R$ {brlFmt.format(totalInflows)}
              </td>
              <td colSpan={2}>
                <span className={styles.tfootLab}>Saldo líquido</span>
                <span className={net >= 0 ? styles.tfootPos : styles.tfootNeg}>
                  {net >= 0 ? '+' : '−'} R$ {brlFmt.format(Math.abs(net))}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <footer className={styles.foot}>
          <div className={styles.footLeft}>
            <strong>Documento informativo.</strong> Os valores acima refletem movimentações
            registradas na plataforma {platformInfo?.brand_name ?? 'FirmezaToken'} até a data de emissão. Em caso de divergência,
            fale conosco em <strong>{platformInfo?.support_email ?? 'contato@propya.ai'}</strong>.<br />
            {[
              platformInfo?.company_legal_name ?? 'Propya Gestão Imobiliária',
              platformInfo?.company_cnpj ? `CNPJ ${platformInfo.company_cnpj}` : 'CNPJ 00.000.000/0001-00',
              platformInfo?.company_address ?? 'São Paulo, SP',
            ].join(' · ')}
          </div>
          <div className={styles.footRight}>
            <span className={styles.footRightLab}>Hash de integridade</span>
            <span className={styles.footHash}>{hash}</span>
          </div>
        </footer>

        <span className={styles.wm} aria-hidden>FT</span>
      </article>
    </div>
  );
}
