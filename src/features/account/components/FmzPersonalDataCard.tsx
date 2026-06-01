import { Calendar, Check, Info, Lock, Mail, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatBirthdateInput } from '../../../lib/fmz-phone-country-format';
import type { AccountPageUser } from '../domain/fmz-account-page.types';
import { FmzAccountFieldShell } from './FmzAccountFieldShell';
import { FmzAccountPhoneInput } from './FmzAccountPhoneInput';
import { FmzAccountSectionCard } from './FmzAccountSectionCard';
import styles from './FmzAccountPage.module.css';

type PersonalDataCardProps = {
  userData: AccountPageUser;
  isSaving: boolean;
  onFieldChange: (field: keyof AccountPageUser, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function FmzPersonalDataCard({ userData, isSaving, onFieldChange, onCancel, onSave }: PersonalDataCardProps) {
  const t = useTranslations('MyAccount');

  const handlePhoneChange = (nationalNumber: string, countryCode: string) => {
    onFieldChange('phone', nationalNumber);
    onFieldChange('phoneCountry', countryCode);
  };

  const footer = (
    <>
      <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onCancel}>Cancelar</button>
      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={onSave}>
        <Check aria-hidden="true" /> {isSaving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </>
  );

  return (
    <FmzAccountSectionCard
      id="sec-dados"
      icon={<UserRound className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgBlue"
      title="Dados Pessoais"
      subtitle="Informações visíveis no seu perfil"
      footer={footer}
    >
      <div className={`${styles.formGrid} ${styles.grid2}`}>
        <FmzAccountFieldShell label={t('labelName')} required>
          <div className={styles.fieldInput}>
            <UserRound className={styles.iconLeft} aria-hidden="true" />
            <input className={styles.hasIcon} value={userData.name ?? ''} onChange={(e) => onFieldChange('name', e.target.value)} />
          </div>
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label="Contato (WhatsApp)" required>
          <FmzAccountPhoneInput
            phone={userData.phone ?? ''}
            phoneCountry={userData.phoneCountry ?? ''}
            onPhoneChange={handlePhoneChange}
          />
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label={t('labelBirthdate')} required>
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
        </FmzAccountFieldShell>

        <FmzAccountFieldShell
          label={t('labelEmail')}
          required
          hint={<><Info aria-hidden="true" /> O e-mail não pode ser alterado.</>}
        >
          <div className={styles.fieldInput}>
            <Mail className={styles.iconLeft} aria-hidden="true" />
            <input className={styles.hasIcon} type="email" value={userData.email ?? ''} disabled />
            <Lock className={styles.lockIcon} aria-hidden="true" />
          </div>
        </FmzAccountFieldShell>
      </div>
    </FmzAccountSectionCard>
  );
}
