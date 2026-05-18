'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Copy, Download, FileText, List, MessageCircle, QrCode, ReceiptText, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell } from '../../../components/layout';
import { getCurrentTenantDashboard } from '../../tenant-portal/services';
import type { FmzTenantDashboard } from '../../tenant-portal/domain';
import styles from './FmzInvoicePage.module.css';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

const formatMoney = (v?: number | null) => moneyFmt.format(Number(v ?? 0));
const formatDate = (v?: string | null): string => {
  if (!v) return 'Não informado';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : dateFmt.format(d);
};

function splitMoneyDisplay(v?: number | null): { whole: string; cents: string } {
  const formatted = moneyFmt.format(Number(v ?? 0));
  // pt-BR produces "R$ X.XXX,XX" — strip currency prefix including non-breaking space
  const stripped = formatted.replace(/^R\$[\s ]+/, '');
  const commaIndex = stripped.lastIndexOf(',');
  if (commaIndex === -1) return { whole: stripped, cents: '' };
  return { whole: stripped.slice(0, commaIndex), cents: stripped.slice(commaIndex) };
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago', received: 'Pago', confirmed: 'Confirmado',
  pending: 'Aguardando pagamento', created: 'Criado', registered: 'Registrado',
  overdue: 'Vencido', expired: 'Expirado', canceled: 'Cancelado',
  cancelled: 'Cancelado', not_generated: 'Não gerado',
};

function resolveStatusLabel(status?: string | null) {
  const key = String(status ?? '').trim().toLowerCase();
  return STATUS_LABEL[key] ?? status ?? 'Não informado';
}

function isStatusOk(status?: string | null) {
  const key = String(status ?? '').trim().toLowerCase();
  return key === 'paid' || key === 'received' || key === 'confirmed';
}

const BARCODE_WIDTHS = [3,1,2,3,1,1,2,1,3,2,1,2,1,3,1,2,3,1,2,1,1,3,2,1,2,3,1,1,2,3,1,2,1,1,3,2,1,3,1,2,1];

function BarcodeVisual() {
  return (
    <div className={styles.barcodeWrap}>
      {BARCODE_WIDTHS.map((w, i) => (
        <div
          key={i}
          className={styles.barcodeBar}
          style={{ width: `${w}px`, opacity: i % 2 === 0 ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

type CopyButtonProps = { text: string; label?: string };

function CopyButton({ text, label = 'Copiar' }: CopyButtonProps) {
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
      className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
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

function InvoiceContent({ dashboard }: { dashboard: FmzTenantDashboard }) {
  const boleto = dashboard.boleto;
  const summary = dashboard.monthlySummary;
  const competence = dashboard.competence;

  const status = boleto?.status ?? summary?.status;
  const isOk = isStatusOk(status);

  const daysUntilDue = useMemo(() => {
    if (!summary?.dueDate) return null;
    const due = new Date(summary.dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [summary?.dueDate]);

  const digitableLine = boleto?.digitableLine ?? '';
  const pixCode = 'Código PIX não disponível';
  const lines = buildInvoiceLines(summary);
  const totalDisplay = splitMoneyDisplay(summary?.totalDueAmount);

  return (
    <>
      {/* Page head */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadLeft}>
          <p className={styles.eyebrow}>Pagamento · Competência {competence?.label ?? competence?.month ?? 'atual'}</p>
          <h1 className={styles.pageTitle}>Boleto do mês</h1>
          {summary?.dueDate && (
            <p className={styles.pageSub}>
              Vencimento em <span style={{ fontWeight: 600, color: 'var(--fmz-navy)' }}>{formatDate(summary.dueDate)}</span>
            </p>
          )}
        </div>
        <span className={isOk ? styles.pillOk : styles.pillWarn}>
          <span className={styles.dot} />
          {resolveStatusLabel(status)}
        </span>
      </div>

      {/* Hero card */}
      <section className={styles.heroCard}>
        <div className={styles.heroGrid}>
          <div className={styles.heroLeft}>
            <span className={styles.heroEyebrow}>Valor total</span>
            <div className={styles.heroTotal}>
              <span className={styles.heroCurrency}>R$</span>
              {totalDisplay.whole}
              <span className={styles.heroCents}>,{totalDisplay.cents}</span>
            </div>
            <div className={styles.heroDue}>
              {daysUntilDue !== null && daysUntilDue > 0 && (
                <span className={styles.pillWarn}>
                  <span className={styles.dot} />
                  Vence em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'}
                </span>
              )}
              {summary?.dueDate && (
                <span>Vencimento <span className={styles.heroDate}>{formatDate(summary.dueDate)}</span></span>
              )}
            </div>
          </div>
          <div className={styles.heroActions}>
            <button type="button" className={`${styles.btn} ${styles.btnPix}`}>
              <Zap /> Pagar via PIX
            </button>
            {boleto?.downloadUrl ? (
              <a
                href={boleto.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.btn}
                style={{ textDecoration: 'none' }}
              >
                <Download /> Baixar PDF
              </a>
            ) : (
              <button type="button" className={styles.btn} disabled>
                <Download /> Boleto indisponível
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2-col: barcode + pix */}
      <section className={styles.cols}>
        {/* Barcode card */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitle}>
              <span className={styles.cardTitleIco}><ReceiptText /></span>
              Boleto bancário
            </div>
            {boleto?.paymentProvider && (
              <span className={styles.cardMono}>{boleto.paymentProvider.toUpperCase()}</span>
            )}
          </div>

          <p className={styles.lineLabel}>Linha digitável</p>
          <div className={styles.lineWrap}>
            <span className={styles.lineText}>{digitableLine || 'Não disponível'}</span>
            {digitableLine && <CopyButton text={digitableLine} />}
          </div>

          <p className={styles.lineLabel}>Código de barras</p>
          <BarcodeVisual />
          {digitableLine && <p className={styles.barcodeFoot}>{digitableLine}</p>}

          <div className={styles.rowActions}>
            <button type="button" className={styles.btnSm}>
              <FileText /> Enviar por e-mail
            </button>
            <button type="button" className={styles.btnSm}>
              <MessageCircle /> WhatsApp
            </button>
          </div>
        </div>

        {/* PIX card */}
        <div className={styles.pixCard}>
          <div className={styles.pixHead}>
            <div className={styles.pixTitle}>
              <span className={styles.pixIco}><Zap /></span>
              PIX
            </div>
            <span className={styles.pixBadge}>Mais rápido</span>
          </div>

          <div className={styles.qrWrap}>
            <QrCode size={160} strokeWidth={1.2} color="var(--fmz-navy)" />
          </div>

          <div className={styles.pixCopy}>
            <span className={styles.pixCode}>{pixCode}</span>
            <CopyButton text={pixCode} />
          </div>

          <div className={styles.pixInfo}>
            <FileText size={13} />
            <span>Compensação <strong>imediata</strong> · Identificador único do mês</span>
          </div>
        </div>
      </section>

      {/* Composition */}
      {lines.length > 0 && (
        <section className={styles.compCard}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitle}>
              <span className={styles.cardTitleIco}><List /></span>
              Composição do boleto
            </div>
          </div>
          <div className={styles.lines}>
            {lines.map((line) => {
              const isToken = line.key?.toLowerCase().includes('token');
              const isRent = line.key?.toLowerCase().includes('rent') && !line.key?.toLowerCase().includes('fee');
              return (
                <div key={line.key} className={styles.lineItem}>
                  <span className={`${styles.lineLeft} ${isToken ? styles.lineLeftHighlight : ''}`}>
                    <span className={`${styles.lineIcon} ${isToken ? styles.lineIconHighlight : ''}`}>
                      <ReceiptText />
                    </span>
                    {line.label}
                  </span>
                  <span className={`${styles.lineValue} ${isRent ? styles.lineValueGreen : ''} ${isToken ? styles.lineValueGold : ''}`}>
                    {formatMoney(line.amount)}
                  </span>
                </div>
              );
            })}
            <div className={styles.lineTotal}>
              <span className={styles.lineTotalKey}>Total a pagar</span>
              <span className={styles.lineTotalValue}>{formatMoney(summary?.totalDueAmount)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Help strip */}
      <div className={styles.help}>
        <a href="#" className={styles.helpCard}>
          <div className={styles.helpIco}><Check /></div>
          <div className={styles.helpBody}>
            <p className={styles.helpTitle}>Já pagou?</p>
            <p className={styles.helpSub}>Envie o comprovante para confirmação manual</p>
          </div>
          <ChevronRight className={styles.helpArrow} size={14} />
        </a>
        <a href="#" className={styles.helpCard}>
          <div className={styles.helpIco}><MessageCircle /></div>
          <div className={styles.helpBody}>
            <p className={styles.helpTitle}>Tem dúvidas?</p>
            <p className={styles.helpSub}>Fale com a gestora pelo chat</p>
          </div>
          <ChevronRight className={styles.helpArrow} size={14} />
        </a>
      </div>
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
          <div className={styles.empty}>
            <span className={styles.spinner} />
            <p className={styles.emptyDesc}>Carregando boleto...</p>
          </div>
        ) : errorMessage ? (
          <>
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Boleto do mês</h1>
            </div>
            <EmptyState title="Erro ao carregar" description={errorMessage} />
          </>
        ) : !dashboard ? (
          <>
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Boleto do mês</h1>
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
