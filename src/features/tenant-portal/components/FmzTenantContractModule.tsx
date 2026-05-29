'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FmzConnectedPageShell } from '../../../components/layout';
import { getCurrentTenantContract } from '../services/fmz-tenant-contract-api';
import type { FmzTenantContractPageData } from '../domain/fmz-tenant-contract.types';
import { FmzTenantContractPage } from './FmzTenantContractPage';

const optionalString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

function resolveContractDocumentUrl(contractPage: FmzTenantContractPageData | null): string | null {
  const contract = contractPage?.contract;
  const contractRecord = (contract && typeof contract === 'object' ? contract : {}) as Record<string, unknown>;
  return (
    optionalString(contract?.contractFileUrl) ??
    optionalString(contract?.signedDocumentUrl) ??
    optionalString(contract?.documentUrl) ??
    optionalString(contractRecord.contract_file_url) ??
    optionalString(contractRecord.signed_document_url) ??
    optionalString(contractRecord.document_url) ??
    optionalString(contractRecord.file_url)
  );
}

function ContractLoadingState() {
  return (
    <div className="rounded-2xl border border-fmz-border-light bg-white p-8 text-center text-sm text-fmz-text-muted">
      <span className="mx-auto mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-fmz-border-light border-t-fmz-navy" />
      Carregando contrato...
    </div>
  );
}

function ContractErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-fmz-border-light bg-white p-8 text-center">
      <p className="font-sans text-xl font-bold text-fmz-navy">Erro ao carregar contrato</p>
      <p className="mt-2 text-sm leading-6 text-fmz-text-muted">{message}</p>
    </div>
  );
}

function ContractEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-fmz-border-light bg-white p-8 text-center">
      <p className="font-sans text-xl font-bold text-fmz-navy">Contrato não encontrado</p>
      <p className="mt-2 text-sm leading-6 text-fmz-text-muted">
        A rota GET /tenant/contract não retornou dados de contrato para esta inquilina.
      </p>
    </div>
  );
}

export function TenantContractModule() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const requestSequenceRef = useRef(0);

  const [contractPage, setContractPage] = useState<FmzTenantContractPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const seq = ++requestSequenceRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    getCurrentTenantContract(propertyId)
      .then((page) => {
        if (seq !== requestSequenceRef.current) return;
        setContractPage(page);
      })
      .catch(() => {
        if (seq !== requestSequenceRef.current) return;
        setErrorMessage(
          'Não foi possível carregar os dados do contrato. Verifique se a sessão está ativa e se a role tenant possui permissão para a rota GET /tenant/contract.',
        );
      })
      .finally(() => {
        if (seq === requestSequenceRef.current) setIsLoading(false);
      });
  }, [propertyId]);

  return (
    <FmzConnectedPageShell width="tenant">
      {isLoading ? (
        <ContractLoadingState />
      ) : errorMessage ? (
        <ContractErrorState message={errorMessage} />
      ) : !contractPage ? (
        <ContractEmptyState />
      ) : (
        <FmzTenantContractPage
          contractPage={contractPage}
          contractDocumentUrl={resolveContractDocumentUrl(contractPage)}
        />
      )}
    </FmzConnectedPageShell>
  );
}
