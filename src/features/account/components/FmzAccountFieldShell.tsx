import type { ReactNode } from 'react';
import styles from './FmzAccountPage.module.css';

type AccountFieldShellProps = {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FmzAccountFieldShell({ label, required, hint, error, className = '', children }: AccountFieldShellProps) {
  return (
    <label className={`${styles.field} ${className}`}>
      <span className={styles.fieldLabel}>
        {label} {required ? <span className={styles.req}>*</span> : null}
      </span>
      {children}
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
      {error ? <span className={styles.fieldError}>{error}</span> : null}
    </label>
  );
}
