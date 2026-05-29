import type { ReactNode } from 'react';
import styles from './FmzAccountPage.module.css';

type AccountSectionCardProps = {
  id: string;
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AccountSectionCard({ id, icon, iconClassName, title, subtitle, children, footer }: AccountSectionCardProps) {
  return (
    <section id={id} className={styles.card}>
      <div className={styles.cardHead}>
        <span className={`${styles.cardIcon} ${styles[iconClassName as keyof typeof styles]}`}>{icon}</span>
        <div>
          <h2 className={styles.cardTitle}>{title}</h2>
          <p className={styles.cardDesc}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.cardBody}>{children}</div>
      {footer ? <div className={styles.cardFoot}>{footer}</div> : null}
    </section>
  );
}
