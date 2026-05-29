import { Check, ChevronDown, MapPin, Search } from 'lucide-react';
import type { AccountPageUser } from '../domain/fmz-account-page.types';
import { BRAZILIAN_STATES, } from '../domain/fmz-account-status-config';
import { formatCepInput } from '../domain/fmz-account-formatters';
import { FmzAccountFieldShell } from './FmzAccountFieldShell';
import { FmzAccountSectionCard } from './FmzAccountSectionCard';
import styles from './FmzAccountPage.module.css';

type AddressCardProps = {
  userData: AccountPageUser;
  isSaving: boolean;
  onFieldChange: (field: keyof AccountPageUser, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onCepSearch: () => void;
};

export function FmzAddressCard({ userData, isSaving, onFieldChange, onCancel, onSave, onCepSearch }: AddressCardProps) {
  const footer = (
    <>
      <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onCancel}>Cancelar</button>
      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={onSave}>
        <Check aria-hidden="true" /> {isSaving ? 'Salvando...' : 'Salvar endereço'}
      </button>
    </>
  );

  return (
    <FmzAccountSectionCard
      id="sec-endereco"
      icon={<MapPin className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgGreen"
      title="Endereço"
      subtitle="Endereço residencial usado para cadastro e comunicações"
      footer={footer}
    >
      <div className={styles.cepRow}>
        <FmzAccountFieldShell label="CEP" className={styles.cepField}>
          <div className={styles.fieldInput}>
            <Search className={styles.iconLeft} aria-hidden="true" />
            <input
              className={styles.hasIcon}
              value={userData.postalCode ?? ''}
              placeholder="00000-000"
              maxLength={9}
              onChange={(e) => onFieldChange('postalCode', formatCepInput(e.target.value))}
            />
          </div>
        </FmzAccountFieldShell>
        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.cepBtn}`} onClick={onCepSearch}>
          <Search aria-hidden="true" /> Buscar
        </button>
      </div>

      <div className={`${styles.formGrid} ${styles.grid2}`}>
        <FmzAccountFieldShell label="Logradouro" className={styles.fullField}>
          <div className={styles.fieldInput}>
            <input value={userData.addressLine1 ?? ''} placeholder="Rua, Avenida, Praça..." onChange={(e) => onFieldChange('addressLine1', e.target.value)} />
          </div>
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label="Número">
          <div className={styles.fieldInput}>
            <input value={(userData as AccountPageUser & { addressNumber?: string }).addressNumber ?? ''} placeholder="Ex: 412" onChange={(e) => onFieldChange('addressNumber' as keyof AccountPageUser, e.target.value)} />
          </div>
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label="Complemento">
          <div className={styles.fieldInput}>
            <input value={userData.addressLine2 ?? ''} placeholder="Apto, bloco, sala..." onChange={(e) => onFieldChange('addressLine2', e.target.value)} />
          </div>
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label="Bairro">
          <div className={styles.fieldInput}>
            <input value={userData.district ?? ''} placeholder="Ex: Vila Madalena" onChange={(e) => onFieldChange('district', e.target.value)} />
          </div>
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label="Cidade">
          <div className={styles.fieldInput}>
            <input value={userData.city ?? ''} placeholder="Ex: São Paulo" onChange={(e) => onFieldChange('city', e.target.value)} />
          </div>
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label="Estado">
          <div className={styles.fieldInput}>
            <select value={userData.state ?? ''} onChange={(e) => onFieldChange('state', e.target.value)}>
              {BRAZILIAN_STATES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className={styles.selectIcon} aria-hidden="true" />
          </div>
        </FmzAccountFieldShell>
      </div>
    </FmzAccountSectionCard>
  );
}
