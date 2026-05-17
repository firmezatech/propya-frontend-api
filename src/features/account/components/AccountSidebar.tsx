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
    const visible = new Set<string>();

    const highlight = () => {
      for (const id of SECTION_IDS) {
        if (visible.has(id)) {
          setActiveId(id);
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        highlight();
      },
      { rootMargin: '-64px 0px -48% 0px', threshold: 0 },
    );

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
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
        Voltar
      </button>
      <p className={styles.sidebarLabel}>Configurações</p>
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
