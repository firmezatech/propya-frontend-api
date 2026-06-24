'use client';

import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  Home,
  Search,
  ShieldCheck,
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
};

type TenantSpecItem = {
  key: string;
  value: string;
  unit?: string;
};

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR');
const moneyNoCentsFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const formatMoneyNoCents = (value?: number | null): string => moneyNoCentsFormatter.format(Number(value ?? 0));

const formatDate = (value?: string | null, fallback = 'Não informado'): string => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return shortDateFormatter.format(date);
};

const normalizeDocumentType = (value?: string | null): string => String(value ?? '').trim().toLowerCase();

const formatFileSize = (value?: number | null): string | null => {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
};

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

const DOCUMENT_VISUALS: Record<string, { title: string; icon: LucideIcon }> = {
  contrato_locacao: { title: 'Contrato de locação', icon: ClipboardList },
  aditivo_contrato: { title: 'Aditivo contratual', icon: ClipboardList },
  laudo_avaliacao: { title: 'Laudo de vistoria', icon: Search },
  matricula: { title: 'Matrícula do imóvel', icon: Home },
  escritura: { title: 'Escritura do imóvel', icon: FileText },
  iptu: { title: 'Documento de IPTU', icon: Building2 },
  avcb: { title: 'AVCB', icon: ShieldCheck },
  other: { title: 'Documento do imóvel', icon: FileText },
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
    };
  });

  if (contractDocumentUrl && !documents.some((document) => document.href === contractDocumentUrl)) {
    documents.unshift({
      title: 'Contrato de locação',
      meta: 'Assinado digitalmente · PDF',
      href: contractDocumentUrl,
      icon: ClipboardList,
    });
  }

  const propertyRegistry = contractPage?.property?.registryNumber;
  if (propertyRegistry && !documents.some((document) => document.title === 'Matrícula do imóvel')) {
    documents.push({
      title: 'Matrícula do imóvel',
      meta: `Matrícula ${propertyRegistry}`,
      href: null,
      icon: Home,
    });
  }

  return documents.length > 0 ? documents : [
    {
      title: 'Contrato de locação',
      meta: 'Documento ainda não enviado pela gestora',
      href: null,
      icon: ClipboardList,
    },
  ];
}

function buildSpecs(property: FmzTenantContractPageData['property']): TenantSpecItem[] {
  const specs: TenantSpecItem[] = [];

  if (property?.totalAreaM2) {
    specs.push({ key: 'Área útil', value: String(property.totalAreaM2), unit: 'm²' });
  }
  if (property?.bedroomsCount != null) {
    specs.push({ key: 'Quartos', value: String(property.bedroomsCount) });
  }
  if (property?.monthlyCondoFeeAmount) {
    specs.push({ key: 'Condomínio', value: formatMoneyNoCents(property.monthlyCondoFeeAmount), unit: '/mês' });
  }
  if (property?.annualPropertyTaxAmount) {
    specs.push({ key: 'IPTU', value: formatMoneyNoCents(property.annualPropertyTaxAmount), unit: '/ano' });
  }

  return specs;
}

function PropertyGallery({ address }: { address: { line: string; city: string } }) {
  return (
    <section className={styles.gallery}>
      <div className={styles.galleryMain}>
        {/* Fixed property photo — set by the platform, not editable by the tenant. */}
        <img className={styles.galleryImage} src="/property-placeholder.png" alt={address.line} />
        <div className={styles.galleryCap}>
          <div className={styles.galleryCapAddr}>{address.line}</div>
          <div className={styles.galleryCapCity}>{address.city}</div>
        </div>
      </div>
    </section>
  );
}

function PropertyAbout({ address, registryCode, specs }: { address: { line: string; city: string }; registryCode: string | null; specs: TenantSpecItem[] }) {
  return (
    <section className={styles.about}>
      <div className={styles.aboutHead}>
        <div>
          <div className={styles.addrEyebrow}>Endereço</div>
          <div className={styles.addrMain}>{address.line}</div>
          <div className={styles.addrCity}>{address.city}</div>
        </div>
        {registryCode && <span className={styles.propId}>#{registryCode}</span>}
      </div>
      {specs.length > 0 && (
        <div className={styles.specs}>
          {specs.map((spec) => (
            <div className={styles.spec} key={spec.key}>
              <div className={styles.specKey}>{spec.key}</div>
              <div className={styles.specValue}>
                {spec.value}
                {spec.unit && <span className={styles.specUnit}>{spec.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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
      </div>

      <div className={styles.docsGrid}>
        {documents.map((document) => {
          const Icon = document.icon;
          const href = document.href || '#';

          return (
            <a key={document.title} className={`${styles.docItem} fmz-lift-card`} href={href} target={href === '#' ? undefined : '_blank'} rel={href === '#' ? undefined : 'noreferrer'}>
              <span className={styles.docIco}><Icon className="h-4 w-4" /></span>
              <span className={styles.docBody}>
                <span className={styles.docName}>{document.title}</span>
                <span className={styles.docMeta}>{document.meta}</span>
              </span>
              <ArrowRight className={`${styles.docArrow} h-4 w-4`} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function FmzTenantContractPage({ contractPage, contractDocumentUrl }: FmzTenantContractPageProps) {
  const property = contractPage?.property;
  const contract = contractPage?.contract;

  const address = resolveAddress(contractPage);
  const registryCode = property?.code ?? contract?.contractNumber ?? null;
  const contractStatus = resolveContractStatus(contract?.status);
  const documents = buildDocuments(contractPage, contractDocumentUrl);
  const specs = buildSpecs(property);

  return (
    <section className={styles.page} aria-label="Meu imóvel e contrato">
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
      </div>

      <PropertyGallery address={address} />
      <PropertyAbout address={address} registryCode={registryCode} specs={specs} />

      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelTitle}>Documentos do imóvel</span>
      </div>
      <TenantDocumentList documents={documents} />
    </section>
  );
}
