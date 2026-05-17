import { CheckCircle, Gem, Info, Lock, Wallet } from 'lucide-react';
import type { AccountPageUser } from '../domain/account-page.types';
import { formatWalletNumber, formatWalletSub, maskCpf } from '../domain/account-formatters';
import { AccountSectionCard } from './AccountSectionCard';
import styles from './FmzAccountPage.module.css';

type WalletInfoCardProps = {
  userData: AccountPageUser;
};

export function WalletInfoCard({ userData }: WalletInfoCardProps) {
  return (
    <AccountSectionCard
      id="sec-financeiro"
      icon={<Wallet className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgGold"
      title="CPF e Número de Carteira"
      subtitle="Informações financeiras vinculadas — não podem ser alteradas"
    >
      <div className={styles.walletGrid}>
        <div className={styles.walletChip}>
          <div className={styles.walletLabel}>CPF</div>
          <div className={styles.walletValue}>
            <Lock aria-hidden="true" />
            {maskCpf(userData.cpf)}
          </div>
          <div className={`${styles.walletSub} ${styles.walletSubOk}`}>
            <CheckCircle aria-hidden="true" /> Verificado e vinculado à conta
          </div>
        </div>
        <div className={styles.walletChip}>
          <div className={styles.walletLabel}>Número de carteira</div>
          <div className={styles.walletValue}>
            <Gem aria-hidden="true" />
            {formatWalletNumber(userData)}
          </div>
          <div className={styles.walletSub}>{formatWalletSub(userData)}</div>
        </div>
      </div>
      <span className={styles.fieldHint}>
        <Info aria-hidden="true" />
        Dados gerados automaticamente no cadastro. Em caso de erro, entre em contato com o suporte.
      </span>
    </AccountSectionCard>
  );
}
