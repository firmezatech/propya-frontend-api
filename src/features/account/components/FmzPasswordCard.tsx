import { KeyRound, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AccountFieldErrors, AccountPageUser, PasswordStrength, PasswordVisibilityState } from '../domain/fmz-account-page.types';
import { resolvePasswordBarClass } from '../domain/fmz-account-formatters';
import { FmzPasswordField } from '../../../components/design-system';
import { FmzAccountFieldShell } from './FmzAccountFieldShell';
import { FmzAccountSectionCard } from './FmzAccountSectionCard';
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

export function FmzPasswordCard({ userData, isSaving, fieldErrors, passwordStrength, passwordVisibility, onFieldChange, onToggleVisibility, onSave }: PasswordCardProps) {
  const t = useTranslations('MyAccount');

  const footer = (
    <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={onSave}>
      <Lock aria-hidden="true" /> {isSaving ? 'Atualizando...' : 'Atualizar senha'}
    </button>
  );

  return (
    <FmzAccountSectionCard
      id="sec-senha"
      icon={<Lock className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgPurple"
      title="Alterar Senha"
      subtitle="Use uma senha forte com pelo menos 8 caracteres"
      footer={footer}
    >
      <div className={`${styles.formGrid} ${styles.grid2}`}>
        <FmzAccountFieldShell label={t('labelCurrentPassword')} required error={fieldErrors.currentPassword} className={styles.fullField}>
          <FmzPasswordField
            leadingIcon={<Lock className="h-4 w-4 shrink-0 text-fmz-text-hint" aria-hidden="true" />}
            isVisible={passwordVisibility.current}
            onToggleVisible={() => onToggleVisibility('current')}
            showLabel="Alternar visibilidade da senha atual"
            hideLabel="Alternar visibilidade da senha atual"
            value={userData.currentPassword ?? ''}
            autoComplete="current-password"
            placeholder="••••••••"
            hasError={Boolean(fieldErrors.currentPassword)}
            onChange={(e) => onFieldChange('currentPassword', e.target.value)}
          />
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label={t('labelNewPassword')} required>
          <FmzPasswordField
            leadingIcon={<KeyRound className="h-4 w-4 shrink-0 text-fmz-text-hint" aria-hidden="true" />}
            isVisible={passwordVisibility.next}
            onToggleVisible={() => onToggleVisibility('next')}
            showLabel="Alternar visibilidade da nova senha"
            hideLabel="Alternar visibilidade da nova senha"
            value={userData.newPassword ?? ''}
            autoComplete="new-password"
            placeholder="••••••••"
            onChange={(e) => onFieldChange('newPassword', e.target.value)}
          />
          <PasswordStrengthBars strength={passwordStrength} />
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label={t('labelConfirmPassword')} required error={fieldErrors.confirmPassword}>
          <FmzPasswordField
            leadingIcon={<KeyRound className="h-4 w-4 shrink-0 text-fmz-text-hint" aria-hidden="true" />}
            isVisible={passwordVisibility.confirmation}
            onToggleVisible={() => onToggleVisibility('confirmation')}
            showLabel="Alternar visibilidade da confirmação de senha"
            hideLabel="Alternar visibilidade da confirmação de senha"
            value={userData.confirmPassword ?? ''}
            autoComplete="new-password"
            placeholder="••••••••"
            hasError={Boolean(fieldErrors.confirmPassword)}
            onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
          />
        </FmzAccountFieldShell>
      </div>
    </FmzAccountSectionCard>
  );
}
