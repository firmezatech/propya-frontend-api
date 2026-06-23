import { Clock, LogIn, RotateCw } from 'lucide-react';
import { Link } from '../../../i18n/navigation';
import styles from './FmzComingSoonHero.module.css';

type FmzComingSoonHeroProps = {
  title: string;
  description: React.ReactNode;
  homeHref: string;
  homeLabel: string;
};

/**
 * Layout-agnostic "coming soon" hero — ring animation, badge, tag, copy and the
 * two actions (go home / reload). Has no header or footer of its own, so it
 * renders correctly both standalone on a public page (see
 * FmzPropertiesComingSoonPage, wrapped in FmzAuthHeader/FmzPublicFooter) and
 * inside the connected app shell (see /connected/coming-soon, which already
 * gets its chrome from FmzConnectedLayoutFrame).
 *
 * Visual reference: references/Em Breve.html.
 */
export function FmzComingSoonHero({ title, description, homeHref, homeLabel }: FmzComingSoonHeroProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.soon}>
        <div className={styles.art} aria-hidden="true">
          <div className={styles.ring} />
          <div className={`${styles.ring} ${styles.ringInner}`} />
          <div className={styles.badge}>
            <Clock size={32} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>

        <span className={styles.tag}>
          <span className={styles.pulse} aria-hidden="true" />
          Em breve
        </span>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.sub}>{description}</p>

        <div className={styles.actions}>
          <Link href={homeHref} className={`${styles.btn} ${styles.btnPrimary}`}>
            <LogIn size={15} aria-hidden="true" />
            {homeLabel}
          </Link>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => window.location.reload()}
          >
            <RotateCw size={15} aria-hidden="true" />
            Atualizar
          </button>
        </div>

        <span className={styles.foot}>Estamos trabalhando nisso · Equipe Propya</span>
      </div>
    </div>
  );
}
