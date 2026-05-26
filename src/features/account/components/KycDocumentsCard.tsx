import { AlertTriangle, CheckCircle, FolderOpen, ShieldCheck, Upload, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { resolveKycDocumentIcon, resolveKycDocumentStatusVisual } from '../domain/account-status-config';
import { AccountSectionCard } from './AccountSectionCard';
import styles from './FmzAccountPage.module.css';
import type { TenantKycDocument, TenantKycDocumentUploadParams } from '../../tenant-portal/domain/fmz-tenant-profile.types';

// ─── Props ────────────────────────────────────────────────────────────────────

type KycDocumentsCardProps = {
  documents: TenantKycDocument[];
  onUpload: (params: TenantKycDocumentUploadParams) => Promise<void>;
  onToast: (message: string) => void;
  isUploading: boolean;
  uploadError: string | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders KYC document cards driven entirely by backend data.
 *
 * What this component owns:
 *   - Icon resolution (pure presentational)
 *   - File picker interaction
 *   - Upload progress state
 *
 * What this component must NOT own:
 *   - Document statuses (backend owns them)
 *   - Completion counts (backend owns them)
 *   - Business rules about which documents are required (backend owns them)
 */
export function KycDocumentsCard({
  documents,
  onUpload,
  onToast,
  isUploading,
  uploadError,
}: KycDocumentsCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadKey, setActiveUploadKey] = useState<string | null>(null);
  const [isUploadAreaVisible, setIsUploadAreaVisible] = useState(false);

  const pendingCount = documents.filter(
    (d) => d.status === 'pending' || d.status === 'rejected' || d.status === 'needs_resubmission',
  ).length;

  const handleUploadButtonClick = (requirementKey: string) => {
    setActiveUploadKey(requirementKey);
    setIsUploadAreaVisible(true);
    // Scroll into view to show the upload area
    setTimeout(() => fileInputRef.current?.focus(), 100);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadKey) return;

    const activeDocument = documents.find((d) => d.requirementKey === activeUploadKey);
    if (!activeDocument) return;

    await onUpload({
      requirementKey: activeDocument.requirementKey,
      documentType: activeDocument.documentType,
      file,
    });

    onToast('Documento enviado para análise.');
    setIsUploadAreaVisible(false);
    setActiveUploadKey(null);

    // Reset the file input so the same file can be re-selected if needed.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const footer = pendingCount > 0 ? (
    <span className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} style={{ cursor: 'default' }}>
      {pendingCount} {pendingCount === 1 ? 'documento pendente' : 'documentos pendentes'}
    </span>
  ) : (
    <span className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} style={{ cursor: 'default', color: 'var(--fmz-success)' }}>
      <CheckCircle style={{ width: 13, height: 13 }} aria-hidden="true" />
      Todos os documentos enviados
    </span>
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
      {pendingCount > 0 ? (
        <div className={styles.kycAlert}>
          <span className={styles.kycAlertIcon}>
            <AlertTriangle aria-hidden="true" />
          </span>
          <div>
            <div className={styles.kycAlertTitle}>Verificação incompleta</div>
            <div className={styles.kycAlertDesc}>
              {pendingCount === 1
                ? '1 documento pendente. Complete o envio para liberar todas as funcionalidades da plataforma.'
                : `${pendingCount} documentos pendentes. Complete o envio para liberar todas as funcionalidades da plataforma.`}
            </div>
          </div>
        </div>
      ) : null}

      {uploadError ? (
        <div className={styles.kycAlert} style={{ marginBottom: 16 }}>
          <span className={styles.kycAlertIcon}>
            <AlertTriangle aria-hidden="true" />
          </span>
          <div>
            <div className={styles.kycAlertTitle}>Erro ao enviar</div>
            <div className={styles.kycAlertDesc}>{uploadError}</div>
          </div>
        </div>
      ) : null}

      {documents.length === 0 ? (
        <div className={styles.stateCard} style={{ boxShadow: 'none', border: '1.5px dashed var(--fmz-border-light)' }}>
          <p className={styles.emptyText}>Nenhum documento solicitado no momento.</p>
        </div>
      ) : (
        <div className={styles.docList}>
          {documents.map((doc) => {
            const visual = resolveKycDocumentStatusVisual(doc.status);
            const StatusIcon = visual.icon;
            const DocIcon = resolveKycDocumentIcon(doc.requirementKey);
            const isActiveUpload = activeUploadKey === doc.requirementKey;

            return (
              <div key={doc.requirementKey} className={`${styles.docRow} ${styles[visual.rowClass as keyof typeof styles]}`}>
                <span className={`${styles.docIcon} ${styles[visual.iconClass as keyof typeof styles]}`}>
                  <DocIcon className={styles.docIconSvg} aria-hidden="true" />
                </span>

                <div className={styles.docInfo}>
                  <div className={styles.docName}>{doc.label}</div>
                  <div className={styles.docMeta}>
                    {doc.status === 'verified' && doc.reviewedAt
                      ? `Aprovado em ${formatDate(doc.reviewedAt)}`
                      : doc.status === 'under_review' && doc.submittedAt
                        ? `Enviado em ${formatDate(doc.submittedAt)} · aguardando análise`
                        : doc.status === 'rejected' && doc.rejectionReason
                          ? `Rejeitado: ${doc.rejectionReason}`
                          : doc.status === 'needs_resubmission' && doc.rejectionReason
                            ? `Reenvio necessário: ${doc.rejectionReason}`
                            : doc.fileName
                              ? doc.fileName
                              : doc.description}
                  </div>
                </div>

                <div className={styles.docActions}>
                  <span className={`${styles.badge} ${styles[visual.badgeClass as keyof typeof styles]}`}>
                    <StatusIcon aria-hidden="true" />
                    {visual.label}
                  </span>

                  {visual.canResubmit ? (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                      disabled={isUploading}
                      onClick={() => handleUploadButtonClick(doc.requirementKey)}
                    >
                      <Upload aria-hidden="true" />
                      Reenviar
                    </button>
                  ) : null}

                  {visual.canUpload ? (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                      disabled={isUploading}
                      onClick={() => handleUploadButtonClick(doc.requirementKey)}
                    >
                      <Upload aria-hidden="true" />
                      {isUploading && isActiveUpload ? 'Enviando...' : 'Enviar agora'}
                    </button>
                  ) : null}
                </div>

                {/* Inline upload area for this specific document */}
                {isUploadAreaVisible && isActiveUpload ? (
                  <div style={{ gridColumn: '1 / -1', width: '100%', marginTop: 12 }}>
                    <div
                      className={styles.uploadBox}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                      }}
                    >
                      <UploadCloud className={styles.uploadBoxIcon} aria-hidden="true" />
                      <div className={styles.uploadBoxTitle}>
                        {isUploading ? 'Enviando...' : 'Arraste o arquivo ou clique para selecionar'}
                      </div>
                      <div className={styles.uploadBoxSub}>
                        PNG, JPG ou PDF · máx. 10 MB · mínimo 300 DPI
                      </div>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary} ${styles.uploadBoxBtn}`}
                        disabled={isUploading}
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      >
                        <FolderOpen aria-hidden="true" />
                        {isUploading ? 'Aguarde...' : 'Selecionar arquivo'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden file input — opened programmatically per-document */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={(e) => void handleFileSelect(e)}
        aria-label="Selecionar arquivo para envio"
      />
    </AccountSectionCard>
  );
}

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
