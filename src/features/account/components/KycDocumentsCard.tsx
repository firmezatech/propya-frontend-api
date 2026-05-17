import { AlertTriangle, FolderOpen, RefreshCw, ShieldCheck, Upload, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { ACCOUNT_DOCUMENTS, DOCUMENT_STATUS_VISUAL } from '../domain/account-status-config';
import { AccountSectionCard } from './AccountSectionCard';
import styles from './FmzAccountPage.module.css';

type KycDocumentsCardProps = {
  onToast: (message: string) => void;
};

export function KycDocumentsCard({ onToast }: KycDocumentsCardProps) {
  const [isUploadVisible, setIsUploadVisible] = useState(false);

  const footer = (
    <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onToast('Redirecionando para envio de documentos...')}>
      <UploadCloud aria-hidden="true" /> Ir para envio de documentos
    </button>
  );

  return (
    <AccountSectionCard
      id="sec-kyc"
      icon={<ShieldCheck className={styles.cardIconSvg} aria-hidden="true" />}
      iconClassName="bgGreen"
      title="Documentos e Verificação KYC"
      subtitle="Seus arquivos são protegidos com criptografia de ponta a ponta"
      footer={footer}
    >
      <div className={styles.kycAlert}>
        <span className={styles.kycAlertIcon}><AlertTriangle aria-hidden="true" /></span>
        <div>
          <div className={styles.kycAlertTitle}>Verificação incompleta</div>
          <div className={styles.kycAlertDesc}>
            2 dos 4 documentos estão pendentes. Complete o envio para liberar todas as funcionalidades da plataforma.
          </div>
        </div>
      </div>

      <div className={styles.docList}>
        {ACCOUNT_DOCUMENTS.map((doc) => {
          const visual = DOCUMENT_STATUS_VISUAL[doc.status];
          const StatusIcon = visual.icon;
          const DocIcon = doc.icon;

          return (
            <div key={doc.key} className={`${styles.docRow} ${styles[visual.rowClass as keyof typeof styles]}`}>
              <span className={`${styles.docIcon} ${styles[visual.iconClass as keyof typeof styles]}`}>
                <DocIcon className={styles.docIconSvg} aria-hidden="true" />
              </span>
              <div className={styles.docInfo}>
                <div className={styles.docName}>{doc.name}</div>
                <div className={styles.docMeta}>{doc.meta}</div>
              </div>
              <div className={styles.docActions}>
                <span className={`${styles.badge} ${styles[visual.badgeClass as keyof typeof styles]}`}>
                  <StatusIcon aria-hidden="true" />
                  {visual.label}
                </span>
                {doc.canResend ? (
                  <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => onToast('Reenviando documento...')}>
                    <RefreshCw aria-hidden="true" /> Reenviar
                  </button>
                ) : null}
                {doc.canUpload ? (
                  <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setIsUploadVisible((v) => !v)}>
                    <Upload aria-hidden="true" /> Enviar agora
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {isUploadVisible ? (
        <div
          className={styles.uploadBox}
          onClick={() => onToast('Selecione um arquivo...')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToast('Selecione um arquivo...'); }}
        >
          <UploadCloud className={styles.uploadBoxIcon} aria-hidden="true" />
          <div className={styles.uploadBoxTitle}>Arraste o arquivo ou clique para selecionar</div>
          <div className={styles.uploadBoxSub}>PNG, JPG ou PDF · máx. 10 MB · mínimo 300 DPI</div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.uploadBoxBtn}`}
            onClick={(e) => { e.stopPropagation(); onToast('Abrindo seletor de arquivos...'); }}
          >
            <FolderOpen aria-hidden="true" /> Selecionar arquivo
          </button>
        </div>
      ) : null}
    </AccountSectionCard>
  );
}
