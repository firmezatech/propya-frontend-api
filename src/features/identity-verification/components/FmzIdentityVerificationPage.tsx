'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, ShieldCheck, ShieldAlert, Clock, RefreshCw,
  Loader2, Lock, X, IdCard, User, FileText,
  Check, Home, LayoutDashboard,
} from 'lucide-react';
import { FmzConnectedPageShell } from '../../../components/layout';
import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import { useFmzIdentityVerification } from '../hooks/fmz-identity-verification';
import type { TenantKycStatus } from '../../tenant-portal/domain/fmz-tenant-profile.types';
import styles from './FmzIdentityVerificationPage.module.css';

// ─── Status config ────────────────────────────────────────────────────────────

type StatusConfig = {
  badge: string;
  title: string;
  description: string;
  barClass: string;
  badgeClass: string;
  iconClass: string;
  Icon: typeof Shield;
  canStart: boolean;
  actionLabel: string;
};

const STATUS_CONFIGS: Partial<Record<TenantKycStatus, StatusConfig>> = {
  verified: {
    badge: 'Verificado',
    title: 'Identidade verificada com sucesso',
    description: 'Você está autorizado a comprar tokens, assinar contratos e movimentar sua carteira.',
    barClass: styles.statusBarGreen,
    badgeClass: styles.statusBadgeGreen,
    iconClass: styles.statusIconGreen,
    Icon: ShieldCheck,
    canStart: false,
    actionLabel: '',
  },
  under_review: {
    badge: 'Em análise',
    title: 'Verificação enviada — aguardando análise',
    description: 'Seus documentos foram enviados para a Didit. O resultado chega por e-mail em instantes.',
    barClass: styles.statusBarBlue,
    badgeClass: styles.statusBadgeBlue,
    iconClass: styles.statusIconBlue,
    Icon: Clock,
    canStart: false,
    actionLabel: '',
  },
  rejected: {
    badge: 'Reprovado',
    title: 'Verificação não aprovada',
    description: 'A Didit não conseguiu confirmar sua identidade. Tente novamente com documentos em boa qualidade e boa iluminação.',
    barClass: styles.statusBarRed,
    badgeClass: styles.statusBadgeRed,
    iconClass: styles.statusIconRed,
    Icon: ShieldAlert,
    canStart: true,
    actionLabel: 'Tentar novamente',
  },
  needs_resubmission: {
    badge: 'Reenvio necessário',
    title: 'Documentos precisam ser resubmetidos',
    description: 'Algumas informações não puderam ser confirmadas. Inicie uma nova verificação para reenviar seus documentos.',
    barClass: styles.statusBarRed,
    badgeClass: styles.statusBadgeRed,
    iconClass: styles.statusIconRed,
    Icon: ShieldAlert,
    canStart: true,
    actionLabel: 'Reenviar documentos',
  },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  badge: 'Não iniciada',
  title: 'Sua identidade ainda não foi verificada',
  description: 'Conclua a verificação para comprar tokens, assinar contratos e movimentar sua carteira sem restrições.',
  barClass: styles.statusBarGold,
  badgeClass: styles.statusBadgeGold,
  iconClass: styles.statusIconGold,
  Icon: Shield,
  canStart: true,
  actionLabel: 'Iniciar verificação',
};

function resolveStatusConfig(kycStatus: TenantKycStatus): StatusConfig {
  return STATUS_CONFIGS[kycStatus] ?? DEFAULT_STATUS_CONFIG;
}

// ─── Success view ─────────────────────────────────────────────────────────────

const REDIRECT_COUNTDOWN_START = 10;

type SuccessViewProps = {
  userName: string | null;
};

function SuccessView({ userName }: SuccessViewProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_START);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Separated from the interval so router.push never runs inside a setState updater.
  useEffect(() => {
    if (countdown > 0 || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    router.push(fmzPublicLayoutConfig.connectedDashboardPath);
  }, [countdown, router]);

  return (
    <FmzConnectedPageShell width="tenant">
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.scBar} />

          <span className={styles.scBadge}>Identidade verificada</span>

          <div className={styles.scIco}>
            <ShieldCheck className={styles.scIcoSvg} aria-hidden="true" />
          </div>

          <h1 className={styles.scTitle}>
            Pronto{userName ? `, ${userName}` : ''} — você está verificado!
          </h1>
          <p className={styles.scSub}>
            Sua identidade foi confirmada com sucesso. Seu cadastro está{' '}
            <strong>100% completo</strong> e o painel do inquilino já está liberado.
          </p>

          <div className={styles.nextList}>
            <div className={styles.nextItem}>
              <span className={`${styles.niIc} ${styles.niIcDone}`}>
                <Check style={{ width: 17, height: 17 }} aria-hidden="true" />
              </span>
              <div className={styles.niBody}>
                <strong>Conta criada e e-mail confirmado</strong>
                <span>Acesso ativo</span>
              </div>
              <span className={`${styles.niStep} ${styles.niStepDone}`}>✓</span>
            </div>
            <div className={styles.nextItem}>
              <span className={`${styles.niIc} ${styles.niIcDone}`}>
                <Check style={{ width: 17, height: 17 }} aria-hidden="true" />
              </span>
              <div className={styles.niBody}>
                <strong>Identidade verificada</strong>
                <span>Carteira e compras liberadas</span>
              </div>
              <span className={`${styles.niStep} ${styles.niStepDone}`}>✓</span>
            </div>
            <div className={styles.nextItem}>
              <span className={styles.niIc}>
                <Home style={{ width: 17, height: 17 }} aria-hidden="true" />
              </span>
              <div className={styles.niBody}>
                <strong>Acompanhe seu imóvel</strong>
                <span>Contrato, aluguel e tokens</span>
              </div>
              <span className={styles.niStep}>→</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.sBtnGold}
            onClick={() => router.push(fmzPublicLayoutConfig.connectedDashboardPath)}
          >
            <LayoutDashboard style={{ width: 16, height: 16 }} aria-hidden="true" />
            Acessar meu painel
          </button>

          <p className={styles.successCountdown}>
            Redirecionando em <strong>{countdown}</strong>{' '}
            {countdown === 1 ? 'segundo' : 'segundos'}...
          </p>
        </div>
      </div>
    </FmzConnectedPageShell>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export function FmzIdentityVerificationPage() {
  const { kycState, sessionState, justVerified, userName, startVerification, closeSession, refetchKyc } =
    useFmzIdentityVerification();

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sessionState.status === 'open') {
      closeButtonRef.current?.focus();
    }
  }, [sessionState.status]);

  const handleClose = useCallback(() => {
    closeSession();
    triggerButtonRef.current?.focus();
  }, [closeSession]);

  useEffect(() => {
    if (sessionState.status !== 'open') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sessionState.status, handleClose]);

  if (justVerified) {
    return <SuccessView userName={userName} />;
  }

  const isStarting = sessionState.status === 'starting';
  const sessionError = sessionState.status === 'error' ? sessionState.message : null;

  // ── Status panel ───────────────────────────────────────────────────────────

  const renderStatusPanel = () => {
    if (kycState.status === 'loading') {
      return (
        <div className={styles.statusPanel}>
          <div className={`${styles.statusBar} ${styles.statusBarGold}`} />
          <div className={styles.statusBody}>
            <div className={styles.stateCard} style={{ border: 0, padding: '16px 0' }}>
              <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              Carregando status...
            </div>
          </div>
        </div>
      );
    }

    if (kycState.status === 'error') {
      return (
        <div className={styles.stateCard}>
          <ShieldAlert style={{ width: 22, height: 22 }} aria-hidden="true" />
          <span>{kycState.message}</span>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => void refetchKyc()}
          >
            <RefreshCw style={{ width: 14, height: 14 }} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      );
    }

    const config = resolveStatusConfig(kycState.kycStatus);
    const { Icon } = config;

    return (
      <div className={styles.statusPanel}>
        <div className={`${styles.statusBar} ${config.barClass}`} />
        <div className={styles.statusBody}>
          <div className={`${styles.statusIcon} ${config.iconClass}`}>
            <Icon style={{ width: 20, height: 20 }} aria-hidden="true" />
          </div>
          <div className={styles.statusText}>
            <span className={`${styles.statusBadge} ${config.badgeClass}`}>
              {config.badge}
            </span>
            <h2 className={styles.statusTitle}>{config.title}</h2>
            <p className={styles.statusDesc}>{config.description}</p>
            {sessionError ? <p className={styles.sessionError}>{sessionError}</p> : null}
            {config.canStart ? (
              <div className={styles.statusActions}>
                <button
                  ref={triggerButtonRef}
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={isStarting}
                  onClick={() => void startVerification()}
                >
                  {isStarting ? (
                    <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                  ) : (
                    <Shield style={{ width: 15, height: 15 }} aria-hidden="true" />
                  )}
                  {isStarting ? 'Iniciando...' : config.actionLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <FmzConnectedPageShell width="tenant">
      <div className={styles.page}>

        <header>
          <p className={styles.eyebrow}>Segurança da conta · KYC</p>
          <h1 className={styles.title}>Verificação de identidade</h1>
          <p className={styles.subtitle}>
            Confirme quem você é para liberar a compra de tokens, saques e movimentações acima dos
            limites básicos. O processo é conduzido pela <strong>Didit</strong>, nossa parceira de
            verificação, e leva cerca de <strong>2 minutos</strong>.
          </p>
        </header>

        {renderStatusPanel()}

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={`${styles.cardIcon} ${styles.cardIconNavy}`}>
                <ShieldCheck style={{ width: 16, height: 16 }} aria-hidden="true" />
              </span>
              <div className={styles.cardHeadText}>
                <h3>Como funciona</h3>
                <p>Três etapas dentro da janela segura da Didit</p>
              </div>
            </div>
            <div className={styles.cardBody}>
              <ol className={styles.steps}>
                <li className={styles.step}>
                  <span className={styles.stepNum}>1</span>
                  <div className={styles.stepBody}>
                    <h4>Documento oficial</h4>
                    <p>Fotografe a frente e o verso do seu RG ou CNH. A Didit lê os dados automaticamente.</p>
                  </div>
                </li>
                <li className={styles.step}>
                  <span className={styles.stepNum}>2</span>
                  <div className={styles.stepBody}>
                    <h4>Prova de vida (selfie)</h4>
                    <p>Uma selfie rápida com detecção de vivacidade confirma que é você — não uma foto.</p>
                  </div>
                </li>
                <li className={styles.step}>
                  <span className={styles.stepNum}>3</span>
                  <div className={styles.stepBody}>
                    <h4>Análise automática</h4>
                    <p>O cruzamento de dados acontece em segundos. Casos de borda passam por revisão humana.</p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={`${styles.cardIcon} ${styles.cardIconGold}`}>
                <IdCard style={{ width: 16, height: 16 }} aria-hidden="true" />
              </span>
              <div className={styles.cardHeadText}>
                <h3>O que será coletado</h3>
                <p>Dados usados apenas para a verificação</p>
              </div>
            </div>
            <div className={styles.cardBody}>
              <ul className={styles.collectList}>
                <li className={styles.collectItem}>
                  <span className={styles.collectIcon}>
                    <IdCard aria-hidden="true" />
                  </span>
                  <div className={styles.collectBody}>
                    <h4>Documento de identidade</h4>
                    <p>RG ou CNH — frente e verso</p>
                  </div>
                </li>
                <li className={styles.collectItem}>
                  <span className={styles.collectIcon}>
                    <User aria-hidden="true" />
                  </span>
                  <div className={styles.collectBody}>
                    <h4>Selfie com prova de vida</h4>
                    <p>Detecção de vivacidade (liveness)</p>
                  </div>
                </li>
                <li className={styles.collectItem}>
                  <span className={styles.collectIcon}>
                    <FileText aria-hidden="true" />
                  </span>
                  <div className={styles.collectBody}>
                    <h4>Confirmação de dados</h4>
                    <p>Nome completo e CPF</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div className={styles.trust}>
          <div className={styles.trustItem}>
            <Lock aria-hidden="true" />
            <div className={styles.trustBody}>
              <h5>Criptografia ponta a ponta</h5>
              <p>Imagens trafegam cifradas e não ficam no seu dispositivo.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <ShieldCheck aria-hidden="true" />
            <div className={styles.trustBody}>
              <h5>Conforme a LGPD</h5>
              <p>Tratamos seus dados conforme a Lei 13.709/2018. Você pode solicitar exclusão.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <Clock aria-hidden="true" />
            <div className={styles.trustBody}>
              <h5>Leva ~2 minutos</h5>
              <p>Resultado automático na maioria dos casos, direto na sua conta.</p>
            </div>
          </div>
        </div>

        <p className={styles.legal}>
          Ao iniciar, você concorda em compartilhar os dados acima com a <strong>Didit</strong> para
          fins de verificação de identidade, conforme a{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
          {' '}e os{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer">Termos de Uso</a>
          {' '}da Propya.
        </p>

      </div>

      {sessionState.status === 'open' ? (
        <div className={styles.overlay} role="presentation">
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Verificação segura — Didit"
          >
            <div className={styles.modalChrome}>
              <span className={styles.modalLock}>
                <Lock aria-hidden="true" />
              </span>
              <span className={styles.modalHost}>verify.didit.me</span>
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.modalClose}
                onClick={handleClose}
                aria-label="Fechar verificação"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <iframe
              className={styles.modalIframe}
              src={sessionState.verificationUrl}
              title="Verificação de identidade — Didit"
              allow="camera; microphone; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : null}

    </FmzConnectedPageShell>
  );
}
