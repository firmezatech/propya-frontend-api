/**
 * Tests: FmzKycDocumentsCard — component rendering
 *
 * Verifies:
 *   - Document title and description render as readable text
 *   - Status badge renders the correct label for every status
 *   - Upload button ("Enviar agora") appears only for `pending` documents
 *   - Resubmit button ("Reenviar") appears only for `rejected` / `needs_resubmission`
 *   - Neither button appears for `verified` / `under_review`
 *   - Upload area is hidden by default and shown after the upload button is clicked
 *   - onToast is called with success message when upload resolves
 *   - onToast is NOT called when upload rejects (error gate preserved)
 *   - Upload error banner renders when uploadError prop is non-null
 *   - Empty state renders when documents array is empty
 *   - Pending count banner renders when pendingCount > 0
 *
 * Assertion conventions (no jest-dom; consistent with existing project tests):
 *   - `screen.getByText(...)` — throws if element not found → presence is implicit
 *   - `screen.queryByText(...)` + `.toBeNull()` — absence assertion
 *   - `screen.getByRole(...)` — throws if not found
 *   - `screen.queryByRole(...)` + `.toBeNull()` — absence assertion
 *   - `expect(element).not.toBeNull()` — for `document.querySelector` results
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FmzFmzKycDocumentsCard } from '../features/account/components/FmzKycDocumentsCard';
import type { TenantKycDocument, TenantKycDocumentUploadParams } from '../features/tenant-portal/domain/fmz-tenant-profile.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeDoc = (overrides: Partial<TenantKycDocument> = {}): TenantKycDocument => ({
  requirementKey: 'identity_document',
  label: 'Documento de identidade',
  description: 'RG, CNH ou documento oficial com foto',
  documentType: 'identity_document',
  status: 'pending',
  documentId: null,
  fileName: null,
  submittedAt: null,
  reviewedAt: null,
  rejectionReason: null,
  ...overrides,
});

const resolvedUpload = jest.fn().mockResolvedValue(undefined);
const noop = (_params: TenantKycDocumentUploadParams) => Promise.resolve();
const noopToast = (_msg: string) => { /* intentionally empty */ };

const defaultProps = {
  documents: [makeDoc()],
  onUpload: noop,
  onToast: noopToast,
  isUploading: false,
  uploadError: null,
};

beforeEach(() => {
  resolvedUpload.mockClear();
});

// ─── Title and description rendering ─────────────────────────────────────────

describe('FmzKycDocumentsCard — text rendering', () => {

  it('renders the document label as a single readable text node', () => {
    render(<FmzKycDocumentsCard {...defaultProps} />);
    // getByText throws if the full string is not found → proves no word-by-word wrapping in DOM
    screen.getByText('Documento de identidade');
  });

  it('falls back to the description field when status produces no meta override', () => {
    const doc = makeDoc({ status: 'pending', fileName: null });
    render(<FmzKycDocumentsCard {...defaultProps} documents={[doc]} />);
    screen.getByText('RG, CNH ou documento oficial com foto');
  });

  it('shows fileName as meta text when a file has been submitted', () => {
    const doc = makeDoc({ status: 'pending', fileName: 'meu_rg.pdf' });
    render(<FmzKycDocumentsCard {...defaultProps} documents={[doc]} />);
    screen.getByText('meu_rg.pdf');
  });

  it('shows rejection reason for rejected documents', () => {
    const doc = makeDoc({ status: 'rejected', rejectionReason: 'Documento ilegível' });
    render(<FmzKycDocumentsCard {...defaultProps} documents={[doc]} />);
    screen.getByText('Rejeitado: Documento ilegível');
  });

  it('shows resubmission reason for needs_resubmission documents', () => {
    const doc = makeDoc({ status: 'needs_resubmission', rejectionReason: 'Foto cortada' });
    render(<FmzKycDocumentsCard {...defaultProps} documents={[doc]} />);
    screen.getByText('Reenvio necessário: Foto cortada');
  });

  it('shows "approved on" meta text for verified documents with reviewedAt', () => {
    const doc = makeDoc({ status: 'verified', reviewedAt: '2024-03-15' });
    render(<FmzKycDocumentsCard {...defaultProps} documents={[doc]} />);
    // formatDateBR formats as DD/MM/YYYY
    screen.getByText('Aprovado em 15/03/2024');
  });

  it('shows "submitted / under review" meta for under_review documents with submittedAt', () => {
    const doc = makeDoc({ status: 'under_review', submittedAt: '2024-03-10T12:00:00Z' });
    render(<FmzKycDocumentsCard {...defaultProps} documents={[doc]} />);
    // Contains "aguardando análise" regardless of the date portion
    expect(screen.getAllByText(/aguardando análise/).length).toBeGreaterThan(0);
  });

});

// ─── Status badge ─────────────────────────────────────────────────────────────

describe('FmzKycDocumentsCard — status badge', () => {

  it('shows "Pendente" badge for pending documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'pending' })]} />);
    screen.getByText('Pendente');
  });

  it('shows "Em análise" badge for under_review documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'under_review' })]} />);
    screen.getByText('Em análise');
  });

  it('shows "Verificado" badge for verified documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'verified' })]} />);
    screen.getByText('Verificado');
  });

  it('shows "Rejeitado" badge for rejected documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'rejected' })]} />);
    screen.getByText('Rejeitado');
  });

  it('shows "Reenviar documento" badge for needs_resubmission documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'needs_resubmission' })]} />);
    screen.getByText('Reenviar documento');
  });

});

// ─── Upload button visibility ─────────────────────────────────────────────────

describe('FmzKycDocumentsCard — upload button visibility', () => {

  it('shows "Enviar agora" button for pending documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'pending' })]} />);
    screen.getByRole('button', { name: /Enviar agora/i });
  });

  it('shows "Reenviar" button for rejected documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'rejected' })]} />);
    screen.getByRole('button', { name: /Reenviar/i });
  });

  it('shows "Reenviar" button for needs_resubmission documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'needs_resubmission' })]} />);
    screen.getByRole('button', { name: /Reenviar/i });
  });

  it('does NOT show upload/resubmit buttons for verified documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'verified' })]} />);
    expect(screen.queryByRole('button', { name: /Enviar agora/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Reenviar/i })).toBeNull();
  });

  it('does NOT show upload/resubmit buttons for under_review documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'under_review' })]} />);
    expect(screen.queryByRole('button', { name: /Enviar agora/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Reenviar/i })).toBeNull();
  });

});

// ─── Upload area toggle ───────────────────────────────────────────────────────

describe('FmzKycDocumentsCard — upload area interaction', () => {

  it('upload dropzone is hidden by default', () => {
    render(<FmzKycDocumentsCard {...defaultProps} />);
    expect(screen.queryByText(/Arraste o arquivo ou clique para selecionar/i)).toBeNull();
  });

  it('upload dropzone appears after clicking "Enviar agora"', () => {
    render(<FmzKycDocumentsCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Enviar agora/i }));
    screen.getByText(/Arraste o arquivo ou clique para selecionar/i);
  });

  it('"Selecionar arquivo" button text is present in the dropzone after opening', () => {
    render(<FmzKycDocumentsCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Enviar agora/i }));
    // getAllByText because the uploadBox container (role=button) and the inner <button>
    // both carry this text in their accessible content.
    expect(screen.getAllByText('Selecionar arquivo').length).toBeGreaterThan(0);
  });

  it('hidden file input is always present (single-input design)', () => {
    render(<FmzKycDocumentsCard {...defaultProps} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
  });

});

// ─── Toast gating ─────────────────────────────────────────────────────────────

describe('FmzKycDocumentsCard — toast behavior', () => {

  it('calls onToast with success message when upload resolves', async () => {
    const onToast = jest.fn();
    const onUpload = jest.fn().mockResolvedValue(undefined);
    render(<FmzKycDocumentsCard {...defaultProps} onUpload={onUpload} onToast={onToast} />);

    fireEvent.click(screen.getByRole('button', { name: /Enviar agora/i }));

    const file = new File(['content'], 'rg.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(onToast).toHaveBeenCalledWith('Documento enviado para análise.');
    });
  });

  it('does NOT call onToast when upload rejects', async () => {
    const onToast = jest.fn();
    const onUpload = jest.fn().mockRejectedValue(new Error('Arquivo inválido'));
    render(<FmzKycDocumentsCard {...defaultProps} onUpload={onUpload} onToast={onToast} />);

    fireEvent.click(screen.getByRole('button', { name: /Enviar agora/i }));

    const file = new File(['content'], 'rg.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(onToast).not.toHaveBeenCalled();
    });
  });

  it('closes the upload area after a successful upload', async () => {
    const onUpload = jest.fn().mockResolvedValue(undefined);
    render(<FmzKycDocumentsCard {...defaultProps} onUpload={onUpload} />);

    fireEvent.click(screen.getByRole('button', { name: /Enviar agora/i }));
    screen.getByText(/Arraste o arquivo ou clique para selecionar/i);

    const file = new File(['content'], 'rg.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.queryByText(/Arraste o arquivo ou clique para selecionar/i)).toBeNull();
    });
  });

  it('keeps the upload area open after a failed upload (allow retry)', async () => {
    const onUpload = jest.fn().mockRejectedValue(new Error('Arquivo inválido'));
    render(<FmzKycDocumentsCard {...defaultProps} onUpload={onUpload} />);

    fireEvent.click(screen.getByRole('button', { name: /Enviar agora/i }));

    const file = new File(['content'], 'rg.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      // Upload area must remain open for retry
      screen.getByText(/Arraste o arquivo ou clique para selecionar/i);
    });
  });

});

// ─── Error banner ─────────────────────────────────────────────────────────────

describe('FmzKycDocumentsCard — error banner', () => {

  it('renders upload error banner when uploadError prop is non-null', () => {
    render(
      <FmzKycDocumentsCard {...defaultProps} uploadError="Formato de arquivo não suportado." />,
    );
    screen.getByText('Erro ao enviar');
    screen.getByText('Formato de arquivo não suportado.');
  });

  it('does not render error banner when uploadError is null', () => {
    render(<FmzKycDocumentsCard {...defaultProps} uploadError={null} />);
    expect(screen.queryByText('Erro ao enviar')).toBeNull();
  });

});

// ─── Pending count banner ─────────────────────────────────────────────────────

describe('FmzKycDocumentsCard — pending count banner', () => {

  it('renders pending count banner when there are actionable documents', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[makeDoc({ status: 'pending' })]} />);
    screen.getByText('Verificação incompleta');
    // Full alert sentence is unique — avoids matching the footer counter.
    screen.getByText(/1 documento pendente\. Complete o envio/);
  });

  it('renders plural text for multiple pending-action documents', () => {
    render(
      <FmzKycDocumentsCard
        {...defaultProps}
        documents={[
          makeDoc({ status: 'pending', requirementKey: 'doc-1' }),
          makeDoc({ status: 'rejected', requirementKey: 'doc-2', label: 'Comprovante de renda' }),
        ]}
      />,
    );
    // The alert body contains the full sentence which is unique.
    screen.getByText(/2 documentos pendentes\. Complete o envio/);
  });

  it('does NOT render pending banner when all documents are verified or under_review', () => {
    render(
      <FmzKycDocumentsCard
        {...defaultProps}
        documents={[makeDoc({ status: 'verified' })]}
      />,
    );
    expect(screen.queryByText('Verificação incompleta')).toBeNull();
  });

});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('FmzKycDocumentsCard — empty state', () => {

  it('renders empty state message when documents array is empty', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[]} />);
    screen.getByText('Nenhum documento solicitado no momento.');
  });

  it('does not render any document cards when documents array is empty', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={[]} />);
    expect(screen.queryByText('Documento de identidade')).toBeNull();
  });

});

// ─── Multiple documents ───────────────────────────────────────────────────────

describe('FmzKycDocumentsCard — multiple documents', () => {

  const multiDocs: TenantKycDocument[] = [
    makeDoc({ requirementKey: 'identity', label: 'Documento de identidade', status: 'pending' }),
    makeDoc({ requirementKey: 'selfie', label: 'Selfie com documento', status: 'verified', reviewedAt: '2024-01-20' }),
    makeDoc({ requirementKey: 'address', label: 'Comprovante de endereço', status: 'under_review', submittedAt: '2024-01-18T10:00:00Z' }),
  ];

  it('renders all document labels', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={multiDocs} />);
    screen.getByText('Documento de identidade');
    screen.getByText('Selfie com documento');
    screen.getByText('Comprovante de endereço');
  });

  it('renders one badge per document', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={multiDocs} />);
    screen.getByText('Pendente');
    screen.getByText('Verificado');
    screen.getByText('Em análise');
  });

  it('upload button only appears for the pending document', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={multiDocs} />);
    const uploadButtons = screen.getAllByRole('button', { name: /Enviar agora/i });
    expect(uploadButtons).toHaveLength(1);
  });

  it('clicking the upload button opens dropzone for only one card', () => {
    render(<FmzKycDocumentsCard {...defaultProps} documents={multiDocs} />);
    fireEvent.click(screen.getByRole('button', { name: /Enviar agora/i }));
    // Only one dropzone must appear
    const dropzones = screen.getAllByText(/Arraste o arquivo ou clique para selecionar/i);
    expect(dropzones).toHaveLength(1);
  });

});
