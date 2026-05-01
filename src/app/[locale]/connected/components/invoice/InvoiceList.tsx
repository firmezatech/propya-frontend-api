"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from 'lucide-react';
import { useTranslations } from "next-intl";
import { InfoTooltip } from '../../../components/ui';

import {
  getInvoice,
  getMaintenanceList,
  InvoiceData,
  MaintenanceData,
} from "../../../../../services/web3-api";

import InvoiceItem from "./InvoiceItem";
import MaintenanceItem from "../maintenance/MaintenanceItem";

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
  renderInvoiceDetails?: (invoice: InvoiceData) => React.ReactNode;
  isAdminView: boolean;
  onConfirmPayment?: (invoiceId: number) => Promise<void>;
  isConfirming?: number | null;
}

interface InvoiceBaseProps {
  children?: React.ReactNode | ((context: InvoiceBaseContext) => React.ReactNode);
  isAdminView?: boolean;
  filterInvoices?: (invoices: InvoiceData[]) => InvoiceData[];
  customTitle?: string;
  onConfirmPayment?: (invoiceId: number) => Promise<void>;
  propertyId?: number;
}

export default function InvoiceAllList({
  children,
  isAdminView = false,
  filterInvoices,
  customTitle,
  onConfirmPayment,
  propertyId
}: InvoiceBaseProps) {
  {/*Renter*/}
  const router = useRouter();
  const t = useTranslations("InvoiceList");
  const dash = useTranslations("DashboardRenter");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [displayedInvoices, setDisplayedInvoices] = useState<InvoiceData[]>([]);
  const [maintenanceMap, setMaintenanceMap] = useState<Record<number, MaintenanceData[]>>({});
  const [visibleInvoiceId, setVisibleInvoiceId] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState<number | null>(null);
  const [visibleMaintenanceId, setVisibleMaintenanceId] = useState<number | null>(null);
  const [itemsToShow, setItemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const handleOpenLink = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      url,
      '_blank',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
  }, []);

  const loadMoreItems = async () => {
    setIsLoadingMore(true);
    
    // Simular um pequeno delay para UX (opcional)
    setTimeout(() => {
      let filteredInvoices = invoices.filter(invoice => invoice.status !== 1); // Exclude cancelled invoices
      const allInvoices = filterInvoices ? filterInvoices(filteredInvoices) : filteredInvoices;
      setDisplayedInvoices(allInvoices);
      setIsLoadingMore(false);
    }, 300);
  };

  const fetchInvoices = async () => {
    setMessage(common("loading"));

    try {
      const all = await getInvoice(undefined, propertyId);
      const invoiceList = Array.isArray(all) ? all : all ? [all] : [];

      setInvoices(invoiceList);

      // Apply filter and exclude cancelled invoices, then limit initial display
      let filteredInvoices = invoiceList.filter(invoice => invoice.status !== 1); // Exclude cancelled invoices
      const finalFilteredInvoices = filterInvoices ? filterInvoices(filteredInvoices) : filteredInvoices;
      const initialItems = finalFilteredInvoices.slice(0, itemsToShow);
      setDisplayedInvoices(initialItems);

      const maintenances = await Promise.all(
        invoiceList.map(async (inv) => {
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
      setMessage(common("pleaseLogin"));
      return;
    }

    fetchInvoices();
  }, [wallet, itemsToShow, propertyId]);

  const toggleInvoiceDetails = (invoiceId: number) => {
    setVisibleInvoiceId((prev) => (prev === invoiceId ? null : invoiceId));
  };

  const toggleMaintenance = (invoiceId: number) => {
    setVisibleMaintenanceId((prev) => (prev === invoiceId ? null : invoiceId));
  };

  const handleBackNavigation = () => {
    router.back();
  };

  // Handle confirm payment logic
  const handleConfirmPayment = async (invoiceId: number) => {
    if (isConfirming !== null || !onConfirmPayment) return;
    setIsConfirming(invoiceId);
  };

  // Check if there are more items to show
  let filteredInvoices = invoices.filter(invoice => invoice.status !== 1); // Exclude cancelled invoices
  const allInvoices = filterInvoices ? filterInvoices(filteredInvoices) : filteredInvoices;
  const hasMoreItems = allInvoices.length > displayedInvoices.length;

  const renderInvoiceDetails = (invoice: InvoiceData) => (
    <InvoiceItem
      invoice={invoice}
      maintenanceList={maintenanceMap[invoice.invoiceId] || []}
      isAdminView={isAdminView}
      onConfirmPayment={isAdminView && onConfirmPayment ? () => handleConfirmPayment(invoice.invoiceId) : undefined}
      isConfirming={isConfirming === invoice.invoiceId}
    />
  );

  // Função para comparar apenas a data (sem horário)
  const isOverdue = (invoice: InvoiceData) => {
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // dueDateNumber é um timestamp em segundos, precisa multiplicar por 1000 para milissegundos
    const dueDate = new Date(invoice.dueDateNumber * 1000);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    return dueDateOnly < todayDateOnly;
  };

  // Função de renderização do status com cores exatamente como na imagem
  const renderStatus = (invoice: InvoiceData) => {
    if (invoice.status === 3) {
      return <span className="text-green-600 bg-green-100 px-5 py-1 rounded-lg font-medium">{t("paid")}</span>;
    } else if (invoice.status === 0) {

      if (invoice.invoiceType === 2) {
        return <span className="text-orange-600 bg-orange-100 px-5 py-1 rounded-lg font-medium">{t("pix")}</span>;
      } else if (isOverdue(invoice)) {
        return <span className="text-red-600 bg-red-100 px-5 py-1 rounded-lg font-medium">{t("overdue")}</span>;
      } else {      
          return <span className="text-blue-600 bg-blue-100 px-5 py-1 rounded-lg font-medium">{t("toPay")}</span>;
      }
    } else if (invoice.status === 1) {
      return <span className="text-gray-600 bg-gray-100 px-5 py-1 rounded-lg font-medium">{t("cancelled")}</span>;
    }
  }

  // Create context for children
  const contextValue: InvoiceBaseContext = {
    wallet,
    message,
    invoices: displayedInvoices,
    maintenanceMap,
    visibleInvoiceId,
    setMessage,
    fetchInvoices,
    toggleInvoiceDetails,
    handleBackNavigation,
    renderInvoiceDetails,
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

  const formatZeroAsDash = (value: string | number) => {
    // Converte para string
    const str = String(value);

    // Verifica se é zero: R$ 0,00 (com qualquer tipo de espaço)
    if (str.length === 7 && str.startsWith('R$') && str.endsWith('0,00')) {
      return '-';
    }

    return value;
  };

  const formatPaymentDate = (date: string | undefined) => {
    if (!date || date === '' || date === '0' || date === 'undefined' || date === 'null') return '';
    return date;
  };

  return (
    <div className="container mx-auto px-2">
      <main className="mt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          {isAdminView && renderChildren()}
        </div>

        {message && (
          <div className={`mb-6 rounded-md p-4 text-sm ${message.includes("success")
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
            }`}>
            {message}
          </div>
        )}

        {/* Tabela de invoices */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full w-1/2 divide-y divide-gray-200">
              <thead className="bg-gray-50 px-6">
                <tr className="border-b border-gray-300">
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.boleto.line1")}</div>
                      <div>{t("tableHeaders.boleto.line2")}</div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.dueDate.line1")}</div>
                      <div>{t("tableHeaders.dueDate.line2")}</div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.total.line1")}</div>
                      <div>{t("tableHeaders.total.line2")}</div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("tableHeaders.rent.line1")}&nbsp;
                    <InfoTooltip content={dash('rentDiscountInfo')} position="bottom" />
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.rentValueFee.line1")}</div>
                      <div className="flex items-center justify-end">
                        {t("tableHeaders.rentValueFee.line2")}&nbsp;
                        <InfoTooltip content={dash('rentValueFeeInfo')} position="bottom" />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.condoFee.line1")}</div>
                      <div className="flex items-center justify-end">
                        {t("tableHeaders.condoFee.line2")}&nbsp;
                        <InfoTooltip content={dash('condominiumInfo')} position="bottom" />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("tableHeaders.propertyTax.line1")}&nbsp;
                    <InfoTooltip content={dash('propertyTaxInfo')} position="bottom" />
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("tableHeaders.maintenance.line1")}&nbsp;
                    <InfoTooltip content={dash("maintenanceInfo")} position="bottom" />
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.tokenPurchase.line1")}</div>
                      <div className="flex items-center justify-end">
                        {t("tableHeaders.tokenPurchase.line2")}&nbsp;
                        <InfoTooltip content={dash('scheduledTokenPurchase2Info')} position="bottom" />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.adminFee.line1")}</div>
                      <div className="flex items-center justify-end">
                        {t("tableHeaders.adminFee.line2")}&nbsp;
                        <InfoTooltip content={dash('fractionAcquisitionFeeInfo')} position="bottom" />
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("tableHeaders.penalty.line1")}&nbsp;
                    <InfoTooltip content={dash('penaltyInfo')} position="bottom" />
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("tableHeaders.interest.line1")}&nbsp;
                    <InfoTooltip content={dash('interestInfo')} position="bottom" />
                  </th>
                  <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.paymentDate.line1")}</div>
                      <div>{t("tableHeaders.paymentDate.line2")}</div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="inline-block">
                      <div className="text-left">{t("tableHeaders.status.line1")}</div>
                      <div>{t("tableHeaders.status.line2")}</div>
                    </div>
                  </th>
                  <th scope="col" className="">
                    <div className="inline-block">
                      <div className="text-left"></div>
                      <div></div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">{displayedInvoices.map((invoice) => (
                <React.Fragment key={invoice.invoiceId}>
                  <tr className={visibleInvoiceId === invoice.invoiceId ? "bg-blue-50" : "hover:bg-gray-50"}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.invoiceId}</td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm ${(invoice.status != 3 && invoice.status != 1) && isOverdue(invoice) ? 'text-red-900' : 'text-gray-900'}`}>{invoice.dueDate}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{formatZeroAsDash(invoice.totalInvoice)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.currentRentAsOwnerValue)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.rentValueFee)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.condoFee)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.propertyTaxCurrency)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{formatZeroAsDash(invoice.maintenanceAsOwnerValue)}</span>
                        {invoice.maintenanceAsOwnerNumber > 0 && (<>
                          <button className="button-line-transparent text-xs px-1 py-1 flex items-center" onClick={(e) => toggleMaintenance(invoice.invoiceId)}>
                            <ChevronDown size={16} className={`transition-transform ${visibleMaintenanceId === invoice.invoiceId ? 'transform rotate-180' : ''}`} />
                          </button></>)}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.tokensToBuyCurrency)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.tokensToBuyFee)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.penaltyCurrency)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatZeroAsDash(invoice.interestCurrency)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPaymentDate(invoice.paymentDate)}</td>
                    <td className="px-3 py-4 font-medium text-center">
                      {renderStatus(invoice)} 
                    </td>
                    <td className="px-3 py-4 font-medium text-center">

                      {invoice.path && (
                        <a href={invoice.path} onClick={(e) => handleOpenLink(e, invoice.path!)} rel="noopener noreferrer">
                          {invoice.invoiceType === 2 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.34 1.343a3.998 3.998 0 0 0-5.655 1.54L4.17 8.017a4 4 0 0 0 2.828 6.828l3.006-3.005-4.242-4.242a2 2 0 1 1 2.828-2.828l7.07 7.07-1.413 1.415 2.12 2.12c.78.78.78 2.05 0 2.828L14.12 20.38a2 2 0 0 1-2.828 0L3.414 12.5a2 2 0 0 1 0-2.828L4.828 8.26l-1.414-1.414-2.12 2.12c-1.56 1.56-1.56 4.09 0 5.657l7.88 7.878a4 4 0 0 0 5.656 0l2.122-2.12a4 4 0 0 0 0-5.657l-5.303-5.302zM19.828 12l-2.12 2.12 1.414 1.414 2.12-2.12c.78-.78.78-2.05 0-2.828l-7.07-7.071a2 2 0 1 0-2.828 2.828l4.242 4.243-3.005 3.006a4 4 0 0 0-2.828-6.828L13.34 1.343a3.998 3.998 0 0 1 5.655 1.54l3.536 3.536a4 4 0 0 1-2.703 5.58z"/>
                            </svg>
                          ) : (
                            <svg
                              className="h-6 w-6 inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          )}
                        </a>
                      )}
                    </td>
                  </tr>
                  {visibleMaintenanceId === invoice.invoiceId && (
                    <tr>
                      <td colSpan={11} className="px-3 py-4">
                        <MaintenanceItem
                          maintenanceList={maintenanceMap[invoice.invoiceId] || []}
                          maintenanceTotal={invoice.maintenanceTotal}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
                {displayedInvoices.length === 0 && !message && (
                  <tr>
                    <td colSpan={11} className="px-3 py-4 text-center text-sm text-gray-500">
                      {t("noInvoicesFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Botão Ver Mais */}
          {hasMoreItems && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
              <button
                onClick={loadMoreItems}
                disabled={isLoadingMore}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoadingMore ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {common("loading")}...
                  </>
                ) : (
                  <>
                    Ver mais ({allInvoices.length - displayedInvoices.length} restantes)
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Informação sobre itens exibidos */}
          <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600 text-center">
            Mostrando {displayedInvoices.length} de {allInvoices.length} registros
          </div>
        </div>

        {!isAdminView && renderChildren()}
      </main>
    </div>
  );
}

