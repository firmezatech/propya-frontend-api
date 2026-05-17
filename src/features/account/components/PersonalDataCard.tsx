import { Calendar, Check, Info, Lock, Mail, Phone, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatBirthdateInput } from '../../../services/phone-country-format';
import type { AccountPageUser } from '../domain/account-page.types';
import { AccountFieldShell } from './AccountFieldShell';
import { AccountSectionCard } from './AccountSectionCard';
import styles from './FmzAccountPage.module.css';

type PersonalDataCardProps = {
  userData: AccountPageUser;
  isSaving: boolean;
  onFieldChange: (field: keyof AccountPageUser, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function PersonalDataCard({ userData, isSaving, onFieldChange, onCancel, onSave }: PersonalDataCardProps) {
  const t = useTranslations('MyAccount');

  const footer = (
    <>
      <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onCancel}>Cancelar</button>
      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={onSave}>
        <Check aria-hidden="true" /> {isSaving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </>
  );

  return (
    <AccountSectionCard
      id="sec-dados"
      icon={<UserRound className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgBlue"
      title="Dados Pessoais"
      subtitle="Informações visíveis no seu perfil"
      footer={footer}
    >
      <div className={`${styles.formGrid} ${styles.grid2}`}>
        <AccountFieldShell label={t('labelName')} required>
          <div className={styles.fieldInput}>
            <UserRound className={styles.iconLeft} aria-hidden="true" />
            <input className={styles.hasIcon} value={userData.name ?? ''} onChange={(e) => onFieldChange('name', e.target.value)} />
          </div>
        </AccountFieldShell>

        <AccountFieldShell label="Contato (WhatsApp)" required>
          <div className={styles.fieldInput}>
            <Phone className={styles.iconLeft} aria-hidden="true" />
            <input className={styles.hasIcon} type="tel" value={userData.phone ?? ''} onChange={(e) => onFieldChange('phone', e.target.value)} />
          </div>
        </AccountFieldShell>

        <AccountFieldShell label={t('labelBirthdate')} required>
          <div className={styles.fieldInput}>
            <Calendar className={styles.iconLeft} aria-hidden="true" />
            <input
              className={styles.hasIcon}
              value={userData.birthdate ?? ''}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              onChange={(e) => onFieldChange('birthdate', formatBirthdateInput(e.target.value))}
            />
          </div>
        </AccountFieldShell>

        <AccountFieldShell
          label={t('labelEmail')}
          required
          hint={<><Info aria-hidden="true" /> O e-mail não pode ser alterado.</>}
        >
          <div className={styles.fieldInput}>
            <Mail className={styles.iconLeft} aria-hidden="true" />
            <input className={styles.hasIcon} type="email" value={userData.email ?? ''} disabled />
            <Lock className={styles.lockIcon} aria-hidden="true" />
          </div>
        </AccountFieldShell>
      </div>
    </AccountSectionCard>
  );
}
