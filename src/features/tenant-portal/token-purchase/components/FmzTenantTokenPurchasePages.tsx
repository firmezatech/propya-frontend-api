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
} from '../domain/fmz-token-purchase.types';
import {
  createTokenPurchasePayment,
  getBoletoLinhaDigitavel,
  getPixCopyPasteCode,
  getPixQrCodeImageSrc,
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
    <button type="button" className={styles.back} onClick={() => router.back()}>
      <ArrowLeft size={14} /> Voltar
    </button>
  );
}

// ── Dashboard seed hook ────────────────────────────────────────────────────────

interface CartSeed {
  propertyTokenizationId: string | null;
  propertyId: number | null;
  currentTokens: number;
  totalTokens: number;
  currentRent: number;
  fullRent: number;
  propertyValue: number;
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
    propertyId:
      searchParams.get('propertyId') != null
        ? Number(searchParams.get('propertyId'))
        : dashboard?.property?.id != null ? Number(dashboard.property.id) : null,
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

// ─────────────────────────────────────────────────────────────────────────────
// Page 1 — Token selection
// ─────────────────────────────────────────────────────────────────────────────

export function FmzTenantTokenPurchasePage() {
  const router = useRouter();
  const { seed, loading: seedLoading } = useDashboardSeed();

  const [quantity, setQuantity] = useState(1000);
  const [method, setMethod] = useState<FmzTokenPurchasePaymentMethod>('pix');

  const quoteState = useTokenPurchaseQuote({
    propertyTokenizationId: seed.propertyTokenizationId,
    quantity,
    paymentMethod: method,
    enabled: !seedLoading,
  });

  const quote = quoteState.status === 'ok' ? quoteState.quote : null;

  // Use quote bounds once loaded; fall back to safe defaults during initial load.
  const minQty   = quote?.minQuantity ?? 1000;
  const maxQty   = quote?.maxQuantity ?? 10000;
  const stepSize = 1;

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

  const milestoneProgress = impact
    ? Math.min(100, ((seed.currentTokens + quantity) / 10000) * 100)
    : 0;

  const adjustQuantity = useCallback((next: number) => {
    setQuantity(Math.max(minQty, Math.min(maxQty, next)));
  }, [minQty, maxQty]);

  const proceed = useCallback(() => {
    if (!quote) return;
    const cart = buildTokenPurchaseCart({
      quote,
      method,
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

  const presets = [1000, 2500, 5000, 10000];

  if (!seed.propertyTokenizationId && !seedLoading) {
    return (
      <main className={styles.page}>
        <BackButton />
        <div className={styles.alert}>
          <strong>Imóvel não identificado.</strong> Volte ao dashboard e tente novamente a partir do seu imóvel.
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <BackButton />
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Comprar tokens</p>
          <h1 className={styles.title}>Aumente sua participação no imóvel</h1>
          <p className={styles.subtitle}>
            Escolha quantos tokens deseja adquirir. O preço unitário e a taxa de processamento são
            definidos pela plataforma e exibidos abaixo.
          </p>
        </div>
        <div className={styles.chip}>
          <WalletCards size={22} />
          <div>
            <span className={styles.chipK}>Preço do token</span>
            <span className={styles.chipV}>
              {quote ? fmt.money(quote.unitPrice) : <Loader2 size={14} className={styles.spinnerInline} />}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Quantity input ── */}
        <section className={`${styles.card} ${styles.inputCard}`}>
          <span className={styles.cardLabel}>Quantidade</span>
          <div className={styles.tokenInput}>
            <button
              type="button"
              className={styles.stepBtn}
              disabled={quantity <= minQty}
              onClick={() => adjustQuantity(quantity - stepSize)}
            >−</button>
            <div className={styles.tokenDisplay}>
              <strong className={styles.tokenNumber}>{fmt.int(quantity)}</strong>
              <span className={styles.tokenLabel}>tokens</span>
            </div>
            <button
              type="button"
              className={styles.stepBtn}
              disabled={quantity >= maxQty}
              onClick={() => adjustQuantity(quantity + stepSize)}
            >+</button>
          </div>

          {/* Price summary from backend quote */}
          <div className={styles.costLine}>
            {quoteState.status === 'loading' && (
              <><Loader2 size={14} className={styles.spinnerInline} /> Calculando…</>
            )}
            {quoteState.status === 'ok' && (
              <>Total <strong>{fmt.money(quote?.total)}</strong></>
            )}
            {quoteState.status === 'error' && (
              <span className={styles.quoteError}>{quoteState.message}</span>
            )}
          </div>

          <div className={styles.presets}>
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.preset} ${quantity === p ? styles.presetActive : ''}`}
                onClick={() => adjustQuantity(p)}
              >
                {fmt.int(p)}
                {quote && <span className={styles.presetSub}>{fmt.money(p * quote.unitPrice)}</span>}
              </button>
            ))}
          </div>

          <input
            className={styles.slider}
            type="range"
            min={minQty}
            max={maxQty}
            step={stepSize}
            value={quantity}
            onChange={(e) => adjustQuantity(Number(e.target.value))}
          />
          <div className={styles.sliderLabels}>
            <span>{fmt.int(minQty)}</span>
            <span>{fmt.int(maxQty)}</span>
          </div>

          {/* Price breakdown (rendered directly from backend breakdown array) */}
          {quote && quote.breakdown.length > 0 && (
            <div className={styles.breakdown}>
              {quote.breakdown.map((line) => (
                <div key={line.label} className={styles.bdRow}>
                  <span>{line.label}</span>
                  <strong>{fmt.money(line.amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside>
          {/* ── Impact projections ── */}
          {impact && (
            <section className={styles.card}>
              <span className={styles.cardLabel}>Impacto da compra</span>
              <div className={styles.impactRow}>
                <span className={`${styles.ico} ${styles.icoGold}`}><Home size={17} /></span>
                <span className={styles.impactLabel}>Sua posse<small>Percentual no imóvel</small></span>
                <span className={styles.before}>{fmt.pct(impact.currentPercentage)}</span>
                <ArrowRight size={14} />
                <strong className={styles.after}>
                  {fmt.pct(impact.newPercentage)}
                  <span className={styles.delta}>+{fmt.pct(impact.deltaPercentage)} pp</span>
                </strong>
              </div>
              <div className={styles.impactRow}>
                <span className={`${styles.ico} ${styles.icoGreen}`}><ReceiptText size={17} /></span>
                <span className={styles.impactLabel}>Aluguel estimado<small>Após confirmação</small></span>
                <span className={styles.before}>{fmt.money(impact.currentRent)}</span>
                <ArrowRight size={14} />
                <strong className={styles.after}>
                  {fmt.money(impact.newRent)}
                  <span className={styles.delta}>−{fmt.money(impact.rentSaving)}</span>
                </strong>
              </div>
              <div className={styles.impactRow}>
                <span className={styles.ico}><Building2 size={17} /></span>
                <span className={styles.impactLabel}>Valor conquistado<small>Equivalente em patrimônio</small></span>
                <span className={styles.before}>{fmt.money(impact.currentOwnedValue)}</span>
                <ArrowRight size={14} />
                <strong className={styles.after}>{fmt.money(impact.newOwnedValue)}</strong>
              </div>
              <div className={styles.milestone}>
                <div className={styles.milestoneHead}>
                  <span>Meta de 10%</span>
                  <span>{fmt.int(seed.currentTokens + quantity)} tokens</span>
                </div>
                <div className={styles.track}><div className={styles.fill} style={{ width: `${milestoneProgress}%` }} /></div>
                <p className={styles.milestoneFoot}>
                  {impact.toMilestone > 0
                    ? <>Faltam <strong>{fmt.int(impact.toMilestone)} tokens</strong> para 10%.</>
                    : <strong>Meta de 10% atingida ou ultrapassada.</strong>}
                </p>
              </div>
            </section>
          )}

          {/* ── Payment method ── */}
          <section className={`${styles.card} mt-4`}>
            <span className={styles.cardLabel}>Forma de pagamento</span>
            <div className={styles.paymentOptions}>
              <button
                type="button"
                className={`${styles.paymentOpt} ${method === 'pix' ? styles.paymentOptActive : ''}`}
                onClick={() => setMethod('pix')}
              >
                <span className={styles.radio} />
                <span>
                  <span className={styles.payName}>PIX <span className={styles.tag}>instantâneo</span></span>
                  <span className={styles.payDesc}>QR Code dinâmico gerado pelo backend (Asaas).</span>
                </span>
              </button>
              <button
                type="button"
                className={`${styles.paymentOpt} ${method === 'boleto' ? styles.paymentOptActive : ''}`}
                onClick={() => setMethod('boleto')}
              >
                <span className={styles.radio} />
                <span>
                  <span className={styles.payName}>Boleto</span>
                  <span className={styles.payDesc}>Compensação bancária em até 3 dias úteis.</span>
                </span>
              </button>
            </div>
          </section>
        </aside>
      </div>

      <div className={styles.ctaBar}>
        <div className={styles.ctaSummary}>
          <span className={styles.ctaK}>Resumo</span>
          {quoteState.status === 'ok' && quote ? (
            <>
              <strong className={styles.ctaTotal}>{fmt.money(quote.total)}</strong>
              <span className={styles.ctaMeta}>
                {fmt.int(quantity)} tokens
                {quote.processingFeeAmount > 0 && ` · taxa ${fmt.money(quote.processingFeeAmount)} (${quote.processingFeePercent}%)`}
              </span>
            </>
          ) : (
            <span className={styles.ctaTotal}><Loader2 size={16} className={styles.spinnerInline} /></span>
          )}
        </div>
        <button
          type="button"
          className={styles.primary}
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
  // Note: status updates arrive primarily via webhook. Polling is a UI safety
  // net — it will not find updates before the webhook fires, but handles the
  // case where the user keeps the tab open after the webhook has been processed.
  // No polling endpoint exists yet; once added, replace the no-op here.

  // ── Helpers ──────────────────────────────────────────────────────────────
  const minutes = String(Math.floor(remainingSecs / 60)).padStart(2, '0');
  const seconds = String(remainingSecs % 60).padStart(2, '0');

  const pixCode  = getPixCopyPasteCode(payment);
  const qrImgSrc = getPixQrCodeImageSrc(payment);
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
                <b>Aguardando compensação.</b> A confirmação chega via webhook em até 3 dias úteis.
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
