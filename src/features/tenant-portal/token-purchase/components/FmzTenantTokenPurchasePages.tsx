'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Copy,
  Home,
  Landmark,
  Loader2,
  Minus,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react';
import styles from './FmzTenantTokenPurchase.module.css';
import {
  buildTokenPurchaseCart,
  calculateImpactProjection,
  clearTokenPurchaseCart,
  readTokenPurchaseCart,
  readTokenPurchasePayment,
  writeTokenPurchaseCart,
  writeTokenPurchasePayment,
} from '../domain/fmz-token-purchase-cart';
import type {
  FmzTokenPurchaseCart,
  FmzTokenPurchaseContext,
  FmzTokenPurchasePayment,
  FmzTokenPurchasePaymentMethod,
  FmzTokenPurchaseQuote,
  FmzTokenPurchaseStatusResponse,
} from '../domain/fmz-token-purchase.types';
import {
  createTokenPurchasePayment,
  fetchTokenPurchaseQuote,
  fetchTokenPurchaseQuoteContext,
  fetchTokenPurchaseStatus,
  getPixCopyPasteCode,
  getPixExpiration,
  getPixQrCodeImageSrc,
  mergePixIntoPayment,
  statusIsPaid,
} from '../services/fmz-token-purchase-api';

// ── Formatters ─────────────────────────────────────────────────────────────────

const moneyFmt     = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moneyRoundFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const moneyNoSymFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFmt       = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const pctFmt       = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const fmt = {
  money:     (v: number | null | undefined) => moneyFmt.format(Number(v ?? 0)),
  moneyRound:(v: number | null | undefined) => moneyRoundFmt.format(Number(v ?? 0)),
  noSym:     (v: number | null | undefined) => moneyNoSymFmt.format(Number(v ?? 0)),
  int:       (v: number | null | undefined) => intFmt.format(Number(v ?? 0)),
  pct:       (v: number | null | undefined) => `${pctFmt.format(Number(v ?? 0))}%`,
};

// ── Navigation helpers ─────────────────────────────────────────────────────────

function localizedHref(path: string): string {
  if (typeof window === 'undefined') return path;
  const locale = window.location.pathname.split('/').filter(Boolean)[0] ?? 'pt';
  return `/${locale}${path}`;
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Stepper({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className={styles.steps} aria-label="Etapas da compra">
      <span className={`${styles.step} ${active > 1 ? styles.stepDone : styles.stepActive}`}>
        <span className={styles.dot}>{active > 1 ? <Check size={12} /> : '1'}</span> Escolha
      </span>
      <span className={styles.bar} />
      <span className={`${styles.step} ${active > 2 ? styles.stepDone : active === 2 ? styles.stepActive : ''}`}>
        <span className={styles.dot}>{active > 2 ? <Check size={12} /> : '2'}</span> Confirmação
      </span>
      <span className={styles.bar} />
      <span className={`${styles.step} ${active === 3 ? styles.stepActive : ''}`}>
        <span className={styles.dot}>3</span> Pagamento
      </span>
    </div>
  );
}

function BackButton({ fallback = '/connected/dashboard' }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button type="button" className={styles.back} onClick={() => router.push(localizedHref(fallback))}>
      <ArrowLeft size={14} /> Voltar
    </button>
  );
}

// ── Quote context hook ─────────────────────────────────────────────────────────
// Replaces useDashboardSeed: fetches quantity-independent context from the backend
// (cached 30s server-side). No sequential dashboard waterfall.

function useQuoteContext(propertyTokenizationId: string | null): {
  context: FmzTokenPurchaseContext | null;
  loading: boolean;
} {
  const [context, setContext] = useState<FmzTokenPurchaseContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyTokenizationId) { setLoading(false); return; }
    let mounted = true;
    void fetchTokenPurchaseQuoteContext({ propertyTokenizationId })
      .then((ctx) => { if (mounted) { setContext(ctx); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [propertyTokenizationId]);

  return { context, loading };
}

// ── Quote fetching hook ────────────────────────────────────────────────────────

type QuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; quote: FmzTokenPurchaseQuote }
  | { status: 'error'; message: string };

function useTokenPurchaseQuote({
  propertyTokenizationId,
  quantity,
  enabled,
}: {
  propertyTokenizationId: string | null;
  quantity: number;
  enabled: boolean;
}): QuoteState {
  const [state, setState] = useState<QuoteState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !propertyTokenizationId || quantity < 1) {
      setState({ status: 'idle' });
      return;
    }

    setState({ status: 'loading' });

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      let cancelled = false;
      void fetchTokenPurchaseQuote({ propertyTokenizationId, quantity })
        .then((quote) => {
          if (!cancelled) setState({ status: 'ok', quote });
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setState({
              status: 'error',
              message: error instanceof Error ? error.message : 'Não foi possível obter a cotação.',
            });
          }
        });
      return () => { cancelled = true; };
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [propertyTokenizationId, quantity, enabled]);

  return state;
}

// ── Payment status polling hook ────────────────────────────────────────────────

const PAYMENT_POLL_INTERVAL_MS = 5_000;

const isPaymentConfirmed = (paymentStatus?: string | null, tokenOrderStatus?: string | null): boolean =>
  ['paid', 'authorized'].includes(String(paymentStatus ?? '')) ||
  ['settlement_pending', 'completed'].includes(String(tokenOrderStatus ?? ''));

function usePaymentStatusPolling({
  paymentTransactionId,
  enabled,
  onConfirmed,
  onStatus,
}: {
  paymentTransactionId: string | null;
  enabled: boolean;
  onConfirmed: () => void;
  onStatus?: (status: FmzTokenPurchaseStatusResponse) => void;
}) {
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !paymentTransactionId) return;

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const status = await fetchTokenPurchaseStatus(paymentTransactionId, controller.signal);
        if (controller.signal.aborted) return;

        setLastCheckedAt(new Date());
        // Surface every status so the page can merge late-arriving pix details into the UI.
        onStatus?.(status);

        if (isPaymentConfirmed(status.paymentStatus, status.tokenOrderStatus)) {
          onConfirmed();
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      timeoutId = setTimeout(poll, PAYMENT_POLL_INTERVAL_MS);
    };

    timeoutId = setTimeout(poll, PAYMENT_POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [paymentTransactionId, enabled, onConfirmed, onStatus]);

  return { lastCheckedAt };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 1 — Token selection
// ─────────────────────────────────────────────────────────────────────────────

export function FmzTenantTokenPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyTokenizationId = searchParams.get('propertyTokenizationId');
  const propertyId             = searchParams.get('propertyId');
  const propertyLabelParam     = searchParams.get('propertyLabel');
  const tokenSymbolParam       = searchParams.get('tokenSymbol');

  const { context, loading: contextLoading } = useQuoteContext(propertyTokenizationId);

  // Derive seed values from context (replaces the old full-dashboard fetch).
  const currentTokens  = context?.rentProjectionInputs?.currentTokenBalance ?? 0;
  const totalTokens    = context?.totalSupply ?? 0;
  const currentRent    = context?.rentProjectionInputs?.currentRentAmount ?? 0;
  const fullRent       = context?.rentProjectionInputs?.adjustedBaseRentAmount ?? 0;
  const propertyValue  = (context?.unitPrice ?? 1) * totalTokens;
  const propertyLabel  = propertyLabelParam ?? context?.tokenName ?? 'Apto 54 Vila Madalena';
  const tokenSymbol    = tokenSymbolParam ?? context?.tokenSymbol ?? 'FT-0412';

  // Slider range: floor = tokens the user already holds, ceiling = tokens still
  // available to buy (total supply minus what's already in circulation).
  const availableToBuy = Math.max(totalTokens - currentTokens, 0);
  const minQty = currentTokens > 0 ? currentTokens : (context?.minQuantity ?? 1000);
  const maxQty = availableToBuy > 0 ? availableToBuy : (context?.maxQuantity ?? 92800);

  // Slider starts at the floor (the user's current balance), clamped to [minQty, maxQty].
  // Initialized once context loads — null until then to avoid rendering a stale default.
  const [quantity, setQuantity] = useState<number | null>(null);
  const effectiveQuantity = quantity ?? minQty;

  useEffect(() => {
    if (quantity !== null || contextLoading || !context) return;
    setQuantity(Math.max(minQty, Math.min(maxQty, minQty)));
  }, [context, contextLoading, quantity, minQty, maxQty]);

  // Payment method is chosen on a later step — PIX is the default carried into the cart.
  const method: FmzTokenPurchasePaymentMethod = 'pix';

  const quoteState = useTokenPurchaseQuote({
    propertyTokenizationId,
    quantity: effectiveQuantity,
    enabled: !contextLoading && quantity !== null,
  });

  const quote = quoteState.status === 'ok' ? quoteState.quote : null;

  const stepperSize = 1000;
  const sliderStep  = 100;
  const currentPct  = totalTokens > 0 ? (currentTokens / totalTokens) * 100 : 0;
  const deltaPct    = totalTokens > 0 ? (effectiveQuantity / totalTokens) * 100 : 0;

  const impact = quote
    ? calculateImpactProjection({
        currentTokens,
        purchaseQuantity: effectiveQuantity,
        totalTokens,
        currentRent,
        fullRent,
        propertyValue,
      })
    : null;

  const rentImpact = quote?.rentImpact ?? null;

  const displayCurrentPct  = rentImpact ? rentImpact.currentOwnershipPercentage  : currentPct;
  const displayNewPct      = rentImpact ? rentImpact.projectedOwnershipPercentage : impact ? impact.newPercentage  : currentPct + deltaPct;
  const displayDeltaPct    = rentImpact ? rentImpact.deltaOwnershipPercentage     : impact ? impact.deltaPercentage : deltaPct;
  const displayCurrentRent = rentImpact ? rentImpact.currentRentAmount            : currentRent;
  const displayNewRent     = rentImpact ? rentImpact.projectedRentAmount          : impact ? impact.newRent        : currentRent;
  const displayRentSaving  = rentImpact ? rentImpact.monthlySavingsAmount         : impact ? impact.rentSaving     : 0;

  const adjustQuantity = useCallback((next: number) => {
    const snapped = Math.round(next / sliderStep) * sliderStep;
    setQuantity(Math.max(minQty, Math.min(maxQty, snapped)));
  }, [minQty, maxQty]);

  const proceed = useCallback(() => {
    if (!quote) return;
    const cart = buildTokenPurchaseCart({
      quote,
      method,
      idempotencyKey: crypto.randomUUID(),
      propertyId,
      currentTokens,
      totalTokens,
      currentRent,
      fullRent,
      propertyValue,
    });
    if (quote.rentImpact) {
      const ri = quote.rentImpact;
      cart.currentPercentage = ri.currentOwnershipPercentage;
      cart.newPercentage     = ri.projectedOwnershipPercentage;
      cart.deltaPercentage   = ri.deltaOwnershipPercentage;
      cart.currentRent       = ri.currentRentAmount;
      cart.newRent           = ri.projectedRentAmount;
      cart.rentSaving        = ri.monthlySavingsAmount;
      cart.currentTokens     = ri.currentTokenBalance;
      cart.totalTokens       = ri.totalSupply;
    }
    writeTokenPurchaseCart(cart);
    router.push(localizedHref('/connected/tokens-to-purchase-pix/confirm'));
  }, [quote, method, propertyId, currentTokens, totalTokens, currentRent, fullRent, propertyValue, router]);

  // Plain numeric presets (reference layout) — clamped to the slider range, deduped.
  const presetValues = Array.from(
    new Set([minQty, 5000, 10000, 25000].map((value) => Math.min(value, maxQty))),
  )
    .filter((value) => value >= minQty)
    .sort((a, b) => a - b);

  // Prefer the authoritative quote; fall back to context-derived values until it lands.
  const displayFeeRate = quote?.processingFeePercent ?? (context?.processingFeePercent ?? 7.5);
  const unitPrice      = quote?.unitPrice ?? (context?.unitPrice ?? 1);
  const displayTotal   = quote ? quote.total : effectiveQuantity * unitPrice * (1 + displayFeeRate / 100);
  const formatPercentagePoints = (value: number) => pctFmt.format(Number(value ?? 0));

  if (!propertyTokenizationId && !contextLoading) {
    return (
      <main className={styles.buyPage}>
        <BackButton />
        <div className={styles.alert}>
          <strong>Imóvel não identificado.</strong> Volte ao dashboard e tente novamente a partir do seu imóvel.
        </div>
      </main>
    );
  }

  return (
    <main className={styles.buyPage}>
      <button type="button" className={styles.buyBackLink} onClick={() => router.push(localizedHref('/connected/dashboard'))}>
        <ArrowLeft size={13} />
        Voltar ao dashboard
      </button>

      <div className={styles.buyHead}>
        <h1 className={styles.buyTitle}>Comprar tokens</h1>
        <p className={styles.buySub}>{propertyLabel}</p>
      </div>

      {/* SELECTOR */}
      <section className={styles.buySelector}>
        <div className={styles.buySelQ}>Quantos tokens você quer comprar?</div>

        <div className={styles.buySelDisplay}>
          <button
            type="button"
            className={styles.buyStep}
            disabled={effectiveQuantity <= minQty}
            onClick={() => adjustQuantity(effectiveQuantity - stepperSize)}
            aria-label="Diminuir"
          ><Minus size={18} /></button>
          <div className={styles.buySelNum}>
            <div className={styles.buySelN}>{fmt.int(effectiveQuantity)}</div>
            <div className={styles.buySelU}>{effectiveQuantity === 1 ? 'token' : 'tokens'} · <strong>{tokenSymbol}</strong></div>
          </div>
          <button
            type="button"
            className={styles.buyStep}
            disabled={effectiveQuantity >= maxQty}
            onClick={() => adjustQuantity(effectiveQuantity + stepperSize)}
            aria-label="Aumentar"
          ><Plus size={18} /></button>
        </div>

        <div className={styles.buySliderWrap}>
          <input
            className={styles.buySlider}
            type="range"
            min={minQty}
            max={maxQty}
            step={sliderStep}
            value={Math.min(maxQty, effectiveQuantity)}
            onChange={(e) => adjustQuantity(Number(e.target.value))}
          />
          <div className={styles.buySliderLabels}>
            <span>{fmt.int(minQty)}</span>
            <span>{fmt.int(maxQty)}</span>
          </div>
        </div>

        <div className={styles.buyPresets}>
          {presetValues.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.buyPreset} ${effectiveQuantity === value ? styles.buyPresetActive : ''}`}
              onClick={() => adjustQuantity(value)}
            >{fmt.int(value)}</button>
          ))}
        </div>

        <div className={styles.buySelCost}>
          {quoteState.status === 'loading' && (
            <><Loader2 size={14} className={styles.buySpinner} /> Calculando…</>
          )}
          {quoteState.status === 'error' && <span className={styles.buyQuoteError}>{quoteState.message}</span>}
          {(quoteState.status === 'ok' || quoteState.status === 'idle') && (
            <>
              Você paga <b>{fmt.money(displayTotal)}</b>
              <span className={styles.buySelFee}>inclui taxa de processamento de {formatPercentagePoints(displayFeeRate)}%</span>
            </>
          )}
        </div>
      </section>

      {/* IMPACT */}
      <div className={styles.buyImpactHead}>O que muda para você</div>
      <div className={styles.buyImpactGrid}>
        <div className={styles.buyImpCard}>
          <div className={styles.buyImpTop}><span className={styles.buyImpIco}><Sparkles size={15} /></span>Sua posse no imóvel</div>
          <div className={styles.buyImpFlow}>
            <span className={styles.buyImpFrom}>{fmt.pct(displayCurrentPct)}</span>
            <span className={styles.buyImpArr}><ArrowRight size={13} /></span>
            <span className={styles.buyImpTo}>{fmt.pct(displayNewPct)}</span>
          </div>
          <span className={`${styles.buyImpTag} ${styles.buyImpTagUp}`}>+{formatPercentagePoints(displayDeltaPct)} pp</span>
        </div>

        <div className={`${styles.buyImpCard} ${styles.buyImpRent}`}>
          <div className={styles.buyImpTop}><span className={`${styles.buyImpIco} ${styles.buyImpIcoRent}`}><Landmark size={15} /></span>Seu aluguel mensal</div>
          <div className={styles.buyImpFlow}>
            <span className={styles.buyImpFrom}>{fmt.moneyRound(displayCurrentRent)}</span>
            <span className={styles.buyImpArr}><ArrowRight size={13} /></span>
            <span className={styles.buyImpTo}>{fmt.moneyRound(displayNewRent)}</span>
          </div>
          {displayRentSaving > 0 && (
            <span className={`${styles.buyImpTag} ${styles.buyImpTagDown}`}>−{fmt.money(displayRentSaving)}/mês</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className={styles.buyCtaBar}>
        <div className={styles.buyCtaSummary}>
          <span>Total</span>
          <strong><small>R$</small>{fmt.noSym(displayTotal)}</strong>
        </div>
        <button
          type="button"
          className={styles.buyConfirmButton}
          disabled={quoteState.status !== 'ok'}
          onClick={proceed}
        >
          Continuar <ArrowRight size={16} />
        </button>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart guard hook (Pages 2 and 3)
// ─────────────────────────────────────────────────────────────────────────────

function useRequiredCart(): FmzTokenPurchaseCart | null {
  const router = useRouter();
  const [cart, setCart] = useState<FmzTokenPurchaseCart | null>(null);

  useEffect(() => {
    const stored = readTokenPurchaseCart();
    if (!stored) {
      router.replace(localizedHref('/connected/tokens-to-purchase-pix'));
      return;
    }
    setCart(stored);
  }, [router]);

  return cart;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 2 — Confirmation
// ─────────────────────────────────────────────────────────────────────────────

export function FmzTenantTokenPurchaseConfirmPage() {
  const router = useRouter();
  const cart   = useRequiredCart();
  const [accepted, setAccepted] = useState(false);

  const proceed = useCallback(() => {
    if (!cart || !accepted) return;
    // Cart already in sessionStorage; navigate to payment page for both PIX and boleto.
    router.push(localizedHref('/connected/tokens-to-purchase-pix/pix'));
  }, [accepted, cart, router]);

  if (!cart) return null;

  const { quote, method } = cart;

  return (
    <main className={styles.page}>
      <BackButton fallback="/connected/tokens-to-purchase-pix" />
      <Stepper active={2} />
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Confirmar compra</p>
          <h1 className={styles.title}>Revise os dados antes de gerar a cobrança</h1>
          <p className={styles.subtitle}>
            Ao confirmar, o backend cria a cobrança no Asaas com os valores
            calculados pelo servidor.
          </p>
        </div>
      </div>

      <div className={styles.confirmGrid}>
        <section>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Pedido</span>
            <div className={styles.orderItem}>
              <span className={styles.cover}><Landmark size={22} /></span>
              <span>
                <strong className={styles.itemName}>
                  {fmt.int(cart.quantity)} tokens{quote.tokenSymbol ? ` ${quote.tokenSymbol}` : ''}
                </strong>
                <span className={styles.itemSub}>
                  Acréscimo de {fmt.pct(cart.deltaPercentage)} pp na participação estimada
                </span>
              </span>
              <strong className={styles.itemPrice}>{fmt.money(quote.subtotal)}</strong>
            </div>
            {/* Breakdown rendered directly from backend response */}
            <div className={styles.breakdown}>
              {quote.breakdown.map((line) => (
                <div
                  key={line.label}
                  className={`${styles.bdRow} ${line.label === 'Total' ? styles.bdTotal : ''}`}
                >
                  <span>{line.label}</span>
                  <strong>{fmt.money(line.amount)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <span className={styles.cardLabel}>Impacto esperado</span>
            <div className={styles.impactRow}>
              <span className={`${styles.ico} ${styles.icoGold}`}><Home size={17} /></span>
              <span className={styles.impactLabel}>Participação</span>
              <span className={styles.before}>{fmt.pct(cart.currentPercentage)}</span>
              <ArrowRight size={14} />
              <strong className={styles.after}>{fmt.pct(cart.newPercentage)}</strong>
            </div>
            <div className={styles.impactRow}>
              <span className={`${styles.ico} ${styles.icoGreen}`}><ReceiptText size={17} /></span>
              <span className={styles.impactLabel}>Aluguel estimado</span>
              <span className={styles.before}>{fmt.money(cart.currentRent)}</span>
              <ArrowRight size={14} />
              <strong className={styles.after}>{fmt.money(cart.newRent)}</strong>
            </div>
            <div className={styles.impactRow}>
              <span className={styles.ico}><Building2 size={17} /></span>
              <span className={styles.impactLabel}>Patrimônio conquistado</span>
              <span className={styles.before}>{fmt.money(cart.currentOwnedValue)}</span>
              <ArrowRight size={14} />
              <strong className={styles.after}>{fmt.money(cart.newOwnedValue)}</strong>
            </div>
          </div>
        </section>

        <aside>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Pagamento</span>
            {method === 'pix' ? (
              <div className={styles.pmChip}>
                <span className={styles.pmIcon}><Zap size={20} /></span>
                <span>
                  <strong className={styles.pmName}>PIX</strong>
                  <span className={styles.pmDesc}>QR Code dinâmico gerado pelo Asaas após confirmação.</span>
                </span>
              </div>
            ) : (
              <div className={styles.pmChip}>
                <span className={styles.pmIcon}><Landmark size={20} /></span>
                <span>
                  <strong className={styles.pmName}>Boleto bancário</strong>
                  <span className={styles.pmDesc}>Linha digitável gerada pelo Asaas. Vence em até 3 dias úteis.</span>
                </span>
              </div>
            )}
          </div>

          <div className={`${styles.card} mt-4`}>
            <label className={`${styles.terms} ${accepted ? styles.termsChecked : ''}`}>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span className={styles.checkmark}>{accepted ? <Check size={13} /> : null}</span>
              <span>
                Li e aceito o contrato de aquisição fracionada, a política de lock-up e os termos de
                uso da plataforma.
              </span>
            </label>
            <ul className={styles.finePrint}>
              <li>Os tokens ficam pendentes até confirmação do pagamento pelo provedor.</li>
              <li>A efetivação on-chain é feita pelo serviço autorizado do contrato.</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className={styles.ctaBar}>
        <div className={styles.ctaSummary}>
          <span className={styles.ctaK}>Total</span>
          <strong className={styles.ctaTotal}>{fmt.money(quote.total)}</strong>
          <span className={styles.ctaMeta}>
            {fmt.int(cart.quantity)} tokens · {method === 'pix' ? 'PIX' : 'Boleto'}
          </span>
        </div>
        <button type="button" className={styles.primary} disabled={!accepted} onClick={proceed}>
          {method === 'pix' ? 'Gerar QR PIX' : 'Gerar boleto'} <ArrowRight size={16} />
        </button>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 3 — Payment (handles both PIX and Boleto)
// ─────────────────────────────────────────────────────────────────────────────

function boletoPaymentHref(paymentTransactionId: string): string {
  return localizedHref(
    `/connected/tokens-to-purchase-pix/payments/${encodeURIComponent(paymentTransactionId)}/boleto`,
  );
}

export function FmzTenantTokenPurchasePixPage() {
  const router  = useRouter();
  const cart    = useRequiredCart();
  const [payment, setPayment] = useState<FmzTokenPurchasePayment | null>(null);
  const [creating, setCreating]   = useState(true);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [isCopied, setIsCopied]   = useState(false);
  const [remainingSecs, setRemaining] = useState(15 * 60);

  // ── Create payment on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!cart) return;
    let mounted = true;

    async function create() {
      setCreating(true);
      setErrorMsg(null);
      try {
        const created = await createTokenPurchasePayment({
          propertyTokenizationId: cart!.propertyTokenizationId,
          quantity:               cart!.quantity,
          paymentMethod:          cart!.method,
          idempotencyKey:         cart!.idempotencyKey,
          propertyId:             cart!.propertyId,
        });
        if (!mounted) return;
        writeTokenPurchasePayment(created);
        // Boleto has its own dedicated page; PIX stays inline on this screen.
        if (cart!.method === 'boleto' && created.paymentTransactionId) {
          router.replace(boletoPaymentHref(created.paymentTransactionId));
          return;
        }
        setPayment(created);
      } catch (error: unknown) {
        if (!mounted) return;
        setErrorMsg(error instanceof Error ? error.message : 'Erro ao gerar a cobrança.');
      } finally {
        if (mounted) setCreating(false);
      }
    }

    void create();
    return () => { mounted = false; };
  }, [cart, router]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!payment || statusIsPaid(payment.status)) return;
    const id = window.setInterval(
      () => setRemaining((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [payment]);

  // ── Status polling ───────────────────────────────────────────────────────
  const paymentTransactionId = payment?.paymentTransactionId ?? null;
  const onConfirmed = useCallback(() => {
    clearTokenPurchaseCart();
    router.push(localizedHref('/connected/tokens-to-purchase-pix/success'));
  }, [router]);

  // Merge late-arriving pix details (e.g. backend recovered them) without losing existing ones.
  const onStatus = useCallback((status: FmzTokenPurchaseStatusResponse) => {
    if (!status.pix) return;
    setPayment((current) => mergePixIntoPayment(current, status.pix));
  }, []);

  const { lastCheckedAt } = usePaymentStatusPolling({
    paymentTransactionId,
    enabled: !!payment && !creating && !errorMsg,
    onConfirmed,
    onStatus,
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const minutes = String(Math.floor(remainingSecs / 60)).padStart(2, '0');
  const seconds = String(remainingSecs % 60).padStart(2, '0');

  const pixCode       = getPixCopyPasteCode(payment);
  const qrImgSrc      = getPixQrCodeImageSrc(payment);
  const pixExpiration = getPixExpiration(payment);

  // This screen renders the PIX experience only — boleto is redirected to its own
  // dedicated page right after the payment is created (see the create effect above).
  const method = cart?.method ?? 'pix';

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1800);
  }, []);

  if (!cart) return null;

  return (
    <main className={`${styles.page} ${styles.narrow}`}>
      <BackButton fallback="/connected/tokens-to-purchase-pix/confirm" />
      <Stepper active={3} />

      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>
            {method === 'pix' ? 'Pagamento PIX' : 'Boleto bancário'}
          </p>
          <h1 className={styles.title}>
            {method === 'pix' ? 'Pague pelo app do seu banco' : 'Pague o boleto no banco ou app'}
          </h1>
          <p className={styles.subtitle}>
            {method === 'pix'
              ? 'Escaneie o QR Code ou copie o código PIX. A confirmação chega via webhook do Asaas.'
              : 'Copie a linha digitável ou baixe o boleto em PDF. Válido por 3 dias úteis.'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className={styles.alert}>
          {errorMsg}
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => {
              setErrorMsg(null);
              setPayment(null);
              setCreating(true);
              void createTokenPurchasePayment({
                propertyTokenizationId: cart.propertyTokenizationId,
                quantity:               cart.quantity,
                paymentMethod:          cart.method,
                idempotencyKey:         cart.idempotencyKey,
                propertyId:             cart.propertyId,
              }).then((p) => {
                writeTokenPurchasePayment(p);
                if (cart.method === 'boleto' && p.paymentTransactionId) {
                  router.replace(boletoPaymentHref(p.paymentTransactionId));
                  return;
                }
                setPayment(p);
              }).catch((e: unknown) => {
                setErrorMsg(e instanceof Error ? e.message : 'Erro ao gerar a cobrança.');
              }).finally(() => setCreating(false));
            }}
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      )}

      <section className={styles.payCard}>
        {/* ── Amount row ── */}
        <div className={styles.amountRow}>
          <div>
            <span className={styles.amountK}>Total</span>
            <div className={styles.amountV}>{fmt.money(cart.quote.total)}</div>
          </div>
          <div className={styles.amountRight}>
            <b>{fmt.int(cart.quantity)} tokens</b>
            {cart.quote.processingFeeAmount > 0 && (
              <><br />Taxa {fmt.money(cart.quote.processingFeeAmount)} ({cart.quote.processingFeePercent}%) inclusa</>
            )}
          </div>
        </div>

        {/* ── Loading state (PIX) ── */}
        {creating && method === 'pix' && (
          <>
            <div className={styles.qrFrame}><Loader2 className={styles.spinner} /></div>
            <p className={styles.statusText}>Gerando cobrança no Asaas…</p>
            <p className={styles.subStatus}>Aguarde, conectando ao provedor de pagamento.</p>
          </>
        )}

        {/* ── Loading state (Boleto) ── */}
        {/* No QR frame / PIX wording — boleto gets its own loading copy, then this
            page redirects to the dedicated boleto page once creation succeeds. */}
        {creating && method === 'boleto' && (
          <div className={styles.boletoGenerating}>
            <Loader2 className={styles.spinner} />
            <p className={styles.statusText}>Gerando boleto bancário...</p>
            <p className={styles.subStatus}>Registrando cobrança no Asaas.</p>
          </div>
        )}

        {/* ── PIX content ── */}
        {!creating && !errorMsg && method === 'pix' && (
          <>
            <div className={styles.qrWrap}>
              {qrImgSrc
                ? <img className={styles.qrImg} alt="QR Code PIX" src={qrImgSrc} />
                : <div className={styles.qrFallback}>QR Code não retornado.<br />Use o código copia e cola abaixo.</div>}
            </div>
            <p className={styles.statusText}>Aguardando pagamento</p>
            <p className={styles.subStatus}>Validade: {minutes}:{seconds}</p>
            {pixExpiration && (
              <p className={styles.subStatus}>
                Expira em: {new Date(pixExpiration).toLocaleString('pt-BR')}
              </p>
            )}
            <div className={styles.copyBlock}>
              <span className={styles.copyCode}>{pixCode || 'Código PIX não disponível'}</span>
              <button
                type="button"
                className={styles.copyBtn}
                disabled={!pixCode}
                onClick={() => void copyToClipboard(pixCode)}
              >
                <Copy size={14} /> {isCopied ? 'Copiado!' : 'Copiar código PIX'}
              </button>
            </div>
            <div className={styles.awaiting}>
              <span className={styles.pulse} />
              <span>
                <b>Verificando automaticamente.</b> Quando o Asaas confirmar o pagamento, você
                será direcionada para a tela de conclusão.
                {lastCheckedAt && (
                  <> · Última verificação: {lastCheckedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                )}
              </span>
            </div>
          </>
        )}

        {/* Boleto is handled on its own dedicated page (redirect happens after
            creation), so this screen only ever renders the PIX flow above. */}
      </section>

      {/* ── Payment metadata ── */}
      {payment && (
        <section className={styles.details}>
          <div className={styles.detRow}>
            <span>Provedor</span>
            <strong>{payment.paymentProvider ?? 'Asaas'}</strong>
          </div>
          <div className={styles.detRow}>
            <span>Referência</span>
            <strong>{payment.externalReference ?? payment.paymentTransactionId ?? '—'}</strong>
          </div>
          <div className={styles.detRow}>
            <span>Status</span>
            <strong>{payment.status ?? 'pending'}</strong>
          </div>
        </section>
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 4 — Success
// ─────────────────────────────────────────────────────────────────────────────

export function FmzTenantTokenPurchaseSuccessPage() {
  const router = useRouter();
  const [cart, setCart]       = useState<FmzTokenPurchaseCart | null>(null);
  const [payment, setPayment] = useState<FmzTokenPurchasePayment | null>(null);

  useEffect(() => {
    const storedCart = readTokenPurchaseCart();
    setCart(storedCart);
    setPayment(readTokenPurchasePayment());
    // Clear cart so a page refresh doesn't re-enter the purchase flow.
    clearTokenPurchaseCart();
  }, []);

  if (!cart) return null;

  const { quote } = cart;
  const nextMilestoneProgress = Math.min(100, (cart.newPercentage / 25) * 100);

  return (
    <main className={styles.page}>
      <section className={styles.successHero}>
        <span className={styles.successBadge}><Sparkles size={14} /> Aquisição registrada</span>
        <h1 className={styles.successTitle}>
          Você comprou <span>{fmt.int(cart.quantity)}</span> tokens
        </h1>
        <p className={styles.successSub}>
          O pagamento foi registrado e os tokens ficam pendentes até a confirmação do provedor e
          a conclusão do fluxo on-chain.
        </p>
      </section>

      <section className={styles.stats}>
        <article className={styles.stat}>
          <div className={styles.statHead}>
            <span className={styles.statIcon}><WalletCards size={17} /></span>
            <span className={styles.statTag}>+tokens</span>
          </div>
          <span className={styles.statLbl}>Tokens adquiridos</span>
          <strong className={styles.statVal}>{fmt.int(cart.quantity)}</strong>
        </article>
        <article className={styles.stat}>
          <div className={styles.statHead}>
            <span className={styles.statIcon}><Home size={17} /></span>
            <span className={styles.statTag}>+{fmt.pct(cart.deltaPercentage)} pp</span>
          </div>
          <span className={styles.statLbl}>Nova posse estimada</span>
          <strong className={styles.statVal}>{fmt.pct(cart.newPercentage)}</strong>
        </article>
        <article className={styles.stat}>
          <div className={styles.statHead}>
            <span className={styles.statIcon}><ReceiptText size={17} /></span>
            <span className={styles.statTag}>economia/mês</span>
          </div>
          <span className={styles.statLbl}>Redução estimada</span>
          <strong className={styles.statVal}>{fmt.noSym(cart.rentSaving)}</strong>
        </article>
      </section>

      <section className={styles.band}>
        <div className={styles.bandContent}>
          <div>
            <p className={styles.eyebrow}>Próxima meta</p>
            <h2 className={styles.bandH}>Você está mais perto de <em>25% de posse</em></h2>
            <p className={styles.bandP}>
              Acompanhe a carteira para ver a atualização da participação, histórico de pagamentos
              e próximos marcos.
            </p>
          </div>
          <div className={styles.darkMeter}>
            <div className={styles.meterHead}>
              <span className={styles.meterLbl}>Progresso até 25%</span>
              <strong className={styles.meterPct}>{fmt.pct(cart.newPercentage)}</strong>
            </div>
            <div className={styles.meterTrack}>
              <div className={styles.meterFill} style={{ width: `${nextMilestoneProgress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.nextGrid}>
        <Link href={localizedHref('/connected/wallet')} className={styles.nextItem}>
          <span className={styles.nextIcon}><WalletCards size={18} /></span>
          <span>
            <span className={styles.nextLbl}>Carteira</span>
            <strong className={styles.nextTitle}>Ver tokens</strong>
            <span className={styles.nextDesc}>Acompanhe saldo e tokens pendentes.</span>
          </span>
        </Link>
        <Link href={localizedHref('/connected/my-contract')} className={styles.nextItem}>
          <span className={styles.nextIcon}><ShieldCheck size={18} /></span>
          <span>
            <span className={styles.nextLbl}>Contrato</span>
            <strong className={styles.nextTitle}>Meu imóvel</strong>
            <span className={styles.nextDesc}>Veja sua relação com o imóvel.</span>
          </span>
        </Link>
        <Link href={localizedHref('/connected/payment-history')} className={styles.nextItem}>
          <span className={styles.nextIcon}><ReceiptText size={18} /></span>
          <span>
            <span className={styles.nextLbl}>Histórico</span>
            <strong className={styles.nextTitle}>Pagamentos</strong>
            <span className={styles.nextDesc}>Consulte cobranças e confirmações.</span>
          </span>
        </Link>
      </section>

      <div className={styles.actions}>
        <Link href={localizedHref('/connected/wallet')} className={styles.primary}>
          Ir para carteira
        </Link>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => router.push(localizedHref('/connected/dashboard'))}
        >
          Voltar ao Dashboard
        </button>
      </div>

      {payment?.externalReference && (
        <p className={`${styles.subtitle} text-center mt-5`}>
          Referência: <strong>{payment.externalReference}</strong>
        </p>
      )}
      {quote.tokenSymbol && (
        <p className={`${styles.subtitle} text-center`}>
          Token: <strong>{quote.tokenSymbol}</strong> · Preço unitário: <strong>{fmt.money(quote.unitPrice)}</strong>
        </p>
      )}
    </main>
  );
}
