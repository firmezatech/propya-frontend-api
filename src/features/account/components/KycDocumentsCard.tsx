import { AlertTriangle, CheckCircle, FolderOpen, ShieldCheck, Upload, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatDateBR } from '../../../lib/date-utils';
import { resolveKycDocumentIcon, resolveKycDocumentStatusVisual } from '../domain/account-status-config';
import { AccountSectionCard } from './AccountSectionCard';
import styles from './FmzAccountPage.module.css';
import type { TenantKycDocument, TenantKycDocumentUploadParams } from '../../tenant-portal/domain/fmz-tenant-profile.types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Delay (ms) between showing the upload area and focusing the hidden file input. */
const UPLOAD_FOCUS_DELAY_MS = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves a CSS module class by name.
 * Centralises the `as keyof typeof styles` cast so all call-sites stay readable.
 */
const moduleClass = (key: string): string => styles[key as keyof typeof styles] ?? '';

/**
 * Returns true for documents that still require user action:
 * pending upload, rejected, or flagged for resubmission.
 */
const isPendingAction = (doc: TenantKycDocument): boolean =>
  doc.status === 'pending' || doc.status === 'rejected' || doc.status === 'needs_resubmission';

/**
 * Resolves the secondary metadata line shown below each document label.
 * All date strings are formatted for Brazilian locale (DD/MM/YYYY).
 */
function resolveDocumentMetaText(doc: TenantKycDocument): string {
  if (doc.status === 'verified' && doc.reviewedAt) {
    return `Aprovado em ${formatDateBR(doc.reviewedAt)}`;
  }
  if (doc.status === 'under_review' && doc.submittedAt) {
    return `Enviado em ${formatDateBR(doc.submittedAt)} · aguardando análise`;
  }
  if (doc.status === 'rejected' && doc.rejectionReason) {
    return `Rejeitado: ${doc.rejectionReason}`;
  }
  if (doc.status === 'needs_resubmission' && doc.rejectionReason) {
    return `Reenvio necessário: ${doc.rejectionReason}`;
  }
  return doc.fileName ?? doc.description;
}

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
 *   - Icon and status-visual resolution (pure presentational)
 *   - File picker interaction state
 *
 * What this component must NOT own:
 *   - Document statuses (backend owns them)
 *   - Completion counts (backend owns them)
 *   - Business rules about which documents are required (backend owns them)
 *
 * Layout strategy:
 *   Each document card is a vertical stack:
 *     1. Info row  — icon + text block (label + meta)
 *     2. Actions row — status badge + upload/resubmit button (flex-wrap)
 *     3. Upload area — shown only when this card is the active upload target
 *
 *   On desktop (≥ 769 px), when the upload area is active the card switches to
 *   a two-column grid: info+actions on the left, dropzone on the right.
 *   On mobile/tablet the grid collapses to a single column.
 *
 * Single-input design:
 *   One hidden `<input type="file">` is shared across all document rows.
 *   `activeUploadKey` tracks which row triggered the picker.
 *   Only one upload can be in progress at a time; buttons are disabled while
 *   `isUploading` is true.
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

  const pendingCount = documents.filter(isPendingAction).length;

  const handleUploadButtonClick = (requirementKey: string) => {
    setActiveUploadKey(requirementKey);
    setIsUploadAreaVisible(true);
    // Delay to ensure the upload area is rendered before the input receives focus.
    setTimeout(() => fileInputRef.current?.focus(), UPLOAD_FOCUS_DELAY_MS);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadKey) return;

    const activeDocument = documents.find((d) => d.requirementKey === activeUploadKey);
    if (!activeDocument) return;

    try {
      await onUpload({
        requirementKey: activeDocument.requirementKey,
        documentType: activeDocument.documentType,
        file,
      });

      // Upload succeeded — show success feedback and close the upload area.
      onToast('Documento enviado para análise.');
      setIsUploadAreaVisible(false);
      setActiveUploadKey(null);
    } catch {
      // Upload failed — the error message is already exposed via the uploadError prop
      // (set by the hook). Do NOT show the success toast. Keep the upload area
      // open so the user can immediately retry after reading the error.
    }

    // Always reset the file input so the same file can be re-selected if needed.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const footer = pendingCount > 0 ? (
    <span className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall} ${styles.btnStatic}`}>
      {pendingCount} {pendingCount === 1 ? 'documento pendente' : 'documentos pendentes'}
    </span>
  ) : (
    <span className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall} ${styles.btnStatic} ${styles.btnStaticSuccess}`}>
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
            const showUploadArea = isUploadAreaVisible && isActiveUpload;

            return (
              <div
                key={doc.requirementKey}
                className={`${styles.docCard} ${moduleClass(visual.rowClass)}`}
              >
                {/*
                 * Inner wrapper: single column by default; switches to two-column
                 * grid (info | dropzone) on desktop when the upload area is active.
                 */}
                <div className={showUploadArea ? styles.docCardGrid : ''}>

                  {/* ── Left / content column ─────────────────────────────── */}
                  <div className={styles.docCardLeft}>

                    {/* Info row: fixed-size icon + text block */}
                    <div className={styles.docInfoRow}>
                      <span className={`${styles.docIcon} ${moduleClass(visual.iconClass)}`}>
                        <DocIcon className={styles.docIconSvg} aria-hidden="true" />
                      </span>
                      <div className={styles.docTextBlock}>
                        <div className={styles.docName}>{doc.label}</div>
                        <div className={styles.docMeta}>{resolveDocumentMetaText(doc)}</div>
                      </div>
                    </div>

                    {/* Actions row: status badge + upload / resubmit button */}
                    <div className={styles.docActionsRow}>
                      <span className={`${styles.badge} ${moduleClass(visual.badgeClass)}`}>
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
                  </div>

                  {/* ── Right column: upload dropzone (desktop only when active) ── */}
                  {showUploadArea ? (
                    <div className={styles.docCardRight}>
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
              </div>
            );
          })}
        </div>
      )}

      {/*
        Single hidden file input shared across all document rows.
        activeUploadKey determines which document row owns the current pick.
        See component JSDoc for the single-input design rationale.
      */}
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
