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
  Download,
  Home,
  Landmark,
  Loader2,
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
  writeTokenPurchaseCart,
} from '../domain/fmz-token-purchase-cart';
import type {
  FmzTokenPurchaseCart,
  FmzTokenPurchasePayment,
  FmzTokenPurchasePaymentMethod,
  FmzTokenPurchaseQuote,
  FmzTokenPurchaseStatusResponse,
} from '../domain/fmz-token-purchase.types';
import {
  createTokenPurchasePayment,
  fetchTokenPurchaseStatus,
  getBoletoLinhaDigitavel,
  getPixCopyPasteCode,
  getPixExpiration,
  getPixQrCodeImageSrc,
  mergePixIntoPayment,
  statusIsPaid,
} from '../services/fmz-token-purchase-api';
import { fetchTokenPurchaseQuote } from '../services/fmz-token-purchase-api';
import { getCurrentTenantDashboard } from '../../services';
import type { FmzTenantDashboard } from '../../domain';

// ── Formatters ─────────────────────────────────────────────────────────────────

const moneyFmt     = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moneyNoSymFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFmt       = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const pctFmt       = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const fmt = {
  money:    (v: number | null | undefined) => moneyFmt.format(Number(v ?? 0)),
  noSym:    (v: number | null | undefined) => moneyNoSymFmt.format(Number(v ?? 0)),
  int:      (v: number | null | undefined) => intFmt.format(Number(v ?? 0)),
  pct:      (v: number | null | undefined) => `${pctFmt.format(Number(v ?? 0))}%`,
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

// ── Dashboard seed hook ────────────────────────────────────────────────────────

interface CartSeed {
  propertyTokenizationId: string | null;
  propertyId: string | null;
  currentTokens: number;
  totalTokens: number;
  currentRent: number;
  fullRent: number;
  propertyValue: number;
  propertyLabel: string;
  tokenSymbol: string;
}

function useDashboardSeed(): { seed: CartSeed; loading: boolean } {
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<FmzTenantDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const propertyId = searchParams.get('propertyId');
    void getCurrentTenantDashboard(propertyId)
      .then((data) => { if (mounted) setDashboard(data); })
      .catch(() => { if (mounted) setDashboard(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [searchParams]);

  const seed: CartSeed = {
    propertyTokenizationId:
      searchParams.get('propertyTokenizationId')
      ?? (dashboard?.ownership as Record<string, unknown> | undefined | null)?.['propertyTokenizationId'] as string | null
      ?? null,
    propertyId: searchParams.get('propertyId') ?? (dashboard?.property?.id != null ? String(dashboard.property.id) : null),
    currentTokens: Number(dashboard?.ownership?.tokenBalance ?? 0),
    totalTokens:   Number(dashboard?.ownership?.totalSupply  ?? 0),
    currentRent:   Number(
      (dashboard?.contract as Record<string, unknown> | undefined | null)?.['currentRentAmount']
      ?? (dashboard as Record<string, unknown> | undefined | null)?.['monthlySummary']
      ?? 0,
    ),
    fullRent:      Number(
      (dashboard?.contract as Record<string, unknown> | undefined | null)?.['baseMonthlyRent']
      ?? 0,
    ),
    propertyValue: Number(dashboard?.ownership?.totalPropertyValue ?? dashboard?.property?.appraisedValue ?? 0),
    propertyLabel:
      searchParams.get('propertyLabel')
      ?? dashboard?.property?.name
      ?? dashboard?.property?.code
      ?? dashboard?.property?.description
      ?? 'Apto 54 Vila Madalena',
    tokenSymbol: searchParams.get('tokenSymbol') ?? 'FT-0412',
  };

  return { seed, loading };
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
  paymentMethod,
  enabled,
}: {
  propertyTokenizationId: string | null;
  quantity: number;
  paymentMethod: FmzTokenPurchasePaymentMethod;
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
      void fetchTokenPurchaseQuote({ propertyTokenizationId, quantity, paymentMethod })
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
  }, [propertyTokenizationId, quantity, paymentMethod, enabled]);

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
  const { seed, loading: seedLoading } = useDashboardSeed();

  const [quantity, setQuantity] = useState(5000);
  const [method, setMethod] = useState<FmzTokenPurchasePaymentMethod>('pix');

  const quoteState = useTokenPurchaseQuote({
    propertyTokenizationId: seed.propertyTokenizationId,
    quantity,
    paymentMethod: method,
    enabled: !seedLoading,
  });

  const quote = quoteState.status === 'ok' ? quoteState.quote : null;

  const minQty = quote?.minQuantity ?? 1000;
  const availableBySeed = Math.max(seed.totalTokens - seed.currentTokens, 0);
  const maxQty = quote?.maxQuantity ?? (availableBySeed > 0 ? availableBySeed : 92800);
  const stepperSize = 1000;
  const sliderStep = 100;
  const totalTokens = seed.totalTokens > 0 ? seed.totalTokens : 100000;
  const currentTokens = seed.currentTokens > 0 ? seed.currentTokens : 7200;
  const currentPct = totalTokens > 0 ? (currentTokens / totalTokens) * 100 : 0;
  const availableTokens = Math.max(totalTokens - currentTokens, 0);
  const remainingAfterSelection = Math.max(availableTokens - quantity, 0);
  const ownedWidth = totalTokens > 0 ? Math.min(100, (currentTokens / totalTokens) * 100) : 0;
  const selectedWidth = totalTokens > 0 ? Math.min(100 - ownedWidth, (quantity / totalTokens) * 100) : 0;

  const impact = quote
    ? calculateImpactProjection({
        currentTokens:    seed.currentTokens,
        purchaseQuantity: quantity,
        totalTokens:      seed.totalTokens,
        currentRent:      seed.currentRent,
        fullRent:         seed.fullRent,
        propertyValue:    seed.propertyValue,
      })
    : null;

  const nextGoalTokens = 10000;
  const milestoneProgress = Math.min(100, ((currentTokens + quantity) / nextGoalTokens) * 100);

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
      propertyId:    seed.propertyId,
      currentTokens: seed.currentTokens,
      totalTokens:   seed.totalTokens,
      currentRent:   seed.currentRent,
      fullRent:      seed.fullRent,
      propertyValue: seed.propertyValue,
    });
    writeTokenPurchaseCart(cart);
    router.push(localizedHref('/connected/tokens-to-purchase-pix/confirm'));
  }, [quote, method, seed, router]);

  const presetOptions = [
    { tokens: 1000, label: 'mínimo' },
    { tokens: Math.max(1000, nextGoalTokens - currentTokens), label: 'Meta 10%' },
    { tokens: 5000, label: 'recomendado' },
    { tokens: 10000, label: '+1 pp' },
  ];

  const processingFeeRate = quote?.processingFeePercent ?? 7.5;
  const processingFee = quote?.processingFeeAmount ?? 0;
  const purchaseTotal = quote?.total ?? 0;
  const unitPrice = quote?.unitPrice ?? 1;
  const inlineCost = quote ? quote.total : quantity * unitPrice * (1 + processingFeeRate / 100);
  const futureTokens = currentTokens + quantity;
  const deltaPct = totalTokens > 0 ? (quantity / totalTokens) * 100 : 0;
  const formatPercentagePoints = (value: number) => pctFmt.format(Number(value ?? 0));

  if (!seed.propertyTokenizationId && !seedLoading) {
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
        <ArrowLeft size={14} />
        Voltar ao dashboard
      </button>

      <div className={styles.buyHeader}>
        <div>
          <p className={styles.buySup}>Tokens · {seed.propertyLabel}</p>
          <h1 className={styles.buyTitle}>Comprar tokens</h1>
          <p className={styles.buySub}>
            <span>
              Você é dona de <strong>{fmt.pct(currentPct)}</strong> · próxima meta 10%
            </span>
            <span className={styles.buyPill}><span />Promoção mai/26 · taxa zero</span>
          </p>
        </div>
      </div>

      <section className={styles.buyCols}>
        <section className={`${styles.buyCard} ${styles.buyInputCard}`}>
          <span className={styles.buyCardEyebrow}>Quantos tokens quer comprar?</span>

          <div className={styles.buyAvail}>
            <div className={styles.buyAvailTop}>
              <span className={styles.buyAvailLabel}><span />Disponíveis para compra</span>
              <span className={styles.buyAvailNum}>
                <strong>{fmt.int(availableTokens || maxQty)}</strong> de {fmt.int(totalTokens)} <span>{seed.tokenSymbol}</span>
              </span>
            </div>
            <div className={styles.buyAvailBar}>
              <div className={styles.buyAvailOwned} style={{ width: `${ownedWidth}%` }} title="Já em circulação" />
              <div className={styles.buyAvailSelected} style={{ width: `${selectedWidth}%` }} title="Sua seleção" />
            </div>
            <div className={styles.buyAvailLegend}>
              <span><i className={styles.buyLegendOwned} />Em circulação <strong>{fmt.int(currentTokens)}</strong></span>
              <span><i className={styles.buyLegendSelected} />Sua seleção <strong>{fmt.int(quantity)}</strong></span>
              <span><i className={styles.buyLegendFree} />Restante <strong>{fmt.int(remainingAfterSelection)}</strong></span>
            </div>
          </div>

          <div className={styles.buyTokenInput}>
            <button
              type="button"
              className={styles.buyTokenStep}
              disabled={quantity <= minQty}
              onClick={() => adjustQuantity(quantity - stepperSize)}
              aria-label="Diminuir 1.000"
            >−</button>
            <div className={styles.buyTokenDisplay}>
              <strong>{fmt.int(quantity)}</strong>
              <span>{quantity === 1 ? 'token' : 'tokens'} · <b>{seed.tokenSymbol}</b></span>
            </div>
            <button
              type="button"
              className={styles.buyTokenStep}
              disabled={quantity >= maxQty}
              onClick={() => adjustQuantity(quantity + stepperSize)}
              aria-label="Aumentar 1.000"
            >+</button>
          </div>

          <div className={styles.buyCostLine}>
            {quoteState.status === 'loading' && (
              <><Loader2 size={14} className={styles.spinnerInline} /> Calculando…</>
            )}
            {quoteState.status === 'ok' && quote && (
              <>
                <span>Valor a pagar</span>
                <strong>{fmt.money(quote.total)}</strong>
                <small>· inclui taxa de {quote.processingFeePercent}%</small>
              </>
            )}
            {quoteState.status === 'idle' && (
              <>
                <span>Valor a pagar</span>
                <strong>{fmt.money(inlineCost)}</strong>
                <small>· inclui taxa de {processingFeeRate}%</small>
              </>
            )}
            {quoteState.status === 'error' && <span className={styles.quoteError}>{quoteState.message}</span>}
          </div>

          <div className={styles.buyPresets}>
            {presetOptions.map((preset) => (
              <button
                key={`${preset.tokens}-${preset.label}`}
                type="button"
                className={`${styles.buyPreset} ${quantity === preset.tokens ? styles.buyPresetActive : ''}`}
                onClick={() => adjustQuantity(preset.tokens)}
                disabled={preset.tokens > maxQty}
              >
                <strong>{fmt.int(preset.tokens)}</strong>
                {preset.label === 'Meta 10%' ? <span className={styles.buyGoldTag}>{preset.label}</span> : <span>{preset.label}</span>}
              </button>
            ))}
          </div>

          <div className={styles.buySliderWrap}>
            <input
              className={styles.buySlider}
              type="range"
              min={minQty}
              max={maxQty}
              step={sliderStep}
              value={Math.min(maxQty, quantity)}
              onChange={(e) => adjustQuantity(Number(e.target.value))}
            />
            <div className={styles.buySliderLabels}>
              <span>{fmt.int(minQty)}</span>
              <span>{fmt.int(Math.round((minQty + maxQty) / 2))}</span>
              <span>{fmt.int(maxQty)}</span>
            </div>
          </div>
        </section>

        <section className={styles.buyCard}>
          <span className={styles.buyCardEyebrow}>Veja o impacto da sua compra</span>

          <div className={styles.buyImpactRow}>
            <span className={`${styles.buyImpactIcon} ${styles.buyImpactGold}`}><Sparkles size={16} /></span>
            <span className={styles.buyImpactLabel}>Sua posse no imóvel<small>Tokens {seed.tokenSymbol} / {fmt.int(totalTokens)} total</small></span>
            <span className={styles.buyBefore}>{fmt.pct(currentPct)}</span>
            <ArrowRight size={13} className={styles.buyImpactArrow} />
            <strong className={`${styles.buyAfter} ${styles.buyAfterGold}`}>
              {impact ? fmt.pct(impact.newPercentage) : fmt.pct(currentPct + deltaPct)}
              <span>{impact ? `+${formatPercentagePoints(impact.deltaPercentage)} pp` : `+${formatPercentagePoints(deltaPct)} pp`}</span>
            </strong>
          </div>

          <div className={styles.buyImpactRow}>
            <span className={`${styles.buyImpactIcon} ${styles.buyImpactGreen}`}><Landmark size={16} /></span>
            <span className={styles.buyImpactLabel}>Aluguel mensal<small>Após desconto por tokens</small></span>
            <span className={styles.buyBefore}>{fmt.money(seed.currentRent)}</span>
            <ArrowRight size={13} className={styles.buyImpactArrow} />
            <strong className={`${styles.buyAfter} ${styles.buyAfterGreen}`}>
              {impact ? fmt.money(impact.newRent) : fmt.money(seed.currentRent)}
              {impact && <span>−{fmt.money(impact.rentSaving)}</span>}
            </strong>
          </div>

          <div className={styles.buyImpactRow}>
            <span className={styles.buyImpactIcon}><WalletCards size={16} /></span>
            <span className={styles.buyImpactLabel}>Sua fatia em R$<small>Valor de mercado da sua participação</small></span>
            <span className={styles.buyBefore}>{impact ? fmt.money(impact.currentOwnedValue) : fmt.money(0)}</span>
            <ArrowRight size={13} className={styles.buyImpactArrow} />
            <strong className={styles.buyAfter}>{impact ? fmt.money(impact.newOwnedValue) : fmt.money(0)}</strong>
          </div>

          <div className={styles.buyMilestone}>
            <div className={styles.buyMilestoneHead}>
              <span>Progresso até a próxima meta (10%)</span>
              <strong>{fmt.int(futureTokens)}/{fmt.int(nextGoalTokens)} tokens</strong>
            </div>
            <div className={styles.buyMilestoneTrack}><div style={{ width: `${milestoneProgress}%` }} /></div>
            <p>
              {futureTokens >= nextGoalTokens
                ? <><strong>Meta 10% ultrapassada</strong> — próxima recompensa em 25% de posse.</>
                : <>Faltam <strong>{fmt.int(nextGoalTokens - futureTokens)} tokens</strong> para alcançar 10%.</>}
            </p>
          </div>
        </section>
      </section>

      <section className={`${styles.buyCard} ${styles.buyPaymentCard}`}>
        <span className={styles.buyCardEyebrow}>Forma de pagamento</span>
        <div className={styles.buyPaymentOptions}>
          <button
            type="button"
            className={`${styles.buyPaymentOpt} ${method === 'pix' ? styles.buyPaymentActive : ''}`}
            onClick={() => setMethod('pix')}
          >
            <span className={styles.buyRadio} />
            <span className={`${styles.buyPaymentIcon} ${styles.buyPixIcon}`}><Zap size={16} /></span>
            <span className={styles.buyPaymentBody}>
              <span>PIX <b>Recomendado</b></span>
              <small>Confirmação imediata · tokens creditados em segundos</small>
            </span>
          </button>

          <button
            type="button"
            className={`${styles.buyPaymentOpt} ${method === 'boleto' ? styles.buyPaymentActive : ''}`}
            onClick={() => setMethod('boleto')}
          >
            <span className={styles.buyRadio} />
            <span className={styles.buyPaymentIcon}><ReceiptText size={16} /></span>
            <span className={styles.buyPaymentBody}>
              <span>Boleto bancário</span>
              <small>Geramos um boleto agora · compensação em até 2 dias úteis</small>
            </span>
          </button>
        </div>
      </section>

      <div className={styles.buyCtaBar}>
        <div className={styles.buyCtaSummary}>
          <span>Total</span>
          <div>
            {quoteState.status === 'ok' && quote ? (
              <>
                <strong><small>R$</small>{fmt.noSym(purchaseTotal)}</strong>
                <em>
                  <b>{fmt.int(quantity)} tokens</b>
                  {processingFee > 0 && ` · taxa ${fmt.money(processingFee)}`}
                  {' · paga via '}
                  <b>{method.toUpperCase()}</b>
                </em>
              </>
            ) : (
              <>
                <strong><small>R$</small>{fmt.noSym(inlineCost)}</strong>
                <em><b>{fmt.int(quantity)} tokens</b> · paga via <b>{method.toUpperCase()}</b></em>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          className={styles.buyConfirmButton}
          disabled={quoteState.status !== 'ok'}
          onClick={proceed}
        >
          <Check size={16} />
          Confirmar compra
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

const PAYMENT_SESSION_KEY = 'firmeza:tenant-token-purchase-payment';

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
        setPayment(created);
        window.sessionStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(created));
      } catch (error: unknown) {
        if (!mounted) return;
        setErrorMsg(error instanceof Error ? error.message : 'Erro ao gerar a cobrança.');
      } finally {
        if (mounted) setCreating(false);
      }
    }

    void create();
    return () => { mounted = false; };
  }, [cart]);

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
  const boletoCode     = getBoletoLinhaDigitavel(payment);
  const boletoDownload = payment?.boleto?.downloadUrl ?? payment?.boleto?.boletoUrl ?? null;

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
                setPayment(p);
                window.sessionStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(p));
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

        {/* ── Loading state ── */}
        {creating && (
          <>
            <div className={styles.qrFrame}><Loader2 className={styles.spinner} /></div>
            <p className={styles.statusText}>Gerando cobrança no Asaas…</p>
            <p className={styles.subStatus}>Aguarde, conectando ao provedor de pagamento.</p>
          </>
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

        {/* ── Boleto content ── */}
        {!creating && !errorMsg && method === 'boleto' && (
          <>
            <p className={styles.statusText}>Boleto gerado com sucesso</p>
            {boletoCode && (
              <div className={styles.copyBlock}>
                <span className={styles.copyCode}>{boletoCode}</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => void copyToClipboard(boletoCode)}
                >
                  <Copy size={14} /> {isCopied ? 'Copiado!' : 'Copiar linha digitável'}
                </button>
              </div>
            )}
            {boletoDownload && (
              <a href={boletoDownload} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                <Download size={14} /> Baixar boleto em PDF
              </a>
            )}
            {payment?.boleto?.dueAt && (
              <p className={styles.subStatus}>
                Vencimento: {new Date(payment.boleto.dueAt).toLocaleDateString('pt-BR')}
              </p>
            )}
            <div className={styles.awaiting}>
              <span className={styles.pulse} />
              <span>
                <b>Aguardando compensação.</b> A confirmação chega em até 3 dias úteis.
                {lastCheckedAt && (
                  <> · Última verificação: {lastCheckedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                )}
              </span>
            </div>
          </>
        )}
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
    try {
      const raw = window.sessionStorage.getItem(PAYMENT_SESSION_KEY);
      setPayment(raw ? (JSON.parse(raw) as FmzTokenPurchasePayment) : null);
    } catch {
      setPayment(null);
    }
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
