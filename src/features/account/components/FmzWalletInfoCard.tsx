import { CheckCircle, Info, Lock, Wallet } from 'lucide-react';
import type { AccountPageUser } from '../domain/fmz-account-page.types';
import { formatWalletNumber, formatWalletSub, maskCpf } from '../domain/fmz-account-formatters';
import { FmzAccountFieldShell } from './FmzAccountFieldShell';
import { FmzAccountSectionCard } from './FmzAccountSectionCard';
import styles from './FmzAccountPage.module.css';

type WalletInfoCardProps = {
  userData: AccountPageUser;
};

export function WalletInfoCard({ userData }: WalletInfoCardProps) {
  return (
    <FmzAccountSectionCard
      id="sec-financeiro"
      icon={<Wallet className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgGold"
      title="CPF e número de carteira"
      subtitle="Informações financeiras vinculadas — não podem ser alteradas"
    >
      <div className={`${styles.formGrid} ${styles.grid2}`}>
        <FmzAccountFieldShell label="CPF">
          <div className={styles.lockedDisplay}>
            <Lock aria-hidden="true" />
            <span className={styles.lockedText}>{maskCpf(userData.cpf)}</span>
          </div>
          <span className={`${styles.fieldHint} ${styles.fieldHintOk}`}>
            <CheckCircle aria-hidden="true" />
            Verificado e vinculado à conta
          </span>
        </FmzAccountFieldShell>

        <FmzAccountFieldShell label="Número de carteira">
          <div className={styles.lockedDisplay}>
            <span className={styles.walletDot} aria-hidden="true" />
            <span className={styles.lockedText}>{formatWalletNumber(userData)}</span>
          </div>
          <span className={styles.fieldHint}>
            <Info aria-hidden="true" />
            {formatWalletSub(userData)}
          </span>
        </FmzAccountFieldShell>
      </div>

      <p className={`${styles.fieldHint} ${styles.inlineNote}`}>
        <Info aria-hidden="true" />
        Dados gerados automaticamente no cadastro. Em caso de erro, entre em contato com o suporte.
      </p>
    </FmzAccountSectionCard>
  );
}
