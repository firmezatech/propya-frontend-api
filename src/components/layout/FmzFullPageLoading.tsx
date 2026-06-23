import Image from 'next/image';
import { CheckCheck, Cpu, DollarSign, FileText, Lock, PieChart, Receipt } from 'lucide-react';
import { fmzCn } from '../../lib/fmz-classnames';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

type FmzFullPageLoadingProps = {
  label?: string;
  description?: string;
  className?: string;
  withBrand?: boolean;
  statusLabel?: string;
};

type FmzLoadingStage = {
  label: string;
  icon: typeof Lock;
  done?: boolean;
};

const loadingStages: FmzLoadingStage[] = [
  { label: 'autenticando sessão', icon: Lock },
  { label: 'lendo contrato do imóvel', icon: FileText },
  { label: 'sincronizando carteira de tokens', icon: Cpu },
  { label: 'calculando posse atual', icon: PieChart },
  { label: 'preparando dados do painel', icon: Receipt },
  { label: 'pronto — abrindo painel', icon: CheckCheck, done: true },
];

const loadingStageDelaySeconds = 7.2 / loadingStages.length;

const tickIndexes = Array.from({ length: 24 }, (_, index) => index);

export function FmzFullPageLoading({
  label = 'Sincronizando o seu imóvel, token a token.',
  description = 'Pegando seu saldo, posse atual, último boleto e a leitura do contrato. Leva só alguns segundos.',
  className,
  withBrand = true,
  statusLabel,
}: FmzFullPageLoadingProps) {
  const effectiveStatusLabel = statusLabel ?? loadingStages[0].label;

  return (
    <section className={fmzCn('fmz-loading-page', className)} aria-busy="true" aria-live="polite">
      <div className="fmz-loading-bg" aria-hidden="true" />
      <div className="fmz-loading-geo" aria-hidden="true">
        <svg className="fmz-loading-geo-tl" width="360" height="360" viewBox="0 0 500 500" fill="none">
          <path d="M250 50L450 175V325L250 450L50 325V175L250 50Z" stroke="currentColor" strokeWidth="1" />
          <path d="M250 50L250 450M50 175L450 325M450 175L50 325" stroke="currentColor" strokeWidth=".5" />
          <path d="M250 130L370 205V305L250 380L130 305V205L250 130Z" stroke="currentColor" strokeWidth="1" />
          <path d="M250 210L310 245V295L250 330L190 295V245L250 210Z" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="fmz-loading-geo-br" width="360" height="360" viewBox="0 0 500 500" fill="none">
          <path d="M250 50L450 175V325L250 450L50 325V175L250 50Z" stroke="currentColor" strokeWidth="1" />
          <path d="M250 50L250 450M50 175L450 325M450 175L50 325" stroke="currentColor" strokeWidth=".5" />
          <path d="M250 130L370 205V305L250 380L130 305V205L250 130Z" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <header className="fmz-loading-strip">
        <div className="fmz-loading-strip-brand">
          <span className="fmz-loading-strip-mark">
            <Image
              priority
              src={fmzPublicLayoutConfig.logoPath}
              alt=""
              width={30}
              height={30}
              className="fmz-loading-logo-image"
            />
          </span>
          <span className="fmz-loading-strip-name">{fmzPublicLayoutConfig.appName}</span>
        </div>
        <div className="fmz-loading-strip-status">
          <span className="fmz-loading-live-dot" aria-hidden="true" />
          <span>sessão segura · sync ao vivo</span>
        </div>
      </header>

      <main className="fmz-loading-stage">
        {withBrand ? (
          <div className="fmz-loading-brand-block" aria-hidden="true">
            <div className="fmz-loading-ring" />
            <div className="fmz-loading-ticks">
              {tickIndexes.map((index) => (
                <span
                  key={index}
                  style={{ transform: `translateX(-50%) rotate(${(index * 360) / tickIndexes.length}deg)` }}
                />
              ))}
            </div>
            <div className="fmz-loading-ring fmz-loading-ring-outer" />
            <div className="fmz-loading-ring fmz-loading-ring-inner" />
            <div className="fmz-loading-brand-mark">
              <Image
                priority
                src={fmzPublicLayoutConfig.logoPath}
                alt="Propya"
                width={74}
                height={74}
                className="fmz-loading-logo-image"
              />
            </div>
          </div>
        ) : null}

        <span className="fmz-loading-eyebrow">Preparando seu painel</span>
        <h1 className="fmz-loading-title">{label}</h1>
        {description ? <p className="fmz-loading-lede">{description}</p> : null}

        <div className="fmz-loading-status" aria-hidden="true">
          {loadingStages.map((stage, index) => (
            <div
              key={stage.label}
              className={fmzCn('fmz-loading-status-row', stage.done && 'fmz-loading-status-row--done')}
              style={{ animationDelay: `${index * loadingStageDelaySeconds}s` }}
            >
              <stage.icon className="fmz-loading-status-icon" strokeWidth={2} />
              <span>{stage.label}</span>
              {stage.done ? null : (
                <span className="fmz-loading-dots">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
          ))}
        </div>
        <span className="sr-only">{effectiveStatusLabel}</span>

        <div className="fmz-loading-progress" role="progressbar" aria-label="Carregando" aria-valuemin={0} aria-valuemax={100}>
          <div className="fmz-loading-progress-fill" />
        </div>
        <div className="fmz-loading-progress-num">
          <strong>carregando</strong> · sincronizando
        </div>
      </main>

      <div className="fmz-loading-tip">
        <span className="fmz-loading-tip-icon" aria-hidden="true">
          <DollarSign strokeWidth={2.5} />
        </span>
        <span><strong>Sabia?</strong> Cada token reduz seu próximo aluguel proporcionalmente.</span>
      </div>
    </section>
  );
}
