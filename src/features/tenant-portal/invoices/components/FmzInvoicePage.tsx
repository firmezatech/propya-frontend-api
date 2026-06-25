'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  MessageCircle,
  QrCode,
  Receipt,
  ScanLine,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell, FmzInvoiceSkeleton } from '../../../../components/layout';
import { getCurrentTenantDashboard } from '../../services';
import type { FmzTenantDashboard } from '../../domain';
import styles from './FmzInvoicePage.module.css';
import { formatDateBR } from '../../../../lib/fmz-date';

// react-barcode uses document/window — must be client-only
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const formatMoney = (v?: number | null) => moneyFmt.format(Number(v ?? 0));
const formatDate = (v?: string | null): string => formatDateBR(v, 'Não informado');

function splitMoneyDisplay(v?: number | null): { whole: string; cents: string } {
  const formatted = moneyFmt.format(Number(v ?? 0));
  const stripped = formatted.replace(/^R\$[\s ]+/, '');
  const commaIndex = stripped.lastIndexOf(',');
  if (commaIndex === -1) return { whole: stripped, cents: '' };
  return { whole: stripped.slice(0, commaIndex), cents: stripped.slice(commaIndex) };
}

function buildDuePillLabel(dueDate: string | null | undefined, daysUntilDue: number | null): string | null {
  if (!dueDate) return null;
  const date = formatDate(dueDate);
  if (daysUntilDue === null) return `Vence ${date}`;
  if (daysUntilDue > 0) return `Vence ${date} · em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}`;
  if (daysUntilDue === 0) return `Vence hoje · ${date}`;
  return `Venceu em ${date}`;
}

type CopyButtonProps = { text: string; label?: string; tone?: 'default' | 'onPix' };

function CopyButton({ text, label = 'Copiar', tone = 'default' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${styles.copyBtn} ${tone === 'onPix' ? styles.copyBtnOnPix : ''} ${copied ? styles.copyBtnCopied : ''}`}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copiado!' : label}
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyDesc}>{description}</p>
    </div>
  );
}

type InvoiceLine = { key: string; label: string; amount: number };

function buildInvoiceLines(summary: FmzTenantDashboard['monthlySummary']): InvoiceLine[] {
  if (summary?.lines && summary.lines.length > 0) return summary.lines;

  const lines: InvoiceLine[] = [];
  if ((summary?.rentWithDiscountAmount ?? 0) > 0)
    lines.push({ key: 'current-rent', label: 'Aluguel', amount: summary!.rentWithDiscountAmount! });
  if ((summary?.rentalAdminFeeAmount ?? 0) > 0)
    lines.push({ key: 'rent-fee', label: 'Taxa adm. aluguel', amount: summary!.rentalAdminFeeAmount! });
  if ((summary?.condominiumAmount ?? 0) > 0)
    lines.push({ key: 'condominium', label: 'Condomínio', amount: summary!.condominiumAmount! });
  if ((summary?.scheduledTokenPurchaseAmount ?? 0) > 0)
    lines.push({ key: 'scheduled-token-purchase', label: 'Compra programada de tokens', amount: summary!.scheduledTokenPurchaseAmount! });
  if ((summary?.tokenPurchaseFeeAmount ?? 0) > 0)
    lines.push({ key: 'token-fee', label: 'Taxa de compra de tokens', amount: summary!.tokenPurchaseFeeAmount! });
  return lines;
}

// Splits the flat line list into the two groups shown in the reference
// (Boleto.html): "Moradia" (rent/condo) and "Sua compra do imóvel" (tokens).
function groupInvoiceLines(lines: InvoiceLine[]): { housing: InvoiceLine[]; investment: InvoiceLine[] } {
  const housing: InvoiceLine[] = [];
  const investment: InvoiceLine[] = [];
  for (const line of lines) {
    (line.key?.toLowerCase().includes('token') ? investment : housing).push(line);
  }
  return { housing, investment };
}

// ─── PIX QR Code ─────────────────────────────────────────────────────────────

function PixQrImage({ qrCode }: { qrCode: string | null | undefined }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!qrCode) { setDataUrl(null); return; }
    // 'H' (~30% error correction) is required here, not just a quality nicety: the
    // brand badge rendered on top of the image (below) physically covers the center
    // ~16% of the code. Anything below 'H' risks a scan failure once that area is
    // occluded — this is what makes the badge safe to add without breaking the PIX read.
    void QRCode.toDataURL(qrCode, { width: 200, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#2A1A22', light: '#FFFFFF' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [qrCode]);

  if (dataUrl) {
    return (
      <div className={styles.qrBadgeWrap}>
        <img src={dataUrl} alt="QR Code PIX" width={196} height={196} className={styles.qrImg} />
        <span className={styles.qrBadge} aria-hidden="true">P</span>
      </div>
    );
  }

  return <QrCode size={160} strokeWidth={1.2} color="var(--fmz-navy)" />;
}

// ─── Boleto Barcode ───────────────────────────────────────────────────────────

function BarcodeDisplay({ barcode }: { barcode: string | null | undefined }) {
  if (!barcode) {
    // Decorative placeholder when barcode is unavailable
    const WIDTHS = [3,1,2,3,1,1,2,1,3,2,1,2,1,3,1,2,3,1,2,1,1,3,2,1,2,3,1,1,2,3,1,2,1,1,3,2,1,3,1,2,1];
    return (
      <div className={styles.barcodeWrap}>
        {WIDTHS.map((w, i) => (
          <div key={i} className={styles.barcodeBar} style={{ width: `${w}px`, opacity: i % 2 === 0 ? 1 : 0 }} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.barcodeWrap} style={{ justifyContent: 'center' }}>
      <Barcode
        value={barcode}
        format="ITF"
        width={1.5}
        height={60}
        displayValue={false}
        background="transparent"
        lineColor="var(--fmz-navy, #2A1A22)"
      />
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function InvoiceContent({ dashboard }: { dashboard: FmzTenantDashboard }) {
  const boleto  = dashboard.boleto;
  const pix     = dashboard.pix;
  const summary = dashboard.monthlySummary;

  const [boletoOpen, setBoletoOpen] = useState(false);

  const daysUntilDue = useMemo(() => {
    if (!summary?.dueDate) return null;
    const due = new Date(summary.dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [summary?.dueDate]);

  const digitableLine = boleto?.digitableLine ?? '';
  const barcodeValue  = boleto?.barcode ?? null;
  const pixCode       = pix?.qrCode ?? null;
  const lines = buildInvoiceLines(summary);
  const { housing, investment } = groupInvoiceLines(lines);
  const totalDisplay = splitMoneyDisplay(summary?.totalDueAmount);
  const duePillLabel = buildDuePillLabel(summary?.dueDate, daysUntilDue);

  return (
    <>
      {/* Page head */}
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Pague seu boleto do mês</h1>
        {duePillLabel && (
          <p className={styles.pageSub}>
            <span className={styles.duePill}><span className={styles.dot} />{duePillLabel}</span>
          </p>
        )}
      </div>

      {/* PIX HERO — primary payment method */}
      <section className={styles.pixHero}>
        <div className={styles.pixQrSide}>
          <div className={styles.qrWrap}>
            <PixQrImage qrCode={pixCode} />
          </div>
          <div className={styles.pixScanHint}>
            <ScanLine size={13} /> Aponte a câmera do seu banco
          </div>
        </div>
        <div className={styles.pixMain}>
          <span className={styles.pixRecommendedTag}>Recomendado · compensação imediata</span>
          <div className={styles.pixHeading}>Pagamento instantâneo</div>
          <div className={styles.pixAmount}>
            <span className={styles.pixCurrency}>R$</span>
            {totalDisplay.whole}
            <span className={styles.pixCents}>{totalDisplay.cents}</span>
          </div>
          {summary?.dueDate && (
            <p className={styles.pixMeta}>Vencimento <span className={styles.pixMetaDate}>{formatDate(summary.dueDate)}</span></p>
          )}

          {pixCode ? (
            <>
              <p className={styles.lineLabel}>PIX copia e cola</p>
              <div className={styles.pixCopyRow}>
                <span className={styles.pixCode}>{pixCode}</span>
                <CopyButton text={pixCode} tone="onPix" />
              </div>
            </>
          ) : (
            <div className={styles.pixCopyRow}>
              <span className={styles.pixCodeUnavailable}>PIX indisponível no momento</span>
            </div>
          )}

          <div className={styles.pixPerks}>
            <span className={styles.perk}><Zap size={14} /> Cai na hora, <strong>sem espera</strong></span>
            <span className={styles.perk}><Shield size={14} /> Pagamento <strong>seguro</strong></span>
          </div>
        </div>
      </section>

      {/* BOLETO — secondary, collapsible */}
      <section className={`${styles.altCard} ${boletoOpen ? styles.altCardOpen : ''}`}>
        <button
          type="button"
          className={styles.altHead}
          onClick={() => setBoletoOpen((open) => !open)}
          aria-expanded={boletoOpen}
        >
          <span className={styles.altLeft}>
            <span className={styles.altIco}><Receipt size={17} /></span>
            <span>
              <span className={styles.altTitle}>Prefere boleto bancário?</span>
              <span className={styles.altSub}>Compensa em até 2 dias úteis</span>
            </span>
          </span>
          <ChevronDown className={styles.altChevron} size={18} />
        </button>

        {boletoOpen && (
          <div className={styles.altBody}>
            <p className={styles.lineLabel} style={{ marginTop: 14 }}>Linha digitável</p>
            <div className={styles.lineWrap}>
              <span className={styles.lineText}>{digitableLine || 'Não disponível'}</span>
              {digitableLine && <CopyButton text={digitableLine} />}
            </div>

            <BarcodeDisplay barcode={barcodeValue} />
            {digitableLine && <p className={styles.barcodeFoot}>{digitableLine}</p>}

            <div className={styles.rowActions}>
              {boleto?.downloadUrl ? (
                <a href={boleto.downloadUrl} target="_blank" rel="noreferrer" className={styles.btnSm}>
                  <Download /> Baixar PDF
                </a>
              ) : (
                <button type="button" className={styles.btnSm} disabled>
                  <Download /> Baixar PDF
                </button>
              )}
              <Link href="/connected/coming-soon" className={styles.btnSm}>
                <FileText /> E-mail
              </Link>
              <Link href="/connected/coming-soon" className={styles.btnSm}>
                <MessageCircle /> WhatsApp
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Composition */}
      {lines.length > 0 && (
        <section className={styles.compCard}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitle}>
              <span className={styles.cardTitleIco}><Receipt size={13} /></span>
              O que está incluído
            </div>
          </div>

          {housing.length > 0 && (
            <div className={styles.grp}>
              <div className={styles.grpHead}><span className={styles.grpDot} />Moradia</div>
              {housing.map((line) => (
                <div key={line.key} className={styles.row}>
                  <span className={styles.rowLabel}>{line.label}</span>
                  <span className={styles.rowValue}>{formatMoney(line.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {investment.length > 0 && (
            <div className={`${styles.grp} ${styles.grpInvest}`}>
              <div className={styles.grpHead}><span className={styles.grpDot} />Sua compra do imóvel</div>
              {investment.map((line) => (
                <div key={line.key} className={`${styles.row} ${styles.rowAccent}`}>
                  <span className={styles.rowLabel}>{line.label}</span>
                  <span className={styles.rowValue}>{formatMoney(line.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.billTotal}>
            <span className={styles.billTotalKey}>Total a pagar</span>
            <span className={styles.billTotalValue}>{formatMoney(summary?.totalDueAmount)}</span>
          </div>
        </section>
      )}
    </>
  );
}

export function FmzInvoicePage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [dashboard, setDashboard] = useState<FmzTenantDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await getCurrentTenantDashboard(propertyId);
        if (active) setDashboard(data);
      } catch {
        if (active) setErrorMessage('Não foi possível carregar os dados do boleto. Verifique se a sessão está ativa.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [propertyId]);

  return (
    <FmzConnectedPageShell width="tenant">
      <Link href="/connected/dashboard" className={styles.backLink}>
        <ArrowLeft size={14} /> Voltar ao dashboard
      </Link>

      <div className={styles.page}>
        {isLoading ? (
          <FmzInvoiceSkeleton />
        ) : errorMessage ? (
          <>
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Pague seu boleto do mês</h1>
            </div>
            <EmptyState title="Erro ao carregar" description={errorMessage} />
          </>
        ) : !dashboard ? (
          <>
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Pague seu boleto do mês</h1>
            </div>
            <EmptyState title="Boleto não encontrado" description="Não há dados de boleto disponíveis para esta competência." />
          </>
        ) : (
          <InvoiceContent dashboard={dashboard} />
        )}
      </div>
    </FmzConnectedPageShell>
  );
}
