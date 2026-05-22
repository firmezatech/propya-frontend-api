'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import styles from './FmzComingSoonPage.module.css';

export function FmzComingSoonPage() {
  const router = useRouter();

  return (
    <div className={styles.shell}>
      <div className={styles.card}>

        <div className={styles.icon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>

        <div className={styles.eyebrow}>Em desenvolvimento</div>

        <h1 className={styles.title}>
          Esta página ainda<br />não está disponível
        </h1>

        <p className={styles.description}>
          Estamos trabalhando para entregar esta funcionalidade em breve.
          Quando estiver pronta, você será notificado automaticamente.
        </p>

        <div className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          Previsão de lançamento em breve
        </div>

        <div className={styles.divider} />

        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={() => router.back()}>
            <ArrowLeft size={14} aria-hidden="true" />
            Voltar
          </button>
          <Link href="/connected/dashboard" className={styles.btnPrimary}>
            Ir ao início
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>

      </div>
    </div>
  );
}
