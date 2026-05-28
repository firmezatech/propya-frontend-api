'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, Check, Copy, CreditCard, Home, Landmark, Loader2, ReceiptText, ShieldCheck, Sparkles, WalletCards, Zap } from 'lucide-react';
import styles from './FmzTenantTokenPurchase.module.css';
import {
  MAX_TOKEN_PURCHASE,
  MIN_TOKEN_PURCHASE,
  TOKEN_PURCHASE_STEP,
  calculateTokenPurchaseCart,
  readTokenPurchaseCart,
  writeTokenPurchaseCart,
} from '../domain/fmz-token-purchase-cart';
import type { FmzTokenPurchaseCart, FmzTokenPurchasePayment, FmzTokenPurchasePaymentMethod } from '../domain/fmz-token-purchase.types';
import { createTenantTokenPixPayment, getTenantTokenPaymentStatus } from '../services/fmz-token-purchase-api';
import { getCurrentTenantDashboard } from '../../tenant-portal/services';
import type { FmzTenantDashboard } from '../../tenant-portal/domain';

const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moneyNoSymbolFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatMoney(value: number | null | undefined): string {
  return moneyFormatter.format(Number(value ?? 0));
}

function formatMoneyNoSymbol(value: number | null | undefined): string {
  return moneyNoSymbolFormatter.format(Number(value ?? 0));
}

function formatInteger(value: number | null | undefined): string {
  return integerFormatter.format(Number(value ?? 0));
}

function formatPercent(value: number | null | undefined): string {
  return `${percentFormatter.format(Number(value ?? 0))}%`;
}

function getLocalizedHref(path: string): string {
  if (typeof window === 'undefined') return path;
  const locale = window.location.pathname.split('/').filter(Boolean)[0] || 'pt';
  return `/${locale}${path}`;
}

function getPaymentImageSrc(payment: FmzTokenPurchasePayment | null): string | null {
  const raw = payment?.pixQrCodeImage || payment?.encodedImage || payment?.pixQrCode;
  if (!raw) return null;
  if (raw.startsWith('data:image')) return raw;
  if (raw.startsWith('http')) return raw;
  if (raw.length > 120) return `data:image/png;base64,${raw}`;
  return null;
}

function getPaymentCopyPaste(payment: FmzTokenPurchasePayment | null): string {
  return payment?.pixCopyPaste || payment?.payload || payment?.pixQrCode || '';
}

function statusIsPaid(status?: string | null): boolean {
  return ['paid', 'received', 'confirmed', 'confirmed_onchain', 'completed'].includes(String(status ?? '').toLowerCase());
}

function Stepper({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className={styles.steps} aria-label="Etapas da compra">
      <span className={`${styles.step} ${active > 1 ? styles.stepDone : styles.stepActive}`}><span className={styles.dot}>{active > 1 ? <Check size={12} /> : '1'}</span> Escolha</span>
      <span className={styles.bar} />
      <span className={`${styles.step} ${active > 2 ? styles.stepDone : active === 2 ? styles.stepActive : ''}`}><span className={styles.dot}>{active > 2 ? <Check size={12} /> : '2'}</span> Confirmação</span>
      <span className={styles.bar} />
      <span className={`${styles.step} ${active === 3 ? styles.stepActive : ''}`}><span className={styles.dot}>3</span> Pagamento</span>
    </div>
  );
}

function PageBackButton({ fallback = '/connected/dashboard' }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button type="button" className={styles.back} onClick={() => router.back()}>
      <ArrowLeft size={14} /> Voltar
    </button>
  );
}

function useTenantCartSeed() {
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<FmzTenantDashboard | null>(null);

  useEffect(() => {
    let mounted = true;
    const propertyId = searchParams.get('propertyId');

    async function loadDashboard() {
      try {
        const data = await getCurrentTenantDashboard(propertyId);
        if (mounted) setDashboard(data);
      } catch {
        if (mounted) setDashboard(null);
      }
    }

    void loadDashboard();
    return () => { mounted = false; };
  }, [searchParams]);

  return useMemo(() => {
    const propertyIdFromUrl = searchParams.get('propertyId');
    const rentChargeIdFromUrl = searchParams.get('rentChargeId');
    const propertyIdFromDashboard = dashboard?.property?.id;
    const propertyId = propertyIdFromUrl ? Number(propertyIdFromUrl) : propertyIdFromDashboard != null ? Number(propertyIdFromDashboard) : null;
    const currentTokens = Number(dashboard?.ownership?.tokenBalance ?? 7200);
    const totalTokens = Number(dashboard?.ownership?.totalSupply ?? 100000);
    const currentRent = Number(dashboard?.contract?.currentRentAmount ?? dashboard?.rentInsight?.discountedRentAmount ?? dashboard?.monthlySummary?.discountedRentAmount ?? 792.62);
    const fullRent = Number(dashboard?.contract?.baseMonthlyRent ?? dashboard?.rentInsight?.baseRentAmount ?? dashboard?.monthlySummary?.baseRentAmount ?? 854);
    const propertyValue = Number(dashboard?.ownership?.totalPropertyValue ?? dashboard?.property?.appraisedValue ?? 854000);
    const rentChargeId = rentChargeIdFromUrl || dashboard?.boleto?.rentChargeId || dashboard?.monthlySummary?.rentChargeId || null;

    return { propertyId, rentChargeId, currentTokens, totalTokens, currentRent, fullRent, propertyValue };
  }, [dashboard, searchParams]);
}

export function FmzTenantTokenPurchasePage() {
  const router = useRouter();
  const seed = useTenantCartSeed();
  const [tokens, setTokens] = useState(5000);
  const [method, setMethod] = useState<FmzTokenPurchasePaymentMethod>('pix');

  const cart = useMemo(() => calculateTokenPurchaseCart({ tokens, method, ...seed }), [tokens, method, seed]);
  const milestoneProgress = Math.min(100, ((cart.currentTokens + cart.tokens) / 10000) * 100);

  const setTokenValue = useCallback((next: number) => {
    const stepped = Math.round(next / TOKEN_PURCHASE_STEP) * TOKEN_PURCHASE_STEP;
    setTokens(Math.max(MIN_TOKEN_PURCHASE, Math.min(MAX_TOKEN_PURCHASE, stepped)));
  }, []);

  const proceed = useCallback(() => {
    writeTokenPurchaseCart(cart);
    router.push(getLocalizedHref('/connected/tokensToPurchasePix/confirm'));
  }, [cart, router]);

  const presets = [1000, 5000, 10000, 25000];

  return (
    <main className={styles.page}>
      <PageBackButton />
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Comprar tokens</p>
          <h1 className={styles.title}>Aumente sua participação no imóvel</h1>
          <p className={styles.subtitle}>Escolha quantos tokens deseja comprar. O valor final já considera a taxa administrativa da plataforma.</p>
        </div>
        <div className={styles.chip}>
          <WalletCards size={22} />
          <div><span className={styles.chipK}>Preço do token</span><span className={styles.chipV}>R$ 1,00</span></div>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.inputCard}`}>
          <span className={styles.cardLabel}>Quantidade</span>
          <div className={styles.tokenInput}>
            <button type="button" className={styles.stepBtn} disabled={tokens <= MIN_TOKEN_PURCHASE} onClick={() => setTokenValue(tokens - TOKEN_PURCHASE_STEP)}>-</button>
            <div className={styles.tokenDisplay}>
              <strong className={styles.tokenNumber}>{formatInteger(tokens)}</strong>
              <span className={styles.tokenLabel}>tokens</span>
            </div>
            <button type="button" className={styles.stepBtn} disabled={tokens >= MAX_TOKEN_PURCHASE} onClick={() => setTokenValue(tokens + TOKEN_PURCHASE_STEP)}>+</button>
          </div>
          <div className={styles.costLine}>Total estimado <strong>{formatMoney(cart.total)}</strong></div>
          <div className={styles.presets}>
            {presets.map((preset) => (
              <button key={preset} type="button" className={`${styles.preset} ${tokens === preset ? styles.presetActive : ''}`} onClick={() => setTokenValue(preset)}>
                {formatInteger(preset)}<span className={styles.presetSub}>{formatMoney(preset)}</span>
              </button>
            ))}
          </div>
          <input className={styles.slider} type="range" min={MIN_TOKEN_PURCHASE} max={MAX_TOKEN_PURCHASE} step={TOKEN_PURCHASE_STEP} value={tokens} onChange={(event) => setTokenValue(Number(event.target.value))} />
          <div className={styles.sliderLabels}><span>{formatInteger(MIN_TOKEN_PURCHASE)}</span><span>{formatInteger(MAX_TOKEN_PURCHASE)}</span></div>
        </section>

        <aside>
          <section className={styles.card}>
            <span className={styles.cardLabel}>Impacto da compra</span>
            <div className={styles.impactRow}><span className={`${styles.ico} ${styles.icoGold}`}><Home size={17} /></span><span className={styles.impactLabel}>Sua posse<small>Percentual no imóvel</small></span><span className={styles.before}>{formatPercent(cart.currentPercentage)}</span><ArrowRight size={14} /><strong className={styles.after}>{formatPercent(cart.newPercentage)}<span className={styles.delta}>+{formatPercent(cart.deltaPercentage)} pp</span></strong></div>
            <div className={styles.impactRow}><span className={`${styles.ico} ${styles.icoGreen}`}><ReceiptText size={17} /></span><span className={styles.impactLabel}>Aluguel estimado<small>Após a confirmação</small></span><span className={styles.before}>{formatMoney(cart.currentRent)}</span><ArrowRight size={14} /><strong className={styles.after}>{formatMoney(cart.newRent)}<span className={styles.delta}>−{formatMoney(cart.rentSaving)}</span></strong></div>
            <div className={styles.impactRow}><span className={styles.ico}><Building2 size={17} /></span><span className={styles.impactLabel}>Valor conquistado<small>Equivalente em patrimônio</small></span><span className={styles.before}>{formatMoney(cart.currentOwnedValue)}</span><ArrowRight size={14} /><strong className={styles.after}>{formatMoney(cart.newOwnedValue)}</strong></div>
            <div className={styles.milestone}>
              <div className={styles.milestoneHead}><span>Meta de 10%</span><span>{formatInteger(cart.currentTokens + cart.tokens)} tokens</span></div>
              <div className={styles.track}><div className={styles.fill} style={{ width: `${milestoneProgress}%` }} /></div>
              <p className={styles.milestoneFoot}>{cart.toMilestone > 0 ? <>Faltam <strong>{formatInteger(cart.toMilestone)} tokens</strong> para 10%.</> : <strong>Meta de 10% atingida ou ultrapassada.</strong>}</p>
            </div>
          </section>

          <section className={`${styles.card} mt-4`}>
            <span className={styles.cardLabel}>Forma de pagamento</span>
            <div className={styles.paymentOptions}>
              <button type="button" className={`${styles.paymentOpt} ${method === 'pix' ? styles.paymentOptActive : ''}`} onClick={() => setMethod('pix')}>
                <span className={styles.radio} /><span><span className={styles.payName}>PIX <span className={styles.tag}>instantâneo</span></span><span className={styles.payDesc}>QR Code e copia e cola pelo backend.</span></span>
              </button>
              <button type="button" className={`${styles.paymentOpt} ${method === 'boleto' ? styles.paymentOptActive : ''}`} onClick={() => setMethod('boleto')}>
                <span className={styles.radio} /><span><span className={styles.payName}>Boleto</span><span className={styles.payDesc}>Fluxo reservado para compensação bancária.</span></span>
              </button>
            </div>
          </section>
        </aside>
      </div>

      <div className={styles.ctaBar}>
        <div className={styles.ctaSummary}><span className={styles.ctaK}>Resumo</span><strong className={styles.ctaTotal}>{formatMoney(cart.total)}</strong><span className={styles.ctaMeta}>{formatInteger(cart.tokens)} tokens · taxa {formatMoney(cart.fee)}</span></div>
        <button type="button" className={styles.primary} onClick={proceed}>Continuar <ArrowRight size={16} /></button>
      </div>
    </main>
  );
}

function useRequiredCart() {
  const router = useRouter();
  const [cart, setCart] = useState<FmzTokenPurchaseCart | null>(null);

  useEffect(() => {
    const stored = readTokenPurchaseCart();
    if (!stored) {
      router.replace(getLocalizedHref('/connected/tokensToPurchasePix'));
      return;
    }
    setCart(stored);
  }, [router]);

  return cart;
}

export function FmzTenantTokenPurchaseConfirmPage() {
  const router = useRouter();
  const cart = useRequiredCart();
  const [accepted, setAccepted] = useState(false);

  const proceed = useCallback(() => {
    if (!cart || !accepted) return;
    writeTokenPurchaseCart(cart);
    router.push(getLocalizedHref('/connected/tokensToPurchasePix/pix'));
  }, [accepted, cart, router]);

  if (!cart) return null;

  return (
    <main className={styles.page}>
      <PageBackButton fallback="/connected/tokensToPurchasePix" />
      <Stepper active={2} />
      <div className={styles.hero}>
        <div><p className={styles.eyebrow}>Confirmar compra</p><h1 className={styles.title}>Revise os dados antes de gerar o PIX</h1><p className={styles.subtitle}>O backend será chamado na próxima etapa para criar a cobrança PIX da tenant.</p></div>
      </div>
      <div className={styles.confirmGrid}>
        <section>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Pedido</span>
            <div className={styles.orderItem}><span className={styles.cover}><Landmark size={22} /></span><span><strong className={styles.itemName}>{formatInteger(cart.tokens)} tokens FirmezaToken</strong><span className={styles.itemSub}>Acréscimo de {formatPercent(cart.deltaPercentage)} pp na participação estimada</span></span><strong className={styles.itemPrice}>{formatMoney(cart.subtotal)}</strong></div>
            <div className={styles.breakdown}>
              <div className={styles.bdRow}><span>Subtotal</span><strong>{formatMoney(cart.subtotal)}</strong></div>
              <div className={styles.bdRow}><span>Taxa administrativa <span className={styles.tag}>{formatPercent(cart.feeRate * 100)}</span></span><strong>{formatMoney(cart.fee)}</strong></div>
              <div className={`${styles.bdRow} ${styles.bdTotal}`}><span>Total</span><strong>{formatMoney(cart.total)}</strong></div>
            </div>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Impacto esperado</span>
            <div className={styles.impactRow}><span className={`${styles.ico} ${styles.icoGold}`}><Home size={17} /></span><span className={styles.impactLabel}>Participação</span><span className={styles.before}>{formatPercent(cart.currentPercentage)}</span><ArrowRight size={14} /><strong className={styles.after}>{formatPercent(cart.newPercentage)}</strong></div>
            <div className={styles.impactRow}><span className={`${styles.ico} ${styles.icoGreen}`}><ReceiptText size={17} /></span><span className={styles.impactLabel}>Aluguel estimado</span><span className={styles.before}>{formatMoney(cart.currentRent)}</span><ArrowRight size={14} /><strong className={styles.after}>{formatMoney(cart.newRent)}</strong></div>
            <div className={styles.impactRow}><span className={styles.ico}><Building2 size={17} /></span><span className={styles.impactLabel}>Patrimônio conquistado</span><span className={styles.before}>{formatMoney(cart.currentOwnedValue)}</span><ArrowRight size={14} /><strong className={styles.after}>{formatMoney(cart.newOwnedValue)}</strong></div>
          </div>
        </section>
        <aside>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Pagamento</span>
            <div className={styles.pmChip}><span className={styles.pmIcon}><Zap size={20} /></span><span><strong className={styles.pmName}>PIX</strong><span className={styles.pmDesc}>QR Code dinâmico com validade controlada pelo ASAAS/backend</span></span></div>
            <p className={styles.pmHint}>Ao confirmar, o frontend chama a rota do backend para gerar a cobrança PIX e exibir o QR Code e o código copia e cola retornados pela API.</p>
          </div>
          <div className={`${styles.card} mt-4`}>
            <label className={`${styles.terms} ${accepted ? styles.termsChecked : ''}`}>
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
              <span className={styles.checkmark}>{accepted ? <Check size={13} /> : null}</span>
              <span>Li e aceito o contrato de aquisição fracionada, a política de lock-up e os termos de uso da plataforma.</span>
            </label>
            <ul className={styles.finePrint}><li>Os tokens ficam pendentes até confirmação do pagamento pelo provedor.</li><li>A efetivação on-chain deve continuar sendo feita pelo serviço autorizado do contrato.</li></ul>
          </div>
        </aside>
      </div>
      <div className={styles.ctaBar}><div className={styles.ctaSummary}><span className={styles.ctaK}>Total</span><strong className={styles.ctaTotal}>{formatMoney(cart.total)}</strong><span className={styles.ctaMeta}>{formatInteger(cart.tokens)} tokens · PIX</span></div><button type="button" className={styles.primary} disabled={!accepted} onClick={proceed}>Gerar QR Pix <ArrowRight size={16} /></button></div>
    </main>
  );
}

export function FmzTenantTokenPurchasePixPage() {
  const router = useRouter();
  const cart = useRequiredCart();
  const [payment, setPayment] = useState<FmzTokenPurchasePayment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [isCreating, setIsCreating] = useState(true);

  useEffect(() => {
    if (!cart) return;
    let mounted = true;
    async function createPayment() {
      setIsCreating(true);
      setErrorMessage(null);
      try {
        const created = await createTenantTokenPixPayment(cart as FmzTokenPurchaseCart);
        if (!mounted) return;
        setPayment(created);
        window.sessionStorage.setItem('firmeza:tenant-token-purchase-payment', JSON.stringify(created));
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao gerar o PIX.');
      } finally {
        if (mounted) setIsCreating(false);
      }
    }
    void createPayment();
    return () => { mounted = false; };
  }, [cart]);

  useEffect(() => {
    if (!payment || statusIsPaid(payment.status)) return;
    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [payment]);

  useEffect(() => {
    if (!payment || statusIsPaid(payment.status)) return;
    let stopped = false;
    const interval = window.setInterval(async () => {
      try {
        const nextPayment = await getTenantTokenPaymentStatus(payment);
        if (stopped) return;
        setPayment(nextPayment);
        window.sessionStorage.setItem('firmeza:tenant-token-purchase-payment', JSON.stringify(nextPayment));
        if (statusIsPaid(nextPayment.status)) {
          window.clearInterval(interval);
          setTimeout(() => router.push(getLocalizedHref('/connected/tokensToPurchasePix/success')), 1200);
        }
      } catch {
        // Keep the current QR visible even if a status polling request fails.
      }
    }, 8000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, [payment, router]);

  const copyPaste = getPaymentCopyPaste(payment);
  const qrImageSrc = getPaymentImageSrc(payment);
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  const copyPix = useCallback(async () => {
    if (!copyPaste) return;
    await navigator.clipboard?.writeText(copyPaste);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1800);
  }, [copyPaste]);

  if (!cart) return null;

  return (
    <main className={`${styles.page} ${styles.narrow}`}>
      <PageBackButton fallback="/connected/tokensToPurchasePix/confirm" />
      <Stepper active={3} />
      <div className={styles.hero}><div><p className={styles.eyebrow}>Pagamento PIX</p><h1 className={styles.title}>Pague pelo app do seu banco</h1><p className={styles.subtitle}>Escaneie o QR Code ou copie o código PIX. A confirmação será feita pelo backend via ASAAS/webhook.</p></div></div>
      {errorMessage ? <div className={styles.alert}>{errorMessage}</div> : null}
      <section className={styles.payCard}>
        <div className={styles.amountRow}><div><span className={styles.amountK}>Total</span><div className={styles.amountV}>{formatMoney(cart.total)}</div></div><div className={styles.amountRight}><b>{formatInteger(cart.tokens)} tokens</b><br />Taxa inclusa de {formatMoney(cart.fee)}</div></div>
        {isCreating ? (
          <><div className={styles.qrFrame}><Loader2 className={styles.spinner} /></div><p className={styles.statusText}>Gerando cobrança PIX no backend</p><p className={styles.subStatus}>conectando com o provedor de pagamento...</p></>
        ) : (
          <>
            <div className={styles.qrWrap}>{qrImageSrc ? <img className={styles.qrImg} alt="QR Code PIX" src={qrImageSrc} /> : <div className={styles.qrFallback}>QR Code não retornado.<br />Use o código copia e cola abaixo.</div>}</div>
            <p className={styles.statusText}>Aguardando pagamento</p><p className={styles.subStatus}>Validade estimada: {minutes}:{seconds}</p>
            <div className={styles.copyBlock}><span className={styles.copyCode}>{copyPaste || 'Código PIX não retornado pelo backend'}</span><button type="button" className={styles.copyBtn} disabled={!copyPaste} onClick={copyPix}><Copy size={14} /> {isCopied ? 'Copiado' : 'Copiar código'}</button></div>
            <div className={styles.awaiting}><span className={styles.pulse} /><span><b>Estamos verificando automaticamente.</b> Quando o ASAAS confirmar o pagamento, você será direcionada para a tela de conclusão.</span></div>
          </>
        )}
      </section>
      <section className={styles.details}>
        <div className={styles.detRow}><span>Provedor</span><strong>{payment?.paymentProvider ?? 'ASAAS / backend'}</strong></div>
        <div className={styles.detRow}><span>Referência</span><strong>{payment?.externalReference ?? payment?.paymentTransactionId ?? '—'}</strong></div>
        <div className={styles.detRow}><span>Status</span><strong>{payment?.status ?? 'created'}</strong></div>
      </section>
    </main>
  );
}

export function FmzTenantTokenPurchaseSuccessPage() {
  const router = useRouter();
  const [cart, setCart] = useState<FmzTokenPurchaseCart | null>(null);
  const [payment, setPayment] = useState<FmzTokenPurchasePayment | null>(null);

  useEffect(() => {
    setCart(readTokenPurchaseCart());
    try {
      const raw = window.sessionStorage.getItem('firmeza:tenant-token-purchase-payment');
      setPayment(raw ? JSON.parse(raw) as FmzTokenPurchasePayment : null);
    } catch {
      setPayment(null);
    }
  }, []);

  if (!cart) return null;

  const nextMilestoneProgress = Math.min(100, (cart.newPercentage / 25) * 100);

  return (
    <main className={styles.page}>
      <section className={styles.successHero}>
        <span className={styles.successBadge}><Sparkles size={14} /> Aquisição concluída</span>
        <h1 className={styles.successTitle}>Você comprou <span>{formatInteger(cart.tokens)}</span> tokens</h1>
        <p className={styles.successSub}>O pagamento foi confirmado e os tokens ficam registrados como pendentes até a conclusão do fluxo operacional/on-chain.</p>
      </section>
      <section className={styles.stats}>
        <article className={styles.stat}><div className={styles.statHead}><span className={styles.statIcon}><WalletCards size={17} /></span><span className={styles.statTag}>+tokens</span></div><span className={styles.statLbl}>Tokens adquiridos</span><strong className={styles.statVal}>{formatInteger(cart.tokens)}</strong></article>
        <article className={styles.stat}><div className={styles.statHead}><span className={styles.statIcon}><Home size={17} /></span><span className={styles.statTag}>+{formatPercent(cart.deltaPercentage)} pp</span></div><span className={styles.statLbl}>Nova posse</span><strong className={styles.statVal}>{formatPercent(cart.newPercentage)}</strong></article>
        <article className={styles.stat}><div className={styles.statHead}><span className={styles.statIcon}><ReceiptText size={17} /></span><span className={styles.statTag}>economia</span></div><span className={styles.statLbl}>Redução estimada</span><strong className={styles.statVal}>{formatMoneyNoSymbol(cart.rentSaving)}</strong></article>
      </section>
      <section className={styles.band}>
        <div className={styles.bandContent}>
          <div><p className={styles.eyebrow}>Próxima meta</p><h2 className={styles.bandH}>Você está mais perto de <em>25% de posse</em></h2><p className={styles.bandP}>Continue acompanhando a carteira para ver a atualização da participação, histórico de pagamentos e próximos marcos da jornada.</p></div>
          <div className={styles.darkMeter}><div className={styles.meterHead}><span className={styles.meterLbl}>Progresso até 25%</span><strong className={styles.meterPct}>{formatPercent(cart.newPercentage)}</strong></div><div className={styles.meterTrack}><div className={styles.meterFill} style={{ width: `${nextMilestoneProgress}%` }} /></div></div>
        </div>
      </section>
      <section className={styles.nextGrid}>
        <Link href={getLocalizedHref('/connected/wallet')} className={styles.nextItem}><span className={styles.nextIcon}><WalletCards size={18} /></span><span><span className={styles.nextLbl}>Carteira</span><strong className={styles.nextTitle}>Ver tokens</strong><span className={styles.nextDesc}>Acompanhe saldo e tokens pendentes.</span></span></Link>
        <Link href={getLocalizedHref('/connected/myContract')} className={styles.nextItem}><span className={styles.nextIcon}><ShieldCheck size={18} /></span><span><span className={styles.nextLbl}>Contrato</span><strong className={styles.nextTitle}>Meu imóvel</strong><span className={styles.nextDesc}>Veja sua relação com o imóvel.</span></span></Link>
        <Link href={getLocalizedHref('/connected/paymentHistory')} className={styles.nextItem}><span className={styles.nextIcon}><ReceiptText size={18} /></span><span><span className={styles.nextLbl}>Histórico</span><strong className={styles.nextTitle}>Pagamentos</strong><span className={styles.nextDesc}>Consulte cobranças e confirmações.</span></span></Link>
      </section>
      <div className={styles.actions}><Link href={getLocalizedHref('/connected/wallet')} className={styles.primary}>Ir para carteira</Link><button type="button" className={styles.secondary} onClick={() => router.push(getLocalizedHref('/connected/dashboard'))}>Voltar ao Dashboard</button></div>
      {payment?.externalReference ? <p className={`${styles.subtitle} text-center mt-5`}>Referência do pagamento: <strong>{payment.externalReference}</strong></p> : null}
    </main>
  );
}
