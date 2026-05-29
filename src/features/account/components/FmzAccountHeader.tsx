import styles from './FmzAccountPage.module.css';

export function FmzAccountHeader() {
  return (
    <div className={styles.pageHeaderRow}>
      <div>
        <div className={styles.pageEyebrow}>Configurações</div>
        <h1 className={styles.pageTitle}>Minha Conta</h1>
      </div>
      <div className={styles.statusBadge}>
        <span className={styles.statusDot} />
        Conta ativa
      </div>
    </div>
  );
}
