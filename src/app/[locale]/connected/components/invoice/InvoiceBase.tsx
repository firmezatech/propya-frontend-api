"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InvoiceItem from "./InvoiceItem";
import { useTranslations } from "next-intl";

import {
  getInvoice,
  getMaintenanceList,
  InvoiceData,
  MaintenanceData,
} from "../../../../../services/web3-api";

export interface InvoiceBaseContext {
  wallet: string | null;
  message: string | null;
  invoices: InvoiceData[];
  maintenanceMap: Record<number, MaintenanceData[]>;
  visibleInvoiceId: number | null;
  setMessage: (msg: string | null) => void;
  fetchInvoices: () => Promise<void>;
  toggleInvoiceDetails: (invoiceId: number) => void;
  handleBackNavigation: () => void;
  renderInvoiceItem?: (invoice: InvoiceData) => React.ReactNode;
  renderInvoiceDetails?: (invoice: InvoiceData) => React.ReactNode;
  renderInvoiceList?: boolean;
  isAdminView: boolean;
  onConfirmPayment?: (invoiceId: number, propertyId: number) => Promise<void>;
  isConfirming?: number | null;
}

interface InvoiceBaseProps {
  children?: React.ReactNode | ((context: InvoiceBaseContext) => React.ReactNode);
  isAdminView?: boolean;
  filterInvoices?: (invoices: InvoiceData[]) => InvoiceData[];
  customTitle?: string;
  onConfirmPayment?: (invoiceId: number, propertyId: number) => Promise<void>;
}

export default function InvoiceBase({ 
  children, 
  isAdminView = false,
  filterInvoices,
  customTitle,
  onConfirmPayment
}: InvoiceBaseProps) {
  const t = useTranslations("invoiceBase");
  const common = useTranslations("Common");
  const router = useRouter();

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [maintenanceMap, setMaintenanceMap] = useState<Record<number, MaintenanceData[]>>({});
  const [visibleInvoiceId, setVisibleInvoiceId] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState<number | null>(null);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);

    const handleWalletChange = () => {
      const stored = localStorage.getItem("wallet");
      setWallet(stored);
    };

    window.addEventListener("walletChanged", handleWalletChange);
    return () => window.removeEventListener("walletChanged", handleWalletChange);
  }, []);

  const fetchInvoices = async () => {
    setMessage(common("loading"));
    
    try {
      const all = await getInvoice();
      const invoiceList = Array.isArray(all) ? all : all ? [all] : [];
      
      const sorted = [...invoiceList].sort((a, b) => {
        // Ordenação por invoiceId (decrescente)
        return Number(b.invoiceId) - Number(a.invoiceId);
      });
      
      setInvoices(sorted);
      
      const maintenances = await Promise.all(
        sorted.map(async (inv) => {
          const list = await getMaintenanceList(Number(inv.propertyId), Number(inv.invoiceId));
          return { invoiceId: inv.invoiceId, list: list || [] };
        })
      );
      
      const maintenanceDataMap: Record<number, MaintenanceData[]> = {};
      maintenances.forEach((entry) => {
        maintenanceDataMap[entry.invoiceId] = entry.list;
      });
      
      setMaintenanceMap(maintenanceDataMap);
      setMessage(null);
    } catch (err) {
      console.error(common("errorLoadingData"), err);
      setMessage(common("errorLoadingData"));
    }
  };

  useEffect(() => {
    if (!wallet) {
      setMessage(common("login"));
      return;
    }

    fetchInvoices();
  }, [wallet]);

  const toggleInvoiceDetails = (invoiceId: number) => {
    setVisibleInvoiceId((prev) => (prev === invoiceId ? null : invoiceId));
  };

  const handleBackNavigation = () => {
    router.back();
  };

  // Handle confirm payment logic
  const handleConfirmPayment = async (invoiceId: number, propertyId: number) => {
    if (isConfirming !== null || !onConfirmPayment) return;

    setIsConfirming(invoiceId);
    setMessage(t("confirmingReceipt"));

    try {
      await onConfirmPayment(invoiceId, propertyId);
      setMessage(t("paymentConfirmed", { invoiceId }));
      await fetchInvoices();
    } catch (error) {
      console.error(t("errorConfirmingPayment"), error);
      setMessage(t("errorConfirmingPayment", { error: error instanceof Error ? error.message : 'Erro desconhecido' }));
    } finally {
      setIsConfirming(null);
    }
  };

  // Apply filter if provided
  const displayedInvoices = filterInvoices ? filterInvoices(invoices) : invoices;

  // Create render functions for invoice items
  const renderInvoiceItem = (invoice: InvoiceData) => (
    <button
      key={invoice.invoiceId}
      className={`min-w-fit px-4 py-2 border rounded shadow text-sm whitespace-nowrap
        ${visibleInvoiceId === invoice.invoiceId ? "bg-blue-600 text-white" : "bg-white text-blue-600"}
        hover:bg-blue-500 hover:text-white transition`}
      onClick={() => toggleInvoiceDetails(invoice.invoiceId)}
    >
      {invoice.dueDate}
    </button>
  );

  const renderInvoiceDetails = (invoice: InvoiceData) => (
    <InvoiceItem
      invoice={invoice}
      maintenanceList={maintenanceMap[invoice.invoiceId] || []}
      isAdminView={isAdminView}
      onConfirmPayment={isAdminView && onConfirmPayment ? () => handleConfirmPayment(invoice.invoiceId, invoice.propertyId) : undefined}
      isConfirming={isConfirming === invoice.invoiceId}
    />
  );

  // Create context for children
  const contextValue: InvoiceBaseContext = {
    wallet,
    message,
    invoices: displayedInvoices, // Using filtered invoices in context
    maintenanceMap,
    visibleInvoiceId,
    setMessage,
    fetchInvoices,
    toggleInvoiceDetails,
    handleBackNavigation,
    renderInvoiceItem,
    renderInvoiceDetails,
    renderInvoiceList: true,
    isAdminView,
    onConfirmPayment: handleConfirmPayment,
    isConfirming
  };

  // Determine what to render as children
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(contextValue);
    }
    return children;
  };

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          {/* <button onClick={handleBackNavigation} className="border rounded button-line ml-2">
            {t("back")}
          </button> */}
          
          {isAdminView && renderChildren()}
        </div>

        {/* <h1 className="text-2xl font-semibold mb-4">{customTitle || t("invoices")}</h1> */}

        {message && (
          <div className={`mb-6 rounded-md p-4 text-sm ${
            message.includes('sucesso') 
              ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
          }`}>
            {message}
          </div>
        )}

        {/* Lista horizontal de datas de vencimento em ordem decrescente */}
        <div className="flex overflow-x-auto gap-4 mb-6 py-2">
          {displayedInvoices.map(renderInvoiceItem)}
        </div>

        {visibleInvoiceId !== null && 
          displayedInvoices.find(inv => inv.invoiceId === visibleInvoiceId) &&
          renderInvoiceDetails(displayedInvoices.find(inv => inv.invoiceId === visibleInvoiceId)!)}

        {!isAdminView && renderChildren()}
      </main>
    </div>
  );
}
