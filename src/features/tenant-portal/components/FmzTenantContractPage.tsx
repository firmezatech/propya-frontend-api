'use client';

import type { ReactNode } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  ClipboardList,
  Coins,
  FileText,
  Home,
  KeyRound,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { FmzTenantDashboard } from '../domain';
import styles from './FmzTenantContractPage.module.css';

type FmzTenantContractPageProps = {
  dashboard: FmzTenantDashboard | null;
  contractDocumentUrl?: string | null;
};

type TenantDocumentItem = {
  title: string;
  meta: string;
  href?: string | null;
  icon: LucideIcon;
  tone: 'gold' | 'blue' | 'green' | 'red';
};

type TenantTimelineItem = {
  date: string;
  event: string;
  description: string;
  icon: LucideIcon;
  tone: 'done' | 'now' | 'warn' | 'future';
};

type TenantInfoItem = {
  title: string;
  body: ReactNode;
  icon: LucideIcon;
  tone?: 'default' | 'gold';
};

const heroImagePath = '/images/tenant/condominium-hero.png';

const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });
const shortDateFormatter = new Intl.DateTimeFormat('pt-BR');
const moneyNoCentsFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

const formatMoney = (value?: number | null, options?: { noCents?: boolean }): string => {
  const formatter = options?.noCents ? moneyNoCentsFormatter : moneyFormatter;
  return formatter.format(Number(value ?? 0));
};

const formatPercent = (value?: number | null): string => `${percentFormatter.format(Number(value ?? 0))}%`;

const formatDate = (value?: string | null, fallback = 'Não informado'): string => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return shortDateFormatter.format(date);
};

const formatLongDate = (value?: string | null, fallback = 'Data não informada'): string => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return fullDateFormatter.format(date);
};

const safeNumber = (value?: number | string | null, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback;

const resolveOwnershipPercentage = (ownership?: FmzTenantDashboard['ownership'] | null): number => {
  const tokenBalance = safeNumber(ownership?.tokenBalance, Number.NaN);
  const totalSupply = safeNumber(ownership?.totalSupply, Number.NaN);

  if (Number.isFinite(tokenBalance) && Number.isFinite(totalSupply) && totalSupply > 0) {
    return (tokenBalance / totalSupply) * 100;
  }

  return safeNumber(ownership?.currentPercentage, 7.2);
};

const normalizeDocumentType = (value?: string | null): string => String(value ?? '').trim().toLowerCase();

const formatFileSize = (value?: number | null): string | null => {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
};

const resolveAnnualAdjustment = (dashboard: FmzTenantDashboard | null) => {
  const contractAdjustment = dashboard?.contract?.annualAdjustment;
  const parameters = dashboard?.parameters as { annualAdjustment?: typeof contractAdjustment } | null | undefined;
  return contractAdjustment ?? parameters?.annualAdjustment ?? null;
};

function resolveAddress(dashboard: FmzTenantDashboard | null): { line: string; city: string } {
  const property = dashboard?.property;
  const tenant = dashboard?.tenant;
  const addressLine = [property?.addressLine1, property?.addressLine2].filter(Boolean).join(' — ')
    || tenant?.fullAddress
    || tenant?.address
    || 'Endereço do imóvel não informado';
  const postalCode = property?.postalCode ?? property?.zipcode;
  const cityParts = [property?.district, property?.city, property?.state].filter(Boolean);
  const cityLine = [cityParts.join(' · '), postalCode ? `CEP ${postalCode}` : null].filter(Boolean).join(' · ') || 'Cidade não informada';
  return { line: addressLine, city: cityLine };
}

function resolveContractStatus(status?: string | null): string {
  const normalized = String(status ?? '').trim().toLowerCase();
  const labels: Record<string, string> = {
    active: 'Contrato ativo',
    signed: 'Contrato ativo',
    pending: 'Contrato pendente',
    expired: 'Contrato vencido',
    canceled: 'Contrato cancelado',
    cancelled: 'Contrato cancelado',
  };
  return labels[normalized] ?? status ?? 'Contrato ativo';
}

function getToneClass(tone: TenantDocumentItem['tone']) {
  const classes = {
    gold: styles.cardIconGold,
    blue: styles.cardIconBlue,
    green: styles.cardIconGreen,
    red: styles.cardIconRed,
  };
  return classes[tone];
}

function getTimelineToneClass(tone: TenantTimelineItem['tone']) {
  const classes = {
    done: styles.timelineDotDone,
    now: styles.timelineDotNow,
    warn: styles.timelineDotWarn,
    future: styles.timelineDotFuture,
  };
  return classes[tone];
}

function resolveDocumentVisual(type?: string | null): { title: string; icon: LucideIcon; tone: TenantDocumentItem['tone'] } {
  const normalized = normalizeDocumentType(type);
  const visuals: Record<string, { title: string; icon: LucideIcon; tone: TenantDocumentItem['tone'] }> = {
    contrato_locacao: { title: 'Contrato de locação', icon: ClipboardList, tone: 'gold' },
    aditivo_contrato: { title: 'Aditivo contratual', icon: ClipboardList, tone: 'gold' },
    laudo_avaliacao: { title: 'Laudo de avaliação', icon: Search, tone: 'blue' },
    matricula: { title: 'Matrícula do imóvel', icon: Home, tone: 'green' },
    escritura: { title: 'Escritura do imóvel', icon: FileText, tone: 'green' },
    iptu: { title: 'Documento de IPTU', icon: Building2, tone: 'blue' },
    avcb: { title: 'AVCB', icon: ShieldCheck, tone: 'red' },
    other: { title: 'Documento do imóvel', icon: FileText, tone: 'blue' },
  };

  return visuals[normalized] ?? visuals.other;
}

function buildDocuments(dashboard: FmzTenantDashboard | null, contractDocumentUrl?: string | null): TenantDocumentItem[] {
  const backendDocuments = dashboard?.documents ?? [];
  const documents = backendDocuments.map((document) => {
    const visual = resolveDocumentVisual(document.type);
    const fileSize = formatFileSize(document.fileSizeBytes);
    const date = formatDate(document.createdAt, 'Data não informada');
    const fileName = document.fileName || visual.title;

    return {
      title: visual.title,
      meta: [fileName, fileSize, date].filter(Boolean).join(' · '),
      href: document.storagePath || null,
      icon: visual.icon,
      tone: visual.tone,
    };
  });

  if (contractDocumentUrl && !documents.some((document) => document.href === contractDocumentUrl)) {
    documents.unshift({
      title: 'Contrato de locação',
      meta: 'Assinado digitalmente · PDF',
      href: contractDocumentUrl,
      icon: ClipboardList,
      tone: 'gold',
    });
  }

  const propertyRegistry = dashboard?.property?.registryNumber;
  if (propertyRegistry && !documents.some((document) => document.title === 'Matrícula do imóvel')) {
    documents.push({
      title: 'Matrícula do imóvel',
      meta: `Matrícula ${propertyRegistry}`,
      href: null,
      icon: Home,
      tone: 'green',
    });
  }

  return documents.length > 0 ? documents : [
    {
      title: 'Contrato de locação',
      meta: 'Documento ainda não enviado pela gestora',
      href: null,
      icon: ClipboardList,
      tone: 'gold',
    },
  ];
}

function buildTimeline(dashboard: FmzTenantDashboard | null): TenantTimelineItem[] {
  const contract = dashboard?.contract;
  const startDate = formatLongDate(contract?.startDate, '01 de fevereiro de 2024');
  const endDate = formatLongDate(contract?.endDate, '01 de fevereiro de 2026');
  const ownershipPercentage = formatPercent(resolveOwnershipPercentage(dashboard?.ownership));
  const currentRent = formatMoney(contract?.currentRentAmount ?? dashboard?.rentInsight?.currentRentAmount ?? dashboard?.monthlySummary?.rentWithDiscountAmount ?? contract?.baseMonthlyRent ?? 0);

  return [
    {
      date: startDate,
      event: 'Contrato assinado',
      description: 'Início oficial da locação. Vistoria de entrada aprovada. Chaves entregues.',
      icon: CheckCircle2,
      tone: 'done',
    },
    {
      date: 'Primeiros meses de contrato',
      event: 'Primeiras compras de tokens',
      description: 'Você acumulou seus primeiros tokens do imóvel ao longo da jornada.',
      icon: Coins,
      tone: 'done',
    },
    {
      date: 'Durante a jornada',
      event: 'Primeiro desconto no aluguel',
      description: 'Com a posse de tokens, seu aluguel passou a considerar desconto proporcional.',
      icon: TrendingDown,
      tone: 'done',
    },
    {
      date: 'Hoje',
      event: `${ownershipPercentage} de posse · aluguel ${currentRent}`,
      description: 'Continue comprando tokens para aumentar sua participação e reduzir ainda mais o aluguel.',
      icon: MapPin,
      tone: 'now',
    },
    {
      date: endDate,
      event: 'Vencimento do contrato',
      description: 'Renovação ou encerramento. Seus tokens continuam seus em qualquer cenário.',
      icon: CalendarDays,
      tone: 'future',
    },
  ];
}

function buildInfoItems(dashboard: FmzTenantDashboard | null): TenantInfoItem[] {
  const annualAdjustment = resolveAnnualAdjustment(dashboard);
  const adjustmentLabel = annualAdjustment?.label ?? 'índice definido no contrato';
  const nextAdjustment = annualAdjustment?.nextAdjustmentDate ? ` Próximo reajuste previsto: ${formatDate(annualAdjustment.nextAdjustmentDate)}.` : '';
  const lastRate = annualAdjustment?.lastRatePercentage !== null && annualAdjustment?.lastRatePercentage !== undefined
    ? ` Última taxa aplicada: ${formatPercent(annualAdjustment.lastRatePercentage)}.`
    : '';

  return [
    {
      title: `Reajuste anual pelo ${adjustmentLabel}`,
      icon: KeyRound,
      body: `${annualAdjustment?.description ?? `O aluguel é reajustado conforme ${adjustmentLabel} acordado no contrato.`}${nextAdjustment}${lastRate}`,
    },
    {
      title: 'Manutenção: quem paga o quê?',
      icon: Wrench,
      body: 'Pequenos reparos são responsabilidade da inquilina. Problemas estruturais devem ser tratados com a gestora.',
    },
    {
      title: 'Seus tokens valorizam junto com o imóvel',
      icon: TrendingUp,
      tone: 'gold',
      body: (
        <>
          Quando o imóvel valoriza, sua participação acompanha essa valorização. Seu percentual de posse continua registrado na plataforma.
        </>
      ),
    },
    {
      title: 'Rescisão antecipada',
      icon: CalendarX,
      body: (
        <>
          Sair antes do término pode gerar multa conforme contrato. Seus tokens <span className={styles.infoHighlight}>continuam seus</span> e podem ser vendidos ou mantidos.
        </>
      ),
    },
    {
      title: 'Condomínio e IPTU',
      icon: Building2,
      body: 'Condomínio e IPTU seguem as regras do contrato e podem compor o boleto mensal conforme configuração da gestora.',
    },
    {
      title: 'Canal direto com a gestora',
      icon: MessageCircle,
      body: 'Para dúvidas sobre contrato, boletos ou manutenção, acesse o chat da plataforma ou os canais definidos pela gestora.',
    },
  ];
}

function TenantMetricCard({ label, value, sub, tone = 'default' }: { label: string; value: string; sub: React.ReactNode; tone?: 'default' | 'green' | 'red' }) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={`${styles.metricValue} ${tone === 'green' ? styles.metricValueGreen : ''} ${tone === 'red' ? styles.metricValueRed : ''}`}>{value}</div>
      <div className={styles.metricSub}>{sub}</div>
    </article>
  );
}

function TenantDocumentList({ documents }: { documents: TenantDocumentItem[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={`${styles.cardIcon} ${styles.cardIconGold}`}><FileText className="h-4 w-4" /></span>
        Documentos do imóvel
      </div>

      {documents.map((document) => {
        const Icon = document.icon;
        const href = document.href || '#';

        return (
          <a key={document.title} className={styles.docItem} href={href} target={href === '#' ? undefined : '_blank'} rel={href === '#' ? undefined : 'noreferrer'}>
            <span className={`${styles.docFileIcon} ${getToneClass(document.tone)}`}><Icon className="h-4 w-4" /></span>
            <span className={styles.docInfo}>
              <span className={styles.docName}>{document.title}</span>
              <span className={styles.docMeta}>{document.meta}</span>
            </span>
            <ArrowRight className={`${styles.docArrow} h-4 w-4`} />
          </a>
        );
      })}
    </div>
  );
}

function TenantOwnershipCard({ dashboard }: { dashboard: FmzTenantDashboard | null }) {
  const ownership = dashboard?.ownership;
  const ownershipPercentage = resolveOwnershipPercentage(ownership);
  const ownershipValue = safeNumber(ownership?.currentOwnedValue, 61488);
  const nextGoalPercentage = safeNumber(dashboard?.nextGoal?.percentage, 10);
  const amountNeeded = safeNumber(dashboard?.nextGoal?.amountNeeded, 3500);
  const rentReduction = safeNumber(dashboard?.nextGoal?.estimatedMonthlyRentReduction, 85);

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={`${styles.cardIcon} ${styles.cardIconGreen}`}><TrendingUp className="h-4 w-4" /></span>
        Sua participação no imóvel
      </div>
      <div className={styles.ownershipValueRow}>
        <span className={styles.ownershipValue}>{formatPercent(ownershipPercentage)}</span>
        <span className={styles.ownershipTotal}>de 100%</span>
      </div>
      <div className={styles.ownershipBody}>Equivale a <strong>{formatMoney(ownershipValue, { noCents: true })}</strong> em valor de mercado hoje</div>
      <div className={styles.ownershipBarTrack}>
        <div className={styles.ownershipBarFill} style={{ width: `${Math.min(Math.max(ownershipPercentage, 0), 100)}%` }} />
      </div>
      <div className={styles.ownershipBarLabels}>
        <span>0%</span>
        <span className={styles.ownershipGoal}>{formatPercent(nextGoalPercentage)} próxima meta</span>
        <span>100%</span>
      </div>
      <div className={styles.ownershipCallout}>
        <strong>Faltam {formatMoney(amountNeeded, { noCents: true })}</strong> em tokens para atingir {formatPercent(nextGoalPercentage)} e economizar mais {formatMoney(rentReduction, { noCents: true })}/mês no aluguel.
      </div>
    </div>
  );
}

function TenantContractTimeline({ items }: { items: TenantTimelineItem[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={`${styles.cardIcon} ${styles.cardIconBlue}`}><CalendarDays className="h-4 w-4" /></span>
        Linha do tempo do contrato
      </div>
      <div className={styles.timelineWrap}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;
          const isWarn = item.tone === 'warn';

          return (
            <div className={styles.timelineLine} key={`${item.date}-${item.event}`}>
              <div className={`${styles.timelineDot} ${getTimelineToneClass(item.tone)}`}><Icon className="h-4 w-4" /></div>
              <div className={`${styles.timelineInfo} ${isLast ? styles.timelineInfoLast : ''}`}>
                <div className={styles.timelineDate}>{item.date}</div>
                <div className={`${styles.timelineEvent} ${isWarn ? styles.timelineEventWarn : ''}`}>{item.event}</div>
                <div className={`${styles.timelineDesc} ${isWarn ? styles.timelineDescWarn : ''}`}>{item.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TenantImportantInfo({ items }: { items: TenantInfoItem[] }) {
  return (
    <div className={styles.infoGrid}>
      {items.map((item) => {
        const Icon = item.icon;
        const isGold = item.tone === 'gold';
        return (
          <article key={item.title} className={`${styles.infoItem} ${isGold ? styles.infoItemGold : ''}`}>
            <Icon className={`${styles.infoIcon} ${isGold ? styles.infoIconGreen : ''}`} />
            <div>
              <div className={styles.infoTitle}>{item.title}</div>
              <div className={styles.infoBody}>{item.body}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function FmzTenantContractPage({ dashboard, contractDocumentUrl }: FmzTenantContractPageProps) {
  const property = dashboard?.property;
  const contract = dashboard?.contract;
  const ownership = dashboard?.ownership;
  const rentInsight = dashboard?.rentInsight;
  const monthlySummary = dashboard?.monthlySummary;
  const address = resolveAddress(dashboard);

  const propertyValue = property?.appraisedValue ?? ownership?.totalPropertyValue ?? 854000;
  const currentRent = contract?.currentRentAmount ?? rentInsight?.currentRentAmount ?? monthlySummary?.rentWithDiscountAmount ?? contract?.baseMonthlyRent ?? 0;
  const originalRent = rentInsight?.originalRentAmount ?? monthlySummary?.originalRentAmount ?? contract?.originalBaseRent ?? contract?.baseMonthlyRent ?? 0;

  const documents = buildDocuments(dashboard, contractDocumentUrl);
  const timelineItems = buildTimeline(dashboard);
  const infoItems = buildInfoItems(dashboard);

  return (
    <section className={styles.page} aria-label="Meu imóvel e contrato">
      <div className={styles.photoHero}>
        <img className={styles.photoHeroImage} src={heroImagePath} alt="Imagem do condomínio" />
        <div className={styles.photoOverlay} />
        <div className={styles.photoTopBadge}><span className={styles.blinkDot} />{resolveContractStatus(contract?.status)}</div>
        <div className={styles.photoBottom}>
          <div className={styles.photoEyebrow}>Seu imóvel</div>
          <div className={styles.photoAddress}>{address.line}</div>
          <div className={styles.photoCity}>{[property?.name, address.city].filter(Boolean).join(' · ')}</div>
        </div>
      </div>

      <div className={styles.metricsStrip}>
        <TenantMetricCard label="Valor do imóvel" value={formatMoney(propertyValue, { noCents: true })} sub="Avaliação mais recente" />
        <TenantMetricCard label="Aluguel atual" value={formatMoney(currentRent)} tone="green" sub={<span className={styles.metricSubStrike}>{formatMoney(originalRent)} sem desconto</span>} />
        <TenantMetricCard label="Início do contrato" value={formatDate(contract?.startDate, '01/02/2024')} sub="Data de início da locação" />
        <TenantMetricCard label="Término do contrato" value={formatDate(contract?.endDate, '01/02/2026')} sub="Data final do contrato" />
      </div>

      <div className={styles.sectionLabel}>Contrato e documentação</div>
      <div className={styles.contentGrid}>
        <div className={styles.leftStack}>
          <TenantDocumentList documents={documents} />
          <TenantOwnershipCard dashboard={dashboard} />
        </div>
        <TenantContractTimeline items={timelineItems} />
      </div>

      <div className={styles.sectionLabel}>Informações importantes para você</div>
      <TenantImportantInfo items={infoItems} />
    </section>
  );
}
