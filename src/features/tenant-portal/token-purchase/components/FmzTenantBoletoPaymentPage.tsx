'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeInfo,
  Barcode,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Landmark,
  Loader2,
  RefreshCw,
  WalletCards,
  Zap,
} from 'lucide-react';
import styles from './FmzTenantBoletoPayment.module.css';
import { buildFmzLocalizedHref } from '../../../../lib/fmz-localize-href';
import { formatCurrencyBRL } from '../../../../lib/fmz-currency';
import { formatDateBR } from '../../../../lib/fmz-date';
import { copyToClipboard } from '../../../../lib/fmz-clipboard';
import {
  readTokenPurchaseCart,
  readTokenPurchasePayment,
} from '../domain/fmz-token-purchase-cart';
import {
  boletoStatusIsPaid,
  normalizeBoletoDetails,
  translateBoletoStatus,
  type BoletoPaymentDetails,
} from '../domain/fmz-boleto-details';
import type {
  FmzTokenPurchaseCart,
  FmzTokenPurchasePayment,
} from '../domain/fmz-token-purchase.types';
import { fetchTokenPurchaseStatus } from '../services/fmz-token-purchase-api';

const intFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

interface BarcodeBar {
  x: number;
  width: number;
}

// Builds a purely decorative Interleaved-2of5-looking barcode from the boleto
// digits. Visual only — the scannable source of truth is the linha digitável.
// Returns absolute-positioned bars within an 800×100 viewBox. Time/space: O(n)
// over the number of digits.
const BARCODE_VIEWBOX_WIDTH = 800;
const BARCODE_QUIET_ZONE = 14;
const BARCODE_STRIPE_WIDTHS = [1, 2, 3, 1, 2, 3, 1, 2, 2, 3];
const BARCODE_GUARD_START = [1, 1, 1, 1];
const BARCODE_GUARD_END = [3, 1, 1];

function buildBarcodeBars(code: string): BarcodeBar[] {
  const digits = code.replace(/\D/g, '');
  if (!digits) return [];

  const stripes = [
    ...BARCODE_GUARD_START,
    ...digits.split('').map((d) => BARCODE_STRIPE_WIDTHS[Number(d)] ?? 2),
    ...BARCODE_GUARD_END,
  ];
  const usableWidth = BARCODE_VIEWBOX_WIDTH - BARCODE_QUIET_ZONE * 2;
  const totalUnits = stripes.reduce((sum, w) => sum + w, 0);
  const unitWidth = usableWidth / totalUnits;

  const bars: BarcodeBar[] = [];
  let cursorX = BARCODE_QUIET_ZONE;
  stripes.forEach((stripeUnits, index) => {
    const width = stripeUnits * unitWidth;
    if (index % 2 === 0) bars.push({ x: cursorX, width }); // even index = filled bar
    cursorX += width;
  });
  return bars;
}

function isHttpUrl(url: string | undefined | null): url is string {
  return typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; details: BoletoPaymentDetails }
  | { status: 'error'; message: string };

export function FmzTenantBoletoPaymentPage() {
  const router = useRouter();
  const params = useParams();

  const locale = typeof params.locale === 'string' ? params.locale : undefined;
  const paymentTransactionId =
    typeof params.paymentTransactionId === 'string' ? params.paymentTransactionId : '';

  const href = useCallback((path: string) => buildFmzLocalizedHref(locale, path), [locale]);

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [cart, setCart] = useState<FmzTokenPurchaseCart | null>(null);
  const [copied, setCopied] = useState(false);

  // Seed from the just-created payment (sessionStorage) for an instant first
  // paint, then refresh from the authoritative GET-by-id endpoint.
  const loadDetails = useCallback(async () => {
    setState({ status: 'loading' });

    const seedPayment: FmzTokenPurchasePayment | null = readTokenPurchasePayment();
    const seedMatches =
      !!seedPayment &&
      (!paymentTransactionId || seedPayment.paymentTransactionId === paymentTransactionId);
    const usableSeed = seedMatches ? seedPayment : null;

    if (!paymentTransactionId) {
      // No id in the route: fall back to the cached creation response only.
      // TODO: ideally always navigate here with a paymentTransactionId so the
      // boleto can be re-fetched on refresh instead of relying on sessionStorage.
      if (usableSeed?.boleto) {
        setState({ status: 'ready', details: normalizeBoletoDetails(usableSeed) });
      } else {
        setState({ status: 'error', message: 'Identificador do pagamento ausente.' });
      }
      return;
    }

    try {
      const status = await fetchTokenPurchaseStatus(paymentTransactionId);
      // Fetched status wins per-field; the cached creation response fills any
      // gaps (it carries linha digitável / PDF URL generated at creation time).
      const details = normalizeBoletoDetails(status, usableSeed);

      const hasBoletoData =
        details.linhaDigitavel || details.barcode || details.pdfUrl || details.boletoUrl;

      if (!hasBoletoData && !details.amount && status.success === false) {
        setState({ status: 'error', message: 'Não foi possível carregar os dados do boleto.' });
        return;
      }

      setState({ status: 'ready', details });
    } catch {
      // Network/endpoint failure — degrade gracefully to the cached response.
      if (usableSeed?.boleto) {
        setState({ status: 'ready', details: normalizeBoletoDetails(usableSeed) });
      } else {
        setState({
          status: 'error',
          message: 'Não foi possível carregar os dados do boleto. Tente novamente.',
        });
      }
    }
  }, [paymentTransactionId]);

  useEffect(() => {
    setCart(readTokenPurchaseCart());
    void loadDetails();
  }, [loadDetails]);

  const details = state.status === 'ready' ? state.details : null;

  // Copy field shows the linha digitável only; the barcode area uses the barcode
  // value. They are kept strictly separate (a barcode is not a valid linha digitável).
  const copyCode = details?.linhaDigitavel ?? '';
  const barcodeValue = details?.barcode ?? '';
  const openUrl = details?.pdfUrl ?? details?.boletoUrl ?? null;
  const isPaid = boletoStatusIsPaid(details?.status);

  const handleCopy = useCallback(async () => {
    if (!copyCode) return;
    const ok = await copyToClipboard(copyCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [copyCode]);

  const barcodeBars = useMemo(() => buildBarcodeBars(barcodeValue), [barcodeValue]);

  const amountLabel = details?.amount != null
    ? formatCurrencyBRL(details.amount)
    : formatCurrencyBRL(cart?.quote.total);
  const tokenCount = cart?.quantity ?? null;
  const tokenSymbol = cart?.quote.tokenSymbol ?? null;

  return (
    <main className={styles.page}>
      <button type="button" className={styles.back} onClick={() => router.push(href('/connected/tokens-to-purchase-pix/confirm'))}>
        <ArrowLeft size={14} /> Voltar para a confirmação
      </button>

      <div className={styles.steps} aria-label="Etapas da compra">
        <span className={`${styles.step} ${styles.stepDone}`}><span className={styles.dot}><Check size={11} /></span> Escolha</span>
        <span className={styles.bar} />
        <span className={`${styles.step} ${styles.stepDone}`}><span className={styles.dot}><Check size={11} /></span> Confirmação</span>
        <span className={styles.bar} />
        <span className={`${styles.step} ${styles.stepActive}`}><span className={styles.dot}>3</span> Pagamento</span>
      </div>

      <div className={styles.ph}>
        <p className={styles.phSup}>Pagamento via boleto</p>
        <h1 className={styles.phTitle}>Seu boleto está pronto</h1>
        <p className={styles.phSub}>
          Copie a linha digitável ou abra o PDF e pague no app do seu banco. A compensação acontece
          em até 2 dias úteis — assim que o pagamento for confirmado, seus tokens são creditados.
        </p>
      </div>

      <section className={styles.payCard}>
        <div className={styles.amountRow}>
          <div>
            <div className={styles.amountK}>Valor do boleto</div>
            <div className={styles.amountV}>{amountLabel}</div>
          </div>
          <div className={styles.amountRight}>
            {tokenCount != null && (
              <><b>{intFmt.format(tokenCount)} tokens</b><br /></>
            )}
            {tokenSymbol ?? 'Compra de tokens'}
          </div>
        </div>

        {/* ── Loading ── */}
        {state.status === 'loading' && (
          <>
            <div className={styles.genFrame}><Loader2 className={styles.spinner} /></div>
            <p className={styles.statusText}>Carregando seu boleto…</p>
            <p className={styles.subStatus}>Buscando os dados do pagamento.</p>
          </>
        )}

        {/* ── Error / empty ── */}
        {state.status === 'error' && (
          <div className={styles.alert}>
            <p>{state.message}</p>
            <button type="button" className={styles.retryBtn} onClick={() => void loadDetails()}>
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        )}

        {/* ── Ready ── */}
        {state.status === 'ready' && details && (
          <>
            <div className={styles.boletoCard}>
              <div className={styles.bcTop}>
                <div className={styles.bcTopL}>
                  <div className={styles.bank}><Landmark size={15} /></div>
                  <div className={styles.bankInfo}>
                    <b>Boleto bancário</b>
                    <span>{translateBoletoStatus(details.status)}</span>
                  </div>
                </div>
                {details.dueDate && (
                  <span className={styles.bcDue}>
                    <CalendarDays size={11} /> Vence em {formatDateBR(details.dueDate)}
                  </span>
                )}
              </div>

              {barcodeBars.length > 0 ? (
                <div className={styles.barcodeWrap}>
                  <svg
                    className={styles.barcodeSvg}
                    viewBox="0 0 800 100"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Código de barras do boleto"
                  >
                    {barcodeBars.map((bar, i) => (
                      <rect key={i} x={bar.x} y="0" width={bar.width} height="100" fill="#0E1626" />
                    ))}
                  </svg>
                  <div className={styles.bcLabel}>Código de barras</div>
                </div>
              ) : (
                <div className={styles.barcodeWrap}>
                  <div className={styles.barcodeEmpty}>
                    <Barcode size={18} />
                    <span>Código de barras não disponível</span>
                  </div>
                  <div className={styles.bcLabel}>Código de barras</div>
                </div>
              )}

              <div className={styles.bcLine}>
                <div className={styles.bcLineLabel}>Linha digitável</div>
                <div className={styles.copyBlock}>
                  <input
                    className={`${styles.copyInput} ${styles.mono}`}
                    readOnly
                    value={copyCode || 'Linha digitável não disponível'}
                    aria-label="Linha digitável do boleto"
                  />
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                    disabled={!copyCode}
                    onClick={() => void handleCopy()}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${copied ? styles.copied : ''}`}
                disabled={!copyCode}
                onClick={() => void handleCopy()}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Linha copiada' : 'Copiar linha digitável'}
              </button>
              {isHttpUrl(openUrl) ? (
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btn} ${styles.btnGhost}`}
                >
                  <ExternalLink size={14} /> Abrir boleto (PDF)
                </a>
              ) : (
                <span className={`${styles.btn} ${styles.btnGhost}`} aria-disabled="true">
                  <Barcode size={14} /> PDF indisponível
                </span>
              )}
            </div>

            <div className={`${styles.awaiting} ${isPaid ? styles.paid : ''}`}>
              <span className={styles.pulse} />
              <span>
                {isPaid ? (
                  <><b>Pagamento confirmado.</b> Seus tokens serão creditados na carteira.</>
                ) : (
                  <><b>Aguardando pagamento.</b> O boleto compensa em até 2 dias úteis. Assim que o banco confirmar, os tokens são creditados automaticamente.</>
                )}
              </span>
            </div>

            {!isPaid && (
              <div className={styles.tip}>
                <BadgeInfo size={16} />
                <span>
                  Quer crédito imediato?{' '}
                  <button
                    type="button"
                    className={styles.tipLink}
                    onClick={() => router.push(href('/connected/tokens-to-purchase-pix/pix'))}
                  >
                    Pague via Pix
                  </button>{' '}
                  e os tokens caem na sua carteira em segundos.
                </span>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Details ── */}
      {state.status === 'ready' && details && (
        <div className={styles.detCard}>
          <div className={styles.detRow}>
            <span className={styles.k}>Status</span>
            <span className={`${styles.statusBadge} ${isPaid ? styles.statusBadgePaid : ''}`}>
              {translateBoletoStatus(details.status)}
            </span>
          </div>
          {details.dueDate && (
            <div className={styles.detRow}>
              <span className={styles.k}>Vencimento</span>
              <span className={styles.v}>{formatDateBR(details.dueDate)}</span>
            </div>
          )}
          {details.amount != null && (
            <div className={styles.detRow}>
              <span className={styles.k}>Valor</span>
              <span className={styles.v}>{formatCurrencyBRL(details.amount)}</span>
            </div>
          )}
          {/*
            Tenant-facing details card intentionally shows only Status, Vencimento and
            Valor. Internal/technical fields (nosso número, providerBoletoId / payment
            ids) stay in the normalized `details` object for internal use but are never
            rendered to the tenant.
          */}
        </div>
      )}

      {/* ── Navigation back to the tenant flow ── */}
      <div className={`${styles.actionRow} ${styles.navRow}`}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => router.push(href('/connected/wallet'))}
        >
          <WalletCards size={14} /> Ir para a carteira
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => router.push(href('/connected/dashboard'))}
        >
          <Zap size={14} /> Voltar ao dashboard
        </button>
      </div>

      <p className={styles.footerNote}>Boleto registrado e processado com segurança.</p>
    </main>
  );
}
