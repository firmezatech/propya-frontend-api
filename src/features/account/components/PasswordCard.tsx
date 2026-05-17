import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AccountFieldErrors, AccountPageUser, PasswordStrength, PasswordVisibilityState } from '../domain/account-page.types';
import { resolvePasswordBarClass } from '../domain/account-formatters';
import { AccountFieldShell } from './AccountFieldShell';
import { AccountSectionCard } from './AccountSectionCard';
import styles from './FmzAccountPage.module.css';

type PasswordCardProps = {
  userData: AccountPageUser;
  isSaving: boolean;
  fieldErrors: AccountFieldErrors;
  passwordStrength: PasswordStrength;
  passwordVisibility: PasswordVisibilityState;
  onFieldChange: (field: keyof AccountPageUser, value: string) => void;
  onToggleVisibility: (field: keyof PasswordVisibilityState) => void;
  onSave: () => void;
};

function PasswordStrengthBars({ strength }: { strength: PasswordStrength }) {
  const activeClass = resolvePasswordBarClass(strength.barKey, styles);
  return (
    <div>
      <div className={styles.passwordBars}>
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={`${styles.passwordBar} ${index < strength.score ? activeClass : ''}`} />
        ))}
      </div>
      <div className={styles.passwordHint}>{strength.label}</div>
    </div>
  );
}

export function PasswordCard({ userData, isSaving, fieldErrors, passwordStrength, passwordVisibility, onFieldChange, onToggleVisibility, onSave }: PasswordCardProps) {
  const t = useTranslations('MyAccount');

  const footer = (
    <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={onSave}>
      <Lock aria-hidden="true" /> {isSaving ? 'Atualizando...' : 'Atualizar senha'}
    </button>
  );

  return (
    <AccountSectionCard
      id="sec-senha"
      icon={<Lock className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgPurple"
      title="Alterar Senha"
      subtitle="Use uma senha forte com pelo menos 8 caracteres"
      footer={footer}
    >
      <div className={`${styles.formGrid} ${styles.grid2}`}>
        <AccountFieldShell label={t('labelCurrentPassword')} required error={fieldErrors.currentPassword} className={styles.fullField}>
          <div className={styles.fieldInput}>
            <Lock className={styles.iconLeft} aria-hidden="true" />
            <input
              className={styles.hasIcon}
              type={passwordVisibility.current ? 'text' : 'password'}
              value={userData.currentPassword ?? ''}
              autoComplete="current-password"
              placeholder="••••••••"
              onChange={(e) => onFieldChange('currentPassword', e.target.value)}
            />
            <button type="button" className={styles.passwordToggle} onClick={() => onToggleVisibility('current')} aria-label="Alternar visibilidade da senha atual">
              {passwordVisibility.current ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </AccountFieldShell>

        <AccountFieldShell label={t('labelNewPassword')} required>
          <div className={styles.fieldInput}>
            <KeyRound className={styles.iconLeft} aria-hidden="true" />
            <input
              className={styles.hasIcon}
              type={passwordVisibility.next ? 'text' : 'password'}
              value={userData.newPassword ?? ''}
              autoComplete="new-password"
              placeholder="••••••••"
              onChange={(e) => onFieldChange('newPassword', e.target.value)}
            />
            <button type="button" className={styles.passwordToggle} onClick={() => onToggleVisibility('next')} aria-label="Alternar visibilidade da nova senha">
              {passwordVisibility.next ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <PasswordStrengthBars strength={passwordStrength} />
        </AccountFieldShell>

        <AccountFieldShell label={t('labelConfirmPassword')} required error={fieldErrors.confirmPassword}>
          <div className={styles.fieldInput}>
            <KeyRound className={styles.iconLeft} aria-hidden="true" />
            <input
              className={styles.hasIcon}
              type={passwordVisibility.confirmation ? 'text' : 'password'}
              value={userData.confirmPassword ?? ''}
              autoComplete="new-password"
              placeholder="••••••••"
              onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
            />
            <button type="button" className={styles.passwordToggle} onClick={() => onToggleVisibility('confirmation')} aria-label="Alternar visibilidade da confirmação de senha">
              {passwordVisibility.confirmation ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </AccountFieldShell>
      </div>
    </AccountSectionCard>
  );
}
