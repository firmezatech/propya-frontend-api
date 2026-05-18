'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SECTION_IDS, SIDEBAR_ITEMS } from '../domain/account-status-config';
import styles from './FmzAccountPage.module.css';

export function AccountSidebar() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string>(SECTION_IDS[0]);

  useEffect(() => {
    const OFFSET = 120;

    const handleScroll = () => {
      const scrollY = window.scrollY + OFFSET;
      let currentId = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= scrollY) currentId = id;
      }
      setActiveId(currentId);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <aside className={styles.sidebar}>
      <button type="button" onClick={() => router.back()} className={styles.sidebarBackLink}>
        <ArrowLeft aria-hidden="true" />
        Voltar ao dashboard
      </button>
      <nav className={styles.sidebarNav}>
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}
              onClick={() => scrollToSection(item.id)}
            >
              <Icon aria-hidden="true" />
              {item.label}
              {item.hasDot ? <span className={styles.sidebarDot} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
