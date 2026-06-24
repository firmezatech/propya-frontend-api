import { FmzTenantContractPage } from '../../../features/tenant-portal/components/FmzTenantContractPage';
import type { FmzTenantContractPageData } from '../../../features/tenant-portal/domain/fmz-tenant-contract.types';

const mockContractPage: FmzTenantContractPageData = {
  tenant: { id: 't1', name: 'Diana Aguilar', email: 'diana@example.com', initials: 'DA' },
  property: {
    id: 'p1',
    code: 'FT-2024-0412',
    addressLine1: 'Rua das Palmeiras, 412',
    addressLine2: 'Apto 54',
    district: 'Vila Madalena',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '05435-010',
    registryNumber: 'FT-2024-0412',
    appraisedValue: 950000,
    totalAreaM2: 72,
    bedroomsCount: 2,
    monthlyCondoFeeAmount: 480,
    annualPropertyTaxAmount: 2100,
  },
  contract: {
    id: 'c1',
    contractNumber: 'FT-2024-0412',
    startDate: '2024-02-01',
    status: 'active',
  },
  documents: [
    { id: 'd1', type: 'contrato_locacao', fileName: 'Contrato de locação.pdf', fileSizeBytes: 1_200_000, createdAt: '2024-02-01' },
    { id: 'd2', type: 'laudo_avaliacao', fileName: 'Laudo de vistoria — entrada.pdf', fileSizeBytes: 3_800_000, createdAt: '2024-02-01' },
  ],
};

export default function PreviewMeuImovelTmpPage() {
  return (
    <div style={{ background: '#F6F5F2', minHeight: '100vh', padding: '40px 0' }}>
      <FmzTenantContractPage contractPage={mockContractPage} contractDocumentUrl={null} />
    </div>
  );
}
