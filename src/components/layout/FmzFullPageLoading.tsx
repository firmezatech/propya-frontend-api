import Image from 'next/image';
import { fmzCn } from '../../lib/fmz-classnames';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

type FmzFullPageLoadingProps = {
  label?: string;
  description?: string;
  className?: string;
  withBrand?: boolean;
  statusLabel?: string;
};

const loadingStages = [
  'autenticando sessão',
  'lendo contrato do imóvel',
  'sincronizando carteira de tokens',
  'calculando posse atual',
  'preparando dados do painel',
];

const tickIndexes = Array.from({ length: 24 }, (_, index) => index);

export function FmzFullPageLoading({
  label = 'Sincronizando o seu imóvel, token a token.',
  description = 'Pegando seu saldo, posse atual, último boleto e a leitura do contrato. Leva só alguns segundos.',
  className,
  withBrand = true,
  statusLabel,
}: FmzFullPageLoadingProps) {
  const effectiveStatusLabel = statusLabel ?? loadingStages[0];

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
                alt="FirmezaToken"
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
            <div key={stage} className="fmz-loading-status-row" style={{ animationDelay: `${index * 1.45}s` }}>
              <span className="fmz-loading-status-icon">●</span>
              <span>{stage}</span>
              <span className="fmz-loading-dots">
                <span />
                <span />
                <span />
              </span>
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
        <span className="fmz-loading-tip-icon" aria-hidden="true">$</span>
        <span><strong>Sabia?</strong> Cada token reduz seu próximo aluguel proporcionalmente.</span>
      </div>
    </section>
  );
}
