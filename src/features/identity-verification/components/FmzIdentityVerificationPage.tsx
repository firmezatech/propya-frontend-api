'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, ShieldCheck, ShieldAlert, Clock, RefreshCw,
  Loader2, Lock, X, IdCard, User, FileText, MessageCircle,
  Home, Coins, Wallet, Target,
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

const SUCCESS_REDIRECT_MS = 10_000;

type SuccessViewProps = {
  userName: string | null;
};

function SuccessView({ userName }: SuccessViewProps) {
  const router = useRouter();

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push(fmzPublicLayoutConfig.connectedDashboardPath);
    }, SUCCESS_REDIRECT_MS);
    return () => clearTimeout(redirectTimer);
  }, [router]);

  const [verifiedAt] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${pad(now.getDate())} ${months[now.getMonth()]} ${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  const firstName = userName?.split(' ')[0] ?? null;
  const initials = userName
    ? userName.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : '✓';

  return (
    <FmzConnectedPageShell width="tenant">
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.scAccent} />
          <div className={styles.scBody}>

            {/* Animated shield */}
            <div className={styles.checkWrap} aria-hidden="true">
              <div className={`${styles.ring} ${styles.ring1}`} />
              <div className={`${styles.ring} ${styles.ring2}`} />
              <div className={`${styles.ring} ${styles.ring3}`} />
              <div className={styles.checkCircle}>
                <svg className={styles.shieldSvg} viewBox="0 0 24 24" fill="none">
                  <path
                    className={styles.shieldOutline}
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3l8 3v5c0 4.6-3.2 7.7-8 8.9C7.2 18.7 4 15.6 4 11V6z"
                  />
                  <polyline
                    className={styles.shieldTick}
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="8.5 11.8 11 14.3 15.6 9"
                  />
                </svg>
              </div>
            </div>

            <span className={styles.scBadge}>Identidade verificada</span>

            <h1 className={styles.scTitle}>
              Tudo certo{firstName ? `, ${firstName}` : ''}!
            </h1>
            <p className={styles.scSub}>
              Confirmamos sua identidade com sucesso. Sua conta na{' '}
              <strong>Propya</strong> está totalmente liberada para comprar e
              movimentar tokens sem restrições.
            </p>

            {/* Identity chip */}
            <div className={styles.idChip}>
              <div className={styles.idAvatar} aria-hidden="true">{initials}</div>
              <div className={styles.idInfo}>
                <div className={styles.idName}>{userName ?? 'Usuária verificada'}</div>
                <div className={styles.idDoc}>Identidade confirmada</div>
              </div>
              <span className={styles.verifiedBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Verificada
              </span>
            </div>

            {/* Meta row */}
            <div className={styles.idMeta}>
              <div className={styles.idMetaCell}>
                <div className={styles.idMetaLbl}>Verificada em</div>
                <div className={styles.idMetaVal}>{verifiedAt}</div>
              </div>
              <div className={styles.idMetaCell}>
                <div className={styles.idMetaLbl}>Status</div>
                <div className={styles.idMetaVal}>Aprovada</div>
              </div>
            </div>

            {/* Unlocked features */}
            <div className={styles.unlocked}>
              <div className={styles.unlockedHead}>Liberado para você</div>
              <div className={styles.ulItem}>
                <span className={styles.ulIco}><Coins style={{ width: 15, height: 15 }} aria-hidden="true" /></span>
                <span className={styles.ulText}>Comprar tokens de imóveis</span>
                <ShieldCheck className={styles.ulCheck} aria-hidden="true" />
              </div>
              <div className={styles.ulItem}>
                <span className={styles.ulIco}><Wallet style={{ width: 15, height: 15 }} aria-hidden="true" /></span>
                <span className={styles.ulText}>Movimentar valores na carteira</span>
                <ShieldCheck className={styles.ulCheck} aria-hidden="true" />
              </div>
              <div className={styles.ulItem}>
                <span className={styles.ulIco}><Target style={{ width: 15, height: 15 }} aria-hidden="true" /></span>
                <span className={styles.ulText}>Acompanhar sua meta de imóvel</span>
                <ShieldCheck className={styles.ulCheck} aria-hidden="true" />
              </div>
            </div>

            <button
              type="button"
              className={styles.sBtnGold}
              onClick={() => router.push(fmzPublicLayoutConfig.connectedDashboardPath)}
            >
              <Home style={{ width: 17, height: 17 }} aria-hidden="true" />
              Ir para o Dashboard
            </button>

          </div>
        </div>
      </div>
    </FmzConnectedPageShell>
  );
}

// ─── Failure view ─────────────────────────────────────────────────────────────

type FailureViewProps = {
  userName: string | null;
  kycStatus: TenantKycStatus;
  isRetrying: boolean;
  onRetry: () => void;
};

const FAILURE_TEXT: Partial<Record<TenantKycStatus, { title: string; subtitle: string }>> = {
  needs_resubmission: {
    title: 'Precisamos que você reenvie seus documentos',
    subtitle: 'Algumas informações não puderam ser confirmadas pela Didit. Inicie uma nova verificação reenviando seus documentos.',
  },
};

const DEFAULT_FAILURE_TEXT = {
  title: 'Não conseguimos verificar sua identidade',
  subtitle: 'Não foi possível confirmar sua identidade nesta tentativa. Sua conta na Propya permanece com acesso restrito até a verificação ser concluída.',
};

function FailureView({ userName, kycStatus, isRetrying, onRetry }: FailureViewProps) {
  const [evaluatedAt] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${pad(now.getDate())} ${months[now.getMonth()]} ${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  const initials = userName
    ? userName.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : '!';

  const { title, subtitle } = FAILURE_TEXT[kycStatus] ?? DEFAULT_FAILURE_TEXT;

  return (
    <FmzConnectedPageShell width="tenant">
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={`${styles.scAccent} ${styles.scAccentRed}`} />
          <div className={styles.scBody}>

            {/* Animated shield (X mark) */}
            <div className={styles.checkWrap} aria-hidden="true">
              <div className={`${styles.ring} ${styles.ring1} ${styles.ringRed}`} />
              <div className={`${styles.ring} ${styles.ring2} ${styles.ring2Red}`} />
              <div className={`${styles.ring} ${styles.ring3} ${styles.ring3Red}`} />
              <div className={`${styles.checkCircle} ${styles.checkCircleRed}`}>
                <svg className={styles.shieldSvg} viewBox="0 0 24 24" fill="none">
                  <path
                    className={styles.shieldOutline}
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3l8 3v5c0 4.6-3.2 7.7-8 8.9C7.2 18.7 4 15.6 4 11V6z"
                  />
                  <line className={styles.shieldTick} x1="9.5" y1="9.5" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                  <line className={styles.shieldTick} x1="14.5" y1="9.5" x2="9.5" y2="14.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <span className={`${styles.scBadge} ${styles.scBadgeRed}`}>Identidade não verificada</span>

            <h1 className={styles.scTitle}>{title}</h1>
            <p className={styles.scSub}>
              {subtitle}
            </p>

            {/* Identity chip */}
            <div className={`${styles.idChip} ${styles.idChipRed}`}>
              <div className={`${styles.idAvatar} ${styles.idAvatarRed}`} aria-hidden="true">{initials}</div>
              <div className={styles.idInfo}>
                <div className={styles.idName}>{userName ?? 'Usuária'}</div>
                <div className={`${styles.idDoc} ${styles.idDocRed}`}>Identidade não confirmada</div>
              </div>
              <span className={styles.notVerifiedBadge}>
                <X aria-hidden="true" />
                Não verificada
              </span>
            </div>

            {/* Meta row */}
            <div className={styles.idMeta}>
              <div className={styles.idMetaCell}>
                <div className={styles.idMetaLbl}>Avaliada em</div>
                <div className={styles.idMetaVal}>{evaluatedAt}</div>
              </div>
              <div className={styles.idMetaCell}>
                <div className={styles.idMetaLbl}>Status</div>
                <div className={styles.idMetaVal}>
                  {kycStatus === 'needs_resubmission' ? 'Reenvio necessário' : 'Reprovada'}
                </div>
              </div>
            </div>

            {/* What to do now */}
            <div className={styles.reason}>
              <div className={styles.reasonHead}>
                <ShieldAlert aria-hidden="true" />
                O que fazer agora
              </div>
              <div className={styles.reasonBody}>
                <p>Por segurança, não conseguimos concluir a verificação automaticamente. Você pode tentar novamente ou falar com o nosso suporte.</p>
                <ul className={styles.rsteps}>
                  <li className={styles.rstep}>
                    <span className={styles.rstepNum}>1</span>
                    <span>Tenha em mãos um documento oficial com foto (RG ou CNH), legível e dentro da validade.</span>
                  </li>
                  <li className={styles.rstep}>
                    <span className={styles.rstepNum}>2</span>
                    <span>Garanta boa iluminação e que todos os dados do documento estejam visíveis.</span>
                  </li>
                  <li className={styles.rstep}>
                    <span className={styles.rstepNum}>3</span>
                    <span>Se o problema persistir, nosso suporte pode revisar seu caso manualmente.</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              className={styles.sBtnGold}
              disabled={isRetrying}
              onClick={onRetry}
            >
              {isRetrying ? (
                <Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              ) : (
                <RefreshCw style={{ width: 17, height: 17 }} aria-hidden="true" />
              )}
              {isRetrying ? 'Iniciando...' : 'Tentar verificar novamente'}
            </button>
            <a href={fmzPublicLayoutConfig.helpUrl} target="_blank" rel="noopener noreferrer" className={styles.sBtnGhost}>
              <MessageCircle aria-hidden="true" />
              Falar com o suporte
            </a>

          </div>
        </div>
      </div>
    </FmzConnectedPageShell>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export function FmzIdentityVerificationPage() {
  const { kycState, sessionState, justVerified, justFailed, userName, startVerification, refetchKyc } =
    useFmzIdentityVerification();

  const isStarting = sessionState.status === 'starting';
  const sessionError = sessionState.status === 'error' ? sessionState.message : null;

  if (justVerified) {
    return <SuccessView userName={userName} />;
  }

  if (justFailed) {
    const failedStatus = kycState.status === 'ready' ? kycState.kycStatus : 'rejected';
    return (
      <FailureView
        userName={userName}
        kycStatus={failedStatus}
        isRetrying={isStarting}
        onRetry={() => void startVerification()}
      />
    );
  }

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

    </FmzConnectedPageShell>
  );
}
