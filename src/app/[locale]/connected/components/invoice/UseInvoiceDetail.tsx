'use client';

import { useState, useEffect } from 'react';
import { 
  getInvoice,
  getMaintenanceList,
  InvoiceData,
  MaintenanceData
} from "../../../../../services/web3-api";

/**
 * Custom hook to fetch invoice details and related maintenance list
 * @param {number|null} invoiceId - The ID of the invoice to fetch
 * @param {boolean} autoFetch - Whether to fetch automatically on mount
 * @returns {Object} Invoice details, maintenance list, loading state, error message, and fetch function
 */
export function useInvoiceDetails(
    invoiceId: number | null = null, 
    autoFetch: boolean = true
  ) {
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceData | null>(null);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceData[] | []>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInvoiceData = async (idToFetch: any) => {
    if (!idToFetch) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const detail = await getInvoice(Number(idToFetch));
      const invoice = Array.isArray(detail) ? detail[0] : detail;
      setInvoiceDetail(invoice);

      if (invoice) {
        const list = await getMaintenanceList(
          Number(invoice.propertyId),
          Number(idToFetch)
        );
        setMaintenanceList(list || []);
      } else {
        setMaintenanceList([]);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes do boleto", err);
      setErrorMessage("Erro ao carregar os dados.");
      setInvoiceDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto fetch on mount if invoiceId is provided and autoFetch is true
  useEffect(() => {
    if (autoFetch && invoiceId) {
      fetchInvoiceData(invoiceId);
    }
  }, [invoiceId, autoFetch]);

  return {
    invoiceDetail,
    maintenanceList,
    isLoading,
    errorMessage,
    fetchInvoiceData,
    clearInvoiceData: () => {
      setInvoiceDetail(null);
      setMaintenanceList([]);
      setErrorMessage(null);
    }
  };
}