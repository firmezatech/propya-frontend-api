'use client';

import { useState, type ReactNode } from 'react';
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
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { FmzTenantContractPageData } from '../domain/fmz-tenant-contract.types';
import styles from './FmzTenantContractPage.module.css';

type FmzTenantContractPageProps = {
  contractPage: FmzTenantContractPageData | null;
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

const safeNumber = (value?: number | string | null): number =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const resolveOwnershipPercentage = (ownership?: FmzTenantContractPageData['ownership'] | null): number => {
  const tokenBalance = Number(ownership?.tokenBalance);
  const totalSupply = Number(ownership?.totalSupply);

  if (Number.isFinite(tokenBalance) && Number.isFinite(totalSupply) && totalSupply > 0) {
    return (tokenBalance / totalSupply) * 100;
  }

  return safeNumber(ownership?.currentPercentage);
};

const normalizeDocumentType = (value?: string | null): string => String(value ?? '').trim().toLowerCase();

const formatFileSize = (value?: number | null): string | null => {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
};

const resolveAnnualAdjustment = (contractPage: FmzTenantContractPageData | null) =>
  contractPage?.contract?.annualAdjustment ?? null;

function resolveAddress(contractPage: FmzTenantContractPageData | null): { line: string; city: string } {
  const property = contractPage?.property;
  const tenant = contractPage?.tenant;
  const addressLine = [property?.addressLine1, property?.addressLine2].filter(Boolean).join(' — ')
    || tenant?.fullAddress
    || tenant?.address
    || 'Endereço do imóvel não informado';
  const postalCode = property?.postalCode ?? property?.zipcode;
  const cityParts = [property?.district, property?.city, property?.state].filter(Boolean);
  const cityLine = [cityParts.join(' · '), postalCode ? `CEP ${postalCode}` : null].filter(Boolean).join(' · ') || 'Cidade não informada';
  return { line: addressLine, city: cityLine };
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  active: 'Contrato ativo',
  signed: 'Contrato ativo',
  pending: 'Contrato pendente',
  expired: 'Contrato vencido',
  canceled: 'Contrato cancelado',
  cancelled: 'Contrato cancelado',
};

function resolveContractStatus(status?: string | null): string {
  const normalized = String(status ?? '').trim().toLowerCase();
  return CONTRACT_STATUS_LABELS[normalized] ?? status ?? 'Contrato ativo';
}

const TIMELINE_TONE_CLASSES: Record<TenantTimelineItem['tone'], string> = {
  done: styles.timelineDotDone,
  now: styles.timelineDotNow,
  warn: styles.timelineDotWarn,
  future: styles.timelineDotFuture,
};

const DOCUMENT_VISUALS: Record<string, { title: string; icon: LucideIcon; tone: TenantDocumentItem['tone'] }> = {
  contrato_locacao: { title: 'Contrato de locação', icon: ClipboardList, tone: 'gold' },
  aditivo_contrato: { title: 'Aditivo contratual', icon: ClipboardList, tone: 'gold' },
  laudo_avaliacao: { title: 'Laudo de avaliação', icon: Search, tone: 'blue' },
  matricula: { title: 'Matrícula do imóvel', icon: Home, tone: 'green' },
  escritura: { title: 'Escritura do imóvel', icon: FileText, tone: 'green' },
  iptu: { title: 'Documento de IPTU', icon: Building2, tone: 'blue' },
  avcb: { title: 'AVCB', icon: ShieldCheck, tone: 'red' },
  other: { title: 'Documento do imóvel', icon: FileText, tone: 'blue' },
};

function resolveDocumentVisual(type?: string | null) {
  return DOCUMENT_VISUALS[normalizeDocumentType(type)] ?? DOCUMENT_VISUALS.other;
}

function buildDocuments(contractPage: FmzTenantContractPageData | null, contractDocumentUrl?: string | null): TenantDocumentItem[] {
  const backendDocuments = contractPage?.documents ?? [];
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

  const propertyRegistry = contractPage?.property?.registryNumber;
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

function buildTimeline(contractPage: FmzTenantContractPageData | null): TenantTimelineItem[] {
  const contract = contractPage?.contract;
  const startDate = formatLongDate(contract?.startDate);
  const endDate = formatLongDate(contract?.endDate);
  const ownershipPercentage = formatPercent(resolveOwnershipPercentage(contractPage?.ownership));
  const currentRent = formatMoney(
    contract?.currentRentAmount ?? contractPage?.rentInsight?.currentRentAmount ?? contract?.baseMonthlyRent ?? 0,
  );

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

function buildInfoItems(contractPage: FmzTenantContractPageData | null): TenantInfoItem[] {
  const annualAdjustment = resolveAnnualAdjustment(contractPage);
  const adjustmentLabel = annualAdjustment?.label ?? 'índice definido no contrato';
  const nextAdjustment = annualAdjustment?.nextAdjustmentDate
    ? ` Próximo reajuste previsto: ${formatDate(annualAdjustment.nextAdjustmentDate)}.`
    : '';
  const lastRate = annualAdjustment?.lastRatePercentage != null
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
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIco}><FileText className="h-[13px] w-[13px]" /></span>
          Documentos do imóvel
        </div>
        <span className={styles.cardAction}>Baixar todos</span>
      </div>

      {documents.map((document) => {
        const Icon = document.icon;
        const href = document.href || '#';

        return (
          <a key={document.title} className={`${styles.docItem} fmz-lift-card`} href={href} target={href === '#' ? undefined : '_blank'} rel={href === '#' ? undefined : 'noreferrer'}>
            <span className={styles.docFileIcon}><Icon className="h-4 w-4" /></span>
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

function TenantEconomySnapshotCard({ contractPage }: { contractPage: FmzTenantContractPageData | null }) {
  const rentInsight = contractPage?.rentInsight;
  const contract = contractPage?.contract;
  const monthlySavings = safeNumber(rentInsight?.monthlySavingsAmount);
  const originalRent = safeNumber(rentInsight?.originalRentAmount ?? contract?.baseMonthlyRent);
  const currentRent = safeNumber(rentInsight?.currentRentAmount ?? contract?.currentRentAmount ?? contract?.baseMonthlyRent);
  const savings = monthlySavings > 0 ? monthlySavings : Math.max(originalRent - currentRent, 0);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIco}><TrendingUp className="h-[13px] w-[13px]" /></span>
          Sua economia até hoje
        </div>
      </div>
      <div className={styles.economyValue}>
        <span className={styles.economyAmount}>{formatMoney(savings)}</span>
        <span className={styles.economySub}>economizados por mês</span>
      </div>
      {contract?.startDate && (
        <div className={styles.economyMeta}>
          <span>Desde {formatDate(contract.startDate)}</span>
        </div>
      )}
      <svg viewBox="0 0 280 50" width="100%" height="50" className={styles.sparkline} aria-hidden="true">
        <defs>
          <linearGradient id="ct-spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8B620" stopOpacity=".25" />
            <stop offset="100%" stopColor="#E8B620" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,45 L20,44 L40,42 L60,40 L80,36 L100,32 L120,30 L140,26 L160,22 L180,18 L200,16 L220,12 L240,10 L260,7 L280,5 L280,50 L0,50 Z" fill="url(#ct-spark)" />
        <path d="M0,45 L20,44 L40,42 L60,40 L80,36 L100,32 L120,30 L140,26 L160,22 L180,18 L200,16 L220,12 L240,10 L260,7 L280,5" fill="none" stroke="#E8B620" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function TenantContractTimeline({ items }: { items: TenantTimelineItem[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIco}><CalendarDays className="h-[13px] w-[13px]" /></span>
          Linha do tempo
        </div>
      </div>
      <div className={styles.timelineWrap}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;
          const isNow = item.tone === 'now';
          const isWarn = item.tone === 'warn';

          return (
            <div className={styles.timelineLine} key={`${item.date}-${item.event}`}>
              <div className={`${styles.timelineDot} ${TIMELINE_TONE_CLASSES[item.tone]}`}><Icon className="h-3 w-3" /></div>
              <div className={`${styles.timelineInfo} ${isLast ? styles.timelineInfoLast : ''}`}>
                <div className={styles.timelineDate}>{item.date}</div>
                <div className={`${styles.timelineEvent} ${isWarn ? styles.timelineEventWarn : ''}`}>
                  {item.event}
                  {isNow && <span className={styles.timelineNowTag}>Agora</span>}
                </div>
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
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className={styles.infoList}>
      {items.map((item, i) => {
        const Icon = item.icon;
        const isOpen = i === openIndex;
        return (
          <div key={item.title} className={`${styles.infoRow} ${isOpen ? styles.infoRowOpen : ''}`}>
            <button
              type="button"
              className={styles.infoQ}
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
            >
              <span className={styles.infoIco}><Icon className="h-4 w-4" /></span>
              <div className={styles.infoQText}>
                <div className={styles.infoQTitle}>{item.title}</div>
              </div>
              <svg className={styles.infoQChev} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={styles.infoA}>
              <div className={styles.infoAInner}>{item.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TenantPropertyHeroCard({ contractPage }: { contractPage: FmzTenantContractPageData | null }) {
  const address = resolveAddress(contractPage);
  const property = contractPage?.property;
  const contract = contractPage?.contract;

  return (
    <div className={styles.propCard}>
      <div className={styles.propHead}>
        <div>
          <div className={styles.propEyebrow}>Endereço</div>
          <div className={styles.propAddress}>{address.line}</div>
          <div className={styles.propCity}>{address.city}</div>
        </div>
        {(property?.code ?? contract?.contractNumber) && (
          <span className={styles.propId}>#{property?.code ?? contract?.contractNumber}</span>
        )}
      </div>
      <div className={styles.propFoot}>
        <div className={styles.propSpec}>
          {property?.type && (
            <div className={styles.propSpecItem}>
              <span className={styles.propSpecKey}>Tipo</span>
              <span className={styles.propSpecVal}>{property.type}</span>
            </div>
          )}
          {contract?.startDate && (
            <div className={styles.propSpecItem}>
              <span className={styles.propSpecKey}>Início</span>
              <span className={styles.propSpecVal}>{formatDate(contract.startDate)}</span>
            </div>
          )}
          {contract?.endDate && (
            <div className={styles.propSpecItem}>
              <span className={styles.propSpecKey}>Término</span>
              <span className={styles.propSpecVal}>{formatDate(contract.endDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TenantOwnershipHeroCard({ contractPage }: { contractPage: FmzTenantContractPageData | null }) {
  const ownership = contractPage?.ownership;
  const pct = resolveOwnershipPercentage(ownership);
  const nextGoal = contractPage?.nextGoal;
  const amountNeeded = safeNumber(nextGoal?.amountNeeded);
  const ownedValue = safeNumber(ownership?.currentOwnedValue);

  const RADIUS = 40;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE - (Math.min(Math.max(pct, 0), 100) / 100) * CIRCUMFERENCE;

  return (
    <div className={styles.ownCard}>
      <div className={styles.ownHead}>
        <span className={styles.ownLabel}>Sua participação</span>
        {nextGoal?.percentage != null && (
          <span className={styles.ownBadge}>
            Próx. meta {formatPercent(nextGoal.percentage)}
          </span>
        )}
      </div>
      <div className={styles.ownBody}>
        <div className={styles.ownDonut}>
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="#F0F1F5" strokeWidth="10" />
            <circle
              cx="48" cy="48" r={RADIUS} fill="none"
              stroke="var(--fmz-gold)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)' }}
            />
          </svg>
          <div className={styles.ownPct}>{formatPercent(pct)}</div>
        </div>
        <div className={styles.ownInfo}>
          {ownedValue > 0 && (
            <>
              <div className={styles.ownInfoValue}>{formatMoney(ownedValue, { noCents: true })}</div>
              <div className={styles.ownInfoSub}>valor de mercado da sua fatia</div>
            </>
          )}
        </div>
      </div>
      <div className={styles.ownFoot}>
        {amountNeeded > 0 ? (
          <span>Faltam <strong>{formatMoney(amountNeeded, { noCents: true })}</strong> para a próxima meta</span>
        ) : (
          <span>Tokens acumulados ao longo do contrato</span>
        )}
        <a href="/connected/coming-soon" className={styles.ownFootLink}>
          Comprar tokens <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export function FmzTenantContractPage({ contractPage, contractDocumentUrl }: FmzTenantContractPageProps) {
  const property = contractPage?.property;
  const contract = contractPage?.contract;
  const rentInsight = contractPage?.rentInsight;

  const propertyValue = property?.appraisedValue ?? contractPage?.ownership?.totalPropertyValue ?? 0;
  const currentRent = contract?.currentRentAmount ?? rentInsight?.currentRentAmount ?? contract?.baseMonthlyRent ?? 0;
  const originalRent = rentInsight?.originalRentAmount ?? contract?.originalBaseRent ?? contract?.baseMonthlyRent ?? 0;

  const contractStatus = resolveContractStatus(contract?.status);

  const documents = buildDocuments(contractPage, contractDocumentUrl);
  const timelineItems = buildTimeline(contractPage);
  const infoItems = buildInfoItems(contractPage);

  return (
    <section className={styles.page} aria-label="Meu imóvel e contrato">
      {/* Page head */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadLeft}>
          <h1>Meu Imóvel</h1>
          <div className={styles.pageHeadSub}>
            <span className={styles.pageHeadPill}>
              <span className={styles.pageHeadPillDot} />
              {contractStatus}
            </span>
            {contract?.startDate && <span>Locação iniciada em {formatDate(contract.startDate)}</span>}
          </div>
        </div>
        <div className={styles.pageHeadRight}>
          <a href="/connected/coming-soon" className={styles.btnPrimary}>
            <Plus className="h-4 w-4" /> Comprar tokens
          </a>
        </div>
      </div>

      {/* Hero 2-col */}
      <section className={styles.hero}>
        <TenantPropertyHeroCard contractPage={contractPage} />
        <TenantOwnershipHeroCard contractPage={contractPage} />
      </section>

      {/* Metrics strip (3 cards) */}
      <div className={styles.metricsStrip}>
        <TenantMetricCard
          label="Valor do imóvel"
          value={propertyValue > 0 ? formatMoney(propertyValue, { noCents: true }) : 'Não informado'}
          sub="Avaliação mais recente"
        />
        <TenantMetricCard
          label="Aluguel mensal"
          value={formatMoney(currentRent)}
          tone="green"
          sub={<span className={styles.metricSubStrike}>{formatMoney(originalRent)} sem desconto</span>}
        />
        <TenantMetricCard
          label="Período do contrato"
          value={contract?.startDate ? formatDate(contract.startDate) : 'Não informado'}
          sub={contract?.endDate ? `até ${formatDate(contract.endDate)}` : 'Vigente'}
        />
      </div>

      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelTitle}>Contrato e histórico</span>
      </div>
      <div className={styles.contentGrid}>
        <div className={styles.leftStack}>
          <TenantDocumentList documents={documents} />
          <TenantEconomySnapshotCard contractPage={contractPage} />
        </div>
        <TenantContractTimeline items={timelineItems} />
      </div>

      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelTitle}>Informações importantes</span>
      </div>
      <TenantImportantInfo items={infoItems} />
    </section>
  );
}
