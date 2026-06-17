'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '../../../../i18n/navigation';
import type { TokenAcquisitionCelebration } from '../domain/fmz-token-acquisition.types';

// ─────────────────────────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────────────────────────
const GOLD       = '#E8B620';
const GOLD_SOFT  = '#F5D26B';
const GOLD_TINT  = '#FBF3DA';
const GOLD_DEEP  = '#8A6B12';
const NAVY       = '#0E1626';
const NAVY_2     = '#1C2740';
const MUTED      = '#5A6478';
const HINT       = '#8893A6';
const LINE       = '#E6E8EE';
const PAGE       = '#F4F5F8';
const GREEN      = '#127A4F';
const GREEN_TINT = '#E8F5EE';

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────
const WALLET_PATH    = '/connected/wallet';
const DASHBOARD_PATH = '/connected/dashboard';
const MY_TOKENS_PATH = '/connected/my-tokens';

// ─────────────────────────────────────────────────────────────────
// ANIMATION CONFIG
// ─────────────────────────────────────────────────────────────────
const CONFETTI_PARTICLE_COUNT = 140;
const CONFETTI_COLORS         = [GOLD, GOLD_SOFT, GOLD_TINT, '#FFFFFF', '#F0C94A', '#D9A510'];
const CONFETTI_DURATION_MS    = 5500;
const CONFETTI_FADE_MS        = 1200;
const COUNTER_DELAY_MS        = 300;
const COUNTER_DURATION_MS     = 1400;

// ─────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────
const formatRawPercentage = (n: number) => n.toFixed(1).replace('.', ',');
const formatPercentage    = (n: number) => `${formatRawPercentage(n)}%`;
const formatBRL           = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatInteger       = (n: number) => Math.round(n).toLocaleString('pt-BR');

// ─────────────────────────────────────────────────────────────────
// ANIMATION HELPERS
// ─────────────────────────────────────────────────────────────────
type NumberFormatter = (value: number) => string;

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function animateCounter(
  el: HTMLElement,
  from: number,
  to: number,
  duration: number,
  format: NumberFormatter,
): () => void {
  let rafId: number;
  const startTime = performance.now();
  const tick = (now: number) => {
    if (!el.isConnected) return;
    const progress = Math.min(1, (now - startTime) / duration);
    el.textContent  = format(from + (to - from) * easeOutCubic(progress));
    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      el.textContent = format(to);
    }
  };
  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

// ─────────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────────
type ConfettiParticle = {
  x: number; y: number;
  w: number; h: number;
  color: string;
  vy: number; vx: number;
  rot: number; vr: number;
  wobble: number; wobSpeed: number;
  t: number;
  isCircle: boolean;
};

function initCanvasForViewport(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  dpr: number,
): { viewportWidth: number; viewportHeight: number } {
  const viewportWidth  = window.innerWidth;
  const viewportHeight = window.innerHeight;
  canvas.width  = viewportWidth  * dpr;
  canvas.height = viewportHeight * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { viewportWidth, viewportHeight };
}

function createConfettiParticle(viewportWidth: number, viewportHeight: number): ConfettiParticle {
  return {
    x:        Math.random() * viewportWidth,
    y:        -20 - Math.random() * viewportHeight * 0.6,
    w:        5  + Math.random() * 6,
    h:        8  + Math.random() * 8,
    color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    vy:       1.4 + Math.random() * 2.2,
    vx:       (Math.random() - 0.5) * 1.4,
    rot:      Math.random() * Math.PI * 2,
    vr:       (Math.random() - 0.5) * 0.18,
    wobble:   0.6 + Math.random() * 1.6,
    wobSpeed: 0.03 + Math.random() * 0.04,
    t:        Math.random() * 100,
    isCircle: Math.random() < 0.3,
  };
}

function drawConfettiParticle(context: CanvasRenderingContext2D, particle: ConfettiParticle, fadeAlpha: number) {
  context.save();
  context.globalAlpha  = fadeAlpha;
  context.translate(particle.x, particle.y);
  context.rotate(particle.rot);
  context.fillStyle    = particle.color;
  context.shadowColor  = 'rgba(232,182,32,.65)';
  context.shadowBlur   = 8;
  if (particle.isCircle) {
    context.beginPath();
    context.arc(0, 0, particle.w / 2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);
  }
  context.restore();
}

function advanceAndDrawParticles(
  context: CanvasRenderingContext2D,
  particles: ConfettiParticle[],
  viewportWidth: number,
  viewportHeight: number,
  now: number,
  stopAt: number,
): number {
  context.clearRect(0, 0, viewportWidth, viewportHeight);
  let aliveCount = 0;
  for (const particle of particles) {
    particle.t   += 1;
    particle.x   += particle.vx + Math.sin(particle.t * particle.wobSpeed) * particle.wobble;
    particle.y   += particle.vy;
    particle.rot += particle.vr;
    if (particle.y < viewportHeight + 30) aliveCount++;
    const fadeAlpha = now < stopAt ? 1 : Math.max(0, 1 - (now - stopAt) / CONFETTI_FADE_MS);
    drawConfettiParticle(context, particle, fadeAlpha);
  }
  return aliveCount;
}

function scheduleIdleWork(callback: () => void): () => void {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(callback);
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 0);
  return () => clearTimeout(id);
}

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) {
      if (process.env.NODE_ENV === 'development') console.warn('[FmzConfetti] 2D context unavailable');
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    let { viewportWidth, viewportHeight } = initCanvasForViewport(canvas, context, dpr);

    const handleResize = () => {
      ({ viewportWidth, viewportHeight } = initCanvasForViewport(canvas, context, dpr));
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    const cancelIdle = scheduleIdleWork(() => {
      const particles = Array.from(
        { length: CONFETTI_PARTICLE_COUNT },
        () => createConfettiParticle(viewportWidth, viewportHeight),
      );
      const stopAt = performance.now() + CONFETTI_DURATION_MS;
      const renderFrame = (now: number) => {
        const aliveCount = advanceAndDrawParticles(context, particles, viewportWidth, viewportHeight, now, stopAt);
        if (now < stopAt + CONFETTI_FADE_MS && aliveCount > 0) {
          rafId = requestAnimationFrame(renderFrame);
        } else {
          context.clearRect(0, 0, viewportWidth, viewportHeight);
        }
      };
      rafId = requestAnimationFrame(renderFrame);
    });

    return () => {
      cancelIdle();
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef]);
}

// ─────────────────────────────────────────────────────────────────
// useCounterAnimations
// ─────────────────────────────────────────────────────────────────
function useCounterAnimations(
  ownership: TokenAcquisitionCelebration['ownership'],
  rent:      TokenAcquisitionCelebration['rent'],
  equity:    TokenAcquisitionCelebration['equity'],
  pctRef:    React.RefObject<HTMLSpanElement | null>,
  rentRef:   React.RefObject<HTMLSpanElement | null>,
  shareRef:  React.RefObject<HTMLSpanElement | null>,
) {
  useEffect(() => {
    const cancels: Array<() => void> = [];
    const timer = setTimeout(() => {
      if (pctRef.current)   cancels.push(animateCounter(pctRef.current,   ownership.previousPercentage, ownership.newPercentage, COUNTER_DURATION_MS, formatRawPercentage));
      if (rentRef.current)  cancels.push(animateCounter(rentRef.current,  rent.previousRentAmount,      rent.newRentAmount,      COUNTER_DURATION_MS, formatBRL));
      if (shareRef.current) cancels.push(animateCounter(shareRef.current, equity.previousValue,         equity.newValue,         COUNTER_DURATION_MS, formatInteger));
    }, COUNTER_DELAY_MS);
    return () => { clearTimeout(timer); cancels.forEach((cancel) => cancel()); };
  }, [ownership, rent, equity, pctRef, rentRef, shareRef]);
}

// ─────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────
type StatCardData = {
  icon:  React.ReactNode;
  label: string;
  value: {
    initial:  string;
    prefix?:  string;
    suffix?:  string;
  };
  tag: {
    text:       string;
    color:      string;
    background: string;
  };
  history: {
    prevFrom: string;
    caption:  string;
  };
  animationDelay: string;
};

function StatCard({ data, spanRef }: { data: StatCardData; spanRef?: React.RefObject<HTMLSpanElement | null> }) {
  const { icon, label, value, tag, history, animationDelay } = data;
  return (
    <article style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20, padding: 22, boxShadow: '0 2px 6px rgba(14,22,38,.05),0 8px 24px -8px rgba(14,22,38,.08)', display: 'flex', flexDirection: 'column', gap: 14, animation: `fmz-celebration-rise 0.8s cubic-bezier(.2,.8,.2,1) ${animationDelay} both`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: GOLD_TINT, color: GOLD_DEEP, display: 'grid', placeItems: 'center' }}>
          {icon}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, color: tag.color, background: tag.background }}>
          {tag.text}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: 34, color: NAVY, letterSpacing: '-.025em', lineHeight: 1 }}>
          {value.prefix && <span style={{ fontSize: '0.55em', fontWeight: 500, color: MUTED, marginRight: 3 }}>{value.prefix}</span>}
          <span ref={spanRef}>{value.initial}</span>
          {value.suffix && <span style={{ fontSize: '0.55em', fontWeight: 600, color: MUTED, marginLeft: 3 }}>{value.suffix}</span>}
        </div>
        <div style={{ fontSize: 12, color: HINT, display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{ textDecoration: 'line-through', textDecorationThickness: 1 }}>{history.prevFrom}</span>
          <span>→</span>
          <span>{history.caption}</span>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────
// StatCard builders (pure — no hooks, no I/O)
// ─────────────────────────────────────────────────────────────────
function buildOwnershipStatCard(
  ownership:     TokenAcquisitionCelebration['ownership'],
  propertyLabel: string,
): StatCardData {
  return {
    icon:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11L12 4L21 11V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V11Z"/></svg>,
    label: 'Sua posse',
    value: { initial: formatRawPercentage(ownership.previousPercentage), suffix: '%' },
    tag:   { text: `+${formatRawPercentage(ownership.deltaPercentagePoints)} pp`, color: GOLD_DEEP, background: GOLD_TINT },
    history: { prevFrom: formatPercentage(ownership.previousPercentage), caption: `do ${propertyLabel}` },
    animationDelay: '.15s',
  };
}

function buildRentStatCard(
  rent: TokenAcquisitionCelebration['rent'],
): StatCardData {
  return {
    icon:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M5 8l7-7 7 7M5 16l7 7 7-7"/></svg>,
    label: 'Aluguel mensal',
    value: { initial: formatBRL(rent.previousRentAmount), prefix: 'R$' },
    tag:   { text: `−R$ ${formatBRL(rent.monthlySavingsAmount)}`, color: GREEN, background: GREEN_TINT },
    history: { prevFrom: `R$ ${formatBRL(rent.previousRentAmount)}`, caption: 'economia mensal' },
    animationDelay: '.25s',
  };
}

function buildEquityStatCard(
  equity: TokenAcquisitionCelebration['equity'],
): StatCardData {
  return {
    icon:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5A3.5 3.5 0 0 0 9.5 12h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    label: 'Patrimônio imobiliário',
    value: { initial: formatInteger(equity.previousValue), prefix: 'R$' },
    tag:   { text: `+R$ ${formatInteger(equity.deltaValue)}`, color: GREEN, background: GREEN_TINT },
    history: { prevFrom: `R$ ${formatInteger(equity.previousValue)}`, caption: 'do imóvel' },
    animationDelay: '.35s',
  };
}

// ─────────────────────────────────────────────────────────────────
// MilestoneMeter
// ─────────────────────────────────────────────────────────────────
type MilestoneMeterProps = {
  wasFillPercentage:     number;
  currentFillPercentage: number;
  displayPct:            string;
  targetLabel:           string;
  tokensRemaining:       number;
};

function MilestoneMeter({ wasFillPercentage, currentFillPercentage, displayPct, targetLabel, tokensRemaining }: MilestoneMeterProps) {
  const [isFilled, setIsFilled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsFilled(true), COUNTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div style={{ background: 'rgba(255,255,255,.7)', border: '1px solid #F0E0A8', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: GOLD_DEEP }}>Caminho até a casa própria</span>
        <span style={{ fontWeight: 700, fontSize: 22, color: NAVY, letterSpacing: '-.02em' }}>{displayPct}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(14,22,38,.08)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 4, background: 'rgba(232,182,32,.35)', width: `${wasFillPercentage}%` }} />
        <div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${GOLD_SOFT},${GOLD})`, width: isFilled ? `${currentFillPercentage}%` : '0%', transition: 'width 1.4s cubic-bezier(.2,.8,.2,1)', boxShadow: '0 0 12px rgba(232,182,32,.4)' }} />
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: MUTED, display: 'flex', justifyContent: 'space-between' }}>
        <span>Hoje: <strong style={{ color: NAVY, fontWeight: 600 }}>{displayPct}</strong></span>
        <span>Meta: <strong style={{ color: NAVY, fontWeight: 600 }}>{targetLabel}</strong> · faltam <strong style={{ color: NAVY, fontWeight: 600 }}>{formatInteger(tokensRemaining)}</strong> tokens</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// NextStepCard
// ─────────────────────────────────────────────────────────────────
type NextStepCardProps = {
  href:        string;
  icon:        React.ReactNode;
  category:    string;
  title:       string;
  description: string;
};

function NextStepCard({ href, icon, category, title, description }: NextStepCardProps) {
  return (
    <Link href={href} className="fmz-celebration-next-card" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none', transition: 'all .15s' }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: PAGE, color: NAVY, display: 'grid', placeItems: 'center' }}>{icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>{category}</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.3 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: MUTED, marginTop: 3, lineHeight: 1.4 }}>{description}</span>
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={HINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 6 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────
// HeroSection
// ─────────────────────────────────────────────────────────────────
type HeroSectionProps = {
  tokensAcquired: number;
  propertyLabel:  string;
};

function HeroSection({ tokensAcquired, propertyLabel }: HeroSectionProps) {
  return (
    <header style={{ textAlign: 'center', marginBottom: 36, animation: 'fmz-celebration-rise 0.8s cubic-bezier(.2,.8,.2,1) both' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 18, padding: '6px 14px', borderRadius: 999, background: GOLD_TINT, border: '1px solid #F0E0A8', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: GOLD_DEEP }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Aquisição concluída · pagamento confirmado
      </div>
      <h1 style={{ fontWeight: 800, fontSize: 'clamp(36px,5.4vw,56px)', letterSpacing: '-.03em', lineHeight: 1.02, color: NAVY, maxWidth: '14ch', margin: '0 auto' }}>
        Você está mais perto do{' '}
        <span style={{ background: `linear-gradient(180deg,${GOLD_DEEP} 0%,#6B4F0A 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          seu lar.
        </span>
      </h1>
      <p style={{ fontSize: 16, color: MUTED, maxWidth: 540, margin: '18px auto 0', lineHeight: 1.55 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 999, padding: '3px 11px', fontSize: 13.5, fontWeight: 600, color: NAVY, margin: '0 3px', verticalAlign: 'middle' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
          {formatInteger(tokensAcquired)} tokens
        </span>
        {' '}foram creditados na sua carteira do {propertyLabel}. Cada token é um pedaço seu, e um aluguel a menos no seu mês.
      </p>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────
// NarrativeBand
// ─────────────────────────────────────────────────────────────────
type NarrativeBandProps = {
  ownership: TokenAcquisitionCelebration['ownership'];
  nextGoal:  TokenAcquisitionCelebration['nextGoal'];
};

function NarrativeBand({ ownership, nextGoal }: NarrativeBandProps) {
  return (
    <section style={{ background: 'linear-gradient(135deg,#FBF3DA 0%,#FCF6E2 100%)', border: '1px solid #F0E0A8', borderRadius: 20, padding: 'clamp(24px,3.5vw,44px)', marginBottom: 28, position: 'relative', overflow: 'hidden', animation: 'fmz-celebration-rise 0.8s cubic-bezier(.2,.8,.2,1) .45s both' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(800px 400px at 90% -10%,rgba(232,182,32,.22),transparent 60%)' }} />
      <div className="fmz-celebration-band-inner" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: GOLD_DEEP, marginBottom: 14 }}>
            <span style={{ width: 18, height: 1.5, background: GOLD, borderRadius: 1, display: 'block' }} />
            Para onde isso te leva
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.2, letterSpacing: '-.02em', color: NAVY }}>
            Cada token é um{' '}
            <em style={{ color: GOLD_DEEP, fontStyle: 'normal' }}>tijolo</em>. Você está saindo do aluguel uma compra de cada vez.
          </h2>
          {nextGoal && (
            <p style={{ marginTop: 14, fontSize: 14.5, color: MUTED, lineHeight: 1.6, maxWidth: '42ch' }}>
              Sua próxima meta é <strong style={{ color: NAVY }}>{formatPercentage(nextGoal.targetPercentage)} de posse</strong>.
              {nextGoal.projectedRentAtGoal != null && ` Quando atingir, seu aluguel cai para R$ ${formatBRL(nextGoal.projectedRentAtGoal)}.`}
            </p>
          )}
        </div>
        {nextGoal && (
          <MilestoneMeter
            wasFillPercentage={Math.min(100, (ownership.previousPercentage / nextGoal.targetPercentage) * 100)}
            currentFillPercentage={Math.min(100, nextGoal.progressPercentage)}
            displayPct={formatPercentage(nextGoal.currentOwnershipPercentage)}
            targetLabel={formatPercentage(nextGoal.targetPercentage)}
            tokensRemaining={nextGoal.tokensRemaining}
          />
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// FmzTokenAcquiredCelebration
// ─────────────────────────────────────────────────────────────────
export function FmzTokenAcquiredCelebration({
  celebration,
  onContinue,
}: {
  celebration: TokenAcquisitionCelebration;
  onContinue:  () => void;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pctRef     = useRef<HTMLSpanElement>(null);
  const rentRef    = useRef<HTMLSpanElement>(null);
  const shareRef   = useRef<HTMLSpanElement>(null);

  useConfetti(canvasRef);
  useCounterAnimations(celebration.ownership, celebration.rent, celebration.equity, pctRef, rentRef, shareRef);

  const propertyLabel = celebration.property.label ?? 'seu imóvel';

  return (
    <div style={{ position: 'relative', background: PAGE, minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes fmz-celebration-rise {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .fmz-celebration-next-card:hover      { border-color: #D0D4DE !important; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(14,22,38,.05),0 8px 24px -8px rgba(14,22,38,.08); }
        .fmz-celebration-btn-primary:hover    { background: ${NAVY_2} !important; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(14,22,38,.05),0 8px 24px -8px rgba(14,22,38,.08); }
        .fmz-celebration-btn-secondary:hover  { border-color: #D0D4DE !important; background: ${PAGE} !important; }
        @media (max-width: 720px) {
          .fmz-celebration-stats-grid,
          .fmz-celebration-next-grid  { grid-template-columns: 1fr !important; }
          .fmz-celebration-band-inner { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />

      <main style={{ width: '100%', maxWidth: 920, margin: '0 auto', padding: 'clamp(28px,5vw,56px) clamp(20px,4vw,40px) 60px', position: 'relative', zIndex: 2 }}>

        <HeroSection tokensAcquired={celebration.tokensAcquired} propertyLabel={propertyLabel} />

        <section className="fmz-celebration-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          <StatCard data={buildOwnershipStatCard(celebration.ownership, propertyLabel)} spanRef={pctRef} />
          <StatCard data={buildRentStatCard(celebration.rent)} spanRef={rentRef} />
          <StatCard data={buildEquityStatCard(celebration.equity)} spanRef={shareRef} />
        </section>

        <NarrativeBand ownership={celebration.ownership} nextGoal={celebration.nextGoal} />

        <section className="fmz-celebration-next-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32, animation: 'fmz-celebration-rise 0.8s cubic-bezier(.2,.8,.2,1) .55s both' }}>
          <NextStepCard href={WALLET_PATH} category="Carteira" title="Ver seus novos tokens" description="Saldo, histórico e proventos."
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M18 13h.01M2 10h20"/></svg>}
          />
          <NextStepCard href={MY_TOKENS_PATH} category="Meu Imóvel" title={`Acompanhar ${propertyLabel}`} description="Próxima assembleia e relatórios."
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V12L12 3L21 12V21H14V14H10V21H3Z"/></svg>}
          />
          <NextStepCard href="#" category="Comprovante" title="Baixar PDF da compra" description="Tokens, taxa e referência da ordem."
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          />
        </section>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'fmz-celebration-rise 0.8s cubic-bezier(.2,.8,.2,1) .65s both' }}>
          <button type="button" onClick={onContinue} className="fmz-celebration-btn-primary" style={{ padding: '14px 24px', borderRadius: 10, fontWeight: 700, letterSpacing: '-.01em', fontSize: 14.5, display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all .15s', background: NAVY, color: GOLD, border: `1px solid ${NAVY}`, cursor: 'pointer', fontFamily: 'inherit' }}>
            Ir para minha carteira
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <Link href={DASHBOARD_PATH} className="fmz-celebration-btn-secondary" style={{ padding: '14px 24px', borderRadius: 10, fontWeight: 700, letterSpacing: '-.01em', fontSize: 14.5, display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all .15s', background: '#fff', color: NAVY, border: `1px solid ${LINE}`, textDecoration: 'none' }}>
            Voltar ao Dashboard
          </Link>
        </div>

        {celebration.reference.tokenOrderId && (
          <p style={{ marginTop: 18, textAlign: 'center', fontSize: 12.5, color: MUTED }}>
            Ordem:{' '}
            <span style={{ fontFamily: "'JetBrains Mono',monospace", color: NAVY, fontWeight: 600 }}>
              {celebration.reference.tokenOrderId.slice(0, 8)}…
            </span>
            {celebration.reference.settledAt && (
              <> · Liquidado em {new Date(celebration.reference.settledAt).toLocaleDateString('pt-BR')}</>
            )}
          </p>
        )}

      </main>
    </div>
  );
}
