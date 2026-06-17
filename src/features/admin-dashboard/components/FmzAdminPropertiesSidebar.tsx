'use client';

import styles from './FmzAdminDashboard.module.css';
import type { FmzAdminDashboardTopProperty } from '../domain/fmz-admin-dashboard.types';

// ─── Deterministic initials palette ───────────────────────────────────────────

const INITIALS_PALETTES: Array<{ bg: string; color: string }> = [
  { bg: '#EBF0FA', color: '#3B5EA6' },
  { bg: '#EDE9FA', color: '#6B4FA6' },
  { bg: '#FAE8E0', color: '#A6503B' },
  { bg: '#E5F4EB', color: '#3BA66B' },
  { bg: '#FBF3DA', color: '#C8A020' },
  { bg: '#F5F3FF', color: '#7C3AED' },
];

const paletteFor = (seed: string): { bg: string; color: string } =>
  INITIALS_PALETTES[seed.charCodeAt(0) % INITIALS_PALETTES.length];

const initialsFromAddress = (address: string): string => {
  const words = address.trim().split(/\s+/);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const OccupiedDot = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
    <circle cx="4" cy="4" r="4" fill="currentColor" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// ─── Property row sub-component ────────────────────────────────────────────────

type PropertyRowProps = {
  property: FmzAdminDashboardTopProperty;
  onClick:  () => void;
};

function PropertyRow({ property, onClick }: PropertyRowProps) {
  const initials  = initialsFromAddress(property.address);
  const palette   = paletteFor(initials);
  const ownerLabel = property.coOwnersCount === 1
    ? '1 co-proprietário'
    : `${property.coOwnersCount} co-proprietários`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={styles.propertyRow}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver imóvel: ${property.address}`}
    >
      <div className={styles.propertyInitials} style={{ background: palette.bg, color: palette.color }}>
        {initials}
      </div>
      <div className={styles.propertyBody}>
        <div className={styles.propertyAddress}>{property.address}</div>
        <div className={styles.propertyMeta}>{property.neighborhood} · {ownerLabel}</div>
      </div>
      <span className={property.isOccupied ? styles.propertyOccupied : styles.propertyVacant}>
        <OccupiedDot />
        {property.isOccupied ? 'Ocupado' : 'Com vaga'}
      </span>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className={styles.propertyRow}>
    <div className={styles.skeleton} style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
    <div className={styles.propertyBody}>
      <div className={styles.skeleton} style={{ width: '70%', height: 12, borderRadius: 4, marginBottom: 5 }} />
      <div className={styles.skeleton} style={{ width: '50%', height: 11, borderRadius: 4 }} />
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────

type Props = {
  properties:      FmzAdminDashboardTopProperty[];
  loading:         boolean;
  onPropertyClick: (propertyId: string) => void;
  onViewAllClick:  () => void;
};

export function FmzAdminPropertiesSidebar({ properties, loading, onPropertyClick, onViewAllClick }: Props) {
  if (loading) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Imóveis ativos</span>
        </div>
        {Array.from({ length: 4 }, (_, index) => <SkeletonRow key={index} />)}
      </div>
    );
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Imóveis ativos</span>
        <button type="button" className={styles.sectionAction} onClick={onViewAllClick}>
          Ver todos <ArrowRightIcon />
        </button>
      </div>
      {properties.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--dash-hint)', fontSize: 13 }}>
          Nenhum imóvel cadastrado ainda.
        </div>
      ) : (
        properties.map((property) => (
          <PropertyRow
            key={property.id}
            property={property}
            onClick={() => onPropertyClick(property.id)}
          />
        ))
      )}
    </div>
  );
}
