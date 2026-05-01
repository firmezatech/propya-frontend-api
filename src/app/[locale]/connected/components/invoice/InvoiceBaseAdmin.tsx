"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import InvoiceItem from "./InvoiceItem";
import { useTranslations } from "next-intl";
import { Check, Trash2, X } from 'lucide-react';
import { AxiosError } from 'axios';
import CustomDatePicker from '../../../components/ui/DatePicker';
import { isZeroValue, formatCurrencyInput } from "services/format";

import {
  getInvoice,
  getMaintenanceList,
  InvoiceData,
  MaintenanceData,
  processPaymentConfirmation,
  cancelInvoice,
  APICache // Add this import
} from "../../../../../services/web3-api";

// Função auxiliar para formatar data de yyyy-mm-dd para dd/mm/yyyy
const formatDateToBrazilian = (date: Date | null): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Função auxiliar para converter data de dd/mm/yyyy para yyyy-mm-dd
const formatDateToISO = (date: string): string => {
  if (!date) return '';
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
};

// Função para obter a data atual
const getCurrentDate = (): Date => {
  return new Date();
};

// Função para validar formato dd/mm/yyyy
const isValidDateFormat = (date: string): boolean => {
  if (!date) return false;
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
  if (!regex.test(date)) return false;

  const [day, month, year] = date.split('/').map(Number);
  const testDate = new Date(year, month - 1, day);
  return testDate.getDate() === day &&
    testDate.getMonth() === month - 1 &&
    testDate.getFullYear() === year;
};

// Função auxiliar para formatar valores zero
const formatValue = (displayValue: string | number, numericValue: number) => {
  if (numericValue === 0) {
    return '-';
  }
  return displayValue;
};

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
  onConfirmPayment?: (invoiceId: number, paymentDate: number) => Promise<void>;
  isConfirming?: number | null;
}

interface InvoiceBaseProps {
  children?: React.ReactNode | ((context: InvoiceBaseContext) => React.ReactNode);
  isAdminView?: boolean;
  filterInvoices?: (invoices: InvoiceData[]) => InvoiceData[];
  customTitle?: string;
  onConfirmPayment?: (invoiceId: number, paymentDate: number) => Promise<void>;
}

export default function InvoiceBase({
  children,
  isAdminView = false,
  filterInvoices,
  customTitle,
  onConfirmPayment
}: InvoiceBaseProps) {
  const t = useTranslations("InvoiceBase");
  const common = useTranslations("Common");
  const router = useRouter();

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [displayedInvoices, setDisplayedInvoices] = useState<InvoiceData[]>([]);
  const [maintenanceMap, setMaintenanceMap] = useState<Record<number, MaintenanceData[]>>({});
  const [visibleInvoiceId, setVisibleInvoiceId] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState<number | null>(null);
  const [paymentDates, setPaymentDates] = useState<Record<number, Date | null>>({});
  const [showCalendar, setShowCalendar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [penaltyValues, setPenaltyValues] = useState<Record<number, string>>({});
  const [interestValues, setInterestValues] = useState<Record<number, string>>({});
  const [dialogState, setDialogState] = useState<{
    type: 'confirm' | 'delete' | null;
    invoiceId: number | null;
    reason: string;
    propertyId: number | null;
  }>({
    type: null,
    invoiceId: null,
    reason: '',
    propertyId: null
  });

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
  }, []);

  const loadMoreItems = async () => {
    setIsLoadingMore(true);

    setTimeout(() => {
      const allInvoices = filterInvoices ? filterInvoices(invoices) : invoices;
      setDisplayedInvoices(allInvoices);
      setIsLoadingMore(false);
    }, 300);
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    setMessage(common("loading"));

    try {
      const all = await getInvoice(undefined, undefined, undefined);
      const invoiceList = Array.isArray(all) ? all : all ? [all] : [];

      setInvoices(invoiceList);

      // Apply filter and limit initial display
      const filteredInvoices = filterInvoices ? filterInvoices(invoiceList) : invoiceList;
      const initialItems = filteredInvoices.slice(0, itemsToShow);
      setDisplayedInvoices(initialItems);
      
      // Limpa a mensagem de carregamento se houver dados
      if (invoiceList.length > 0) {
        setMessage(null);
      }

      const maintenances = await Promise.all(
        invoiceList.map(async (inv) => {
          if (inv.propertyId) {
            try {
              const list = await getMaintenanceList(Number(inv.propertyId), Number(inv.invoiceId));
              return { invoiceId: inv.invoiceId, list: list || [] };
            } catch (error) {
              console.warn(`Failed to load maintenance data for invoice ${inv.invoiceId}:`, error);
              return { invoiceId: inv.invoiceId, list: [] };
            }
          }
          return { invoiceId: inv.invoiceId, list: [] };
        })
      );

      const maintenanceDataMap: Record<number, MaintenanceData[]> = {};
      maintenances.forEach((entry) => {
        maintenanceDataMap[entry.invoiceId] = entry.list;
      });

      setMaintenanceMap(maintenanceDataMap);
      setMessage(null); // Limpa a mensagem após carregar com sucesso
    } catch (err) {
      setMessage(common("errorLoadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  // Add refresh function
  const refreshData = useCallback(async () => {
    // Invalidate all relevant caches
    APICache.invalidate('getInvoice');
    APICache.invalidate('getMaintenanceList');
    await fetchInvoices();
  }, []);

  useEffect(() => {
    if (!wallet) {
      setMessage(common("login"));
      return;
    }

    fetchInvoices();
  }, [wallet]);

  // Reapply filter to existing data without fetching from API
  useEffect(() => {
    if (invoices.length > 0 && filterInvoices) {
      const filteredInvoices = filterInvoices(invoices);
      setDisplayedInvoices(filteredInvoices);
    }
  }, [invoices, itemsToShow]);

  // Separate effect to handle filter changes
  useEffect(() => {
    if (invoices.length > 0 && filterInvoices) {
      try {
        const filteredInvoices = filterInvoices(invoices);
        setDisplayedInvoices(filteredInvoices);
      } catch (error) {
        console.error('Error applying filter:', error);
        setDisplayedInvoices(invoices);
      }
    }
  }, [filterInvoices]);

  const toggleInvoiceDetails = (invoiceId: number) => {
    setVisibleInvoiceId((prev) => (prev === invoiceId ? null : invoiceId));
  };

  const handleBackNavigation = () => {
    router.back();
  };

  // Inicializa as datas com a data atual
  useEffect(() => {
    const currentDate = getCurrentDate();
    const initialDates: Record<number, Date | null> = {};
    invoices.forEach(invoice => {
      if (invoice.status !== 3 && invoice.status !== 1) {
        initialDates[invoice.invoiceId] = currentDate;
      }
    });
    setPaymentDates(prev => ({ ...prev, ...initialDates }));
  }, [invoices]);

  const handlePaymentDateChange = (invoiceId: number, date: Date | null) => {
    setPaymentDates(prev => ({
      ...prev,
      [invoiceId]: date
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.date-picker-container')) {
        setShowCalendar(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCalendarChange = (invoiceId: number, date: Date | null) => {
    handlePaymentDateChange(invoiceId, date);
    setShowCalendar(null);
  };

  // Função auxiliar para validar se penalty e interest são válidos
  const isValidPenaltyInterest = (invoiceId: number) => {
    const penaltyInput = penaltyValues[invoiceId] || '0';
    const interestInput = interestValues[invoiceId] || '0';
    
    // Extrair valores numéricos
    const penaltyValue = parseFloat(penaltyInput.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    const interestValue = parseFloat(interestInput.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    
    // Validar se são números válidos (podem ser 0)
    return !isNaN(penaltyValue) && !isNaN(interestValue) && penaltyValue >= 0 && interestValue >= 0;
  };

  const handleConfirmPayment = async (invoiceId: number, propertyId: number) => {
    if (isConfirming !== null) return;

    // Check wallet connection first
    if (!wallet) {
      setMessage(common("login"));
      return;
    }

    const paymentDate = paymentDates[invoiceId];
    if (!paymentDate) {
      setMessage(t("invalidDateFormat"));
      return;
    }

    // Converter a data para timestamp, ajustando para 09:00
    const dateWith9AM = new Date(paymentDate);
    dateWith9AM.setHours(9, 0, 0, 0);
    const dateTimestamp = Math.floor(dateWith9AM.getTime() / 1000);

    // Obter valores de penalty e interest dos estados com validação
  const penaltyInput = penaltyValues[invoiceId] || '0';
  const interestInput = interestValues[invoiceId] || '0';
  
  // Extrair valores numéricos removendo formatação de moeda
  const penaltyNumericValue = parseFloat(penaltyInput.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  const interestNumericValue = parseFloat(interestInput.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  
  // Converter para string - a API processPaymentConfirmation fará a conversão para centavos
  const penaltyValue = penaltyNumericValue.toString();
  const interestValue = interestNumericValue.toString();
    
    // Validate timestamp
    if (isNaN(dateTimestamp) || dateTimestamp <= 0) {
      setMessage(t("invalidDateFormat"));
      setIsConfirming(null);
      return;
    }
    
    // Validate invoiceId and propertyId
    if (!invoiceId || invoiceId <= 0 || !propertyId || propertyId <= 0) {
      setMessage(t("invalidInvoiceData"));
      setIsConfirming(null);
      return;
    }

    setIsConfirming(invoiceId);
    setMessage(t("confirmingReceipt"));

    try {
      
      // Fix: Correct parameter order - invoiceId, paymentDate, status, propertyId, penalty, interest
      console.log('Calling processPaymentConfirmation with:', {
        invoiceId: invoiceId.toString(),
        dateTimestamp,
        status: 3,
        propertyId,
        penaltyValue,
        interestValue
      });

      const result = await processPaymentConfirmation(
        invoiceId.toString(), 
        dateTimestamp, 
        3, 
        propertyId, 
        penaltyValue, 
        interestValue
      );

      if (result.rentPayment.success && result.tokenPurchase.success) {
        setMessage(t("paymentConfirmed", { invoiceId }));
        await refreshData(); // Use refreshData instead of direct fetchInvoices
      } else {
        let errorMessage = t("paymentProcessingFailed");
        if (!result.rentPayment.success) {
          errorMessage += `${t("rentPaymentFailed")}${result.rentPayment.message}. `;
        }
        if (!result.tokenPurchase.success) {
          errorMessage += `${t("tokenTransferFailed")}${result.tokenPurchase.message}. `;
        }
        setMessage(errorMessage);
      }
    } catch (error) {
      let errorMessage = t("errorConfirmingPayment");
      if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 404) {
          errorMessage = t("apiEndpointNotFound");
        } else {
          errorMessage = `${t("errorConfirmingPayment")}: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = t("unknownError");
      }

      setMessage(errorMessage);
    } finally {
      setIsConfirming(null);
      closeDialog();
    }
  };
  
  // Função para verificar se a invoice está em atraso
  const isOverdue = (invoice: InvoiceData) => {
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDate = new Date(invoice.dueDateNumber * 1000);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    return dueDateOnly < todayDateOnly;
  };

  // Handlers para penalty e interest
  const handlePenaltyChange = (invoiceId: number, value: string) => {
    // Para penalty e interest, permitir entrada direta de valores formatados
    // Remove apenas caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    setPenaltyValues(prev => ({
      ...prev,
      [invoiceId]: cleanValue
    }));
  };

  const handleInterestChange = (invoiceId: number, value: string) => {
    // Para penalty e interest, permitir entrada direta de valores formatados
    // Remove apenas caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    setInterestValues(prev => ({
      ...prev,
      [invoiceId]: cleanValue
    }));
  };

  const openDialog = (type: 'confirm' | 'delete', invoiceId: number, propertyId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Check wallet connection first
    if (!wallet) {
      setMessage(common("login"));
      return;
    }

    setDialogState({
      type,
      invoiceId,
      reason: '',
      propertyId
    });
  };

  const closeDialog = useCallback(() => {
    setDialogState({
      type: null,
      invoiceId: null,
      reason: '',
      propertyId: null
    });
  }, []);

  const handleDeleteInvoice = async (invoiceId: number, reason: string, propertyId: number) => {
    if (!reason.trim()) {
      setMessage(t("cancellationReasonRequired"));
      return;
    }
    setIsConfirming(invoiceId);
    setMessage(null);

    try {

      const response = await cancelInvoice(
        propertyId.toString(),
        invoiceId.toString(),
        reason.trim()
      );

      if (response.cancelInvoice.success) {
        setMessage(t("invoiceCancelledSuccess"));
        await refreshData(); // Use refreshData instead of direct fetchInvoices
      } else {
        setMessage(t("errorCancellingInvoice"));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("errorCancellingInvoice");
      setMessage(errorMessage);
    } finally {
      setIsConfirming(null);
      closeDialog();
    }
  };

  // Check if there are more items to show
  const allInvoices = filterInvoices ? filterInvoices(invoices) : invoices;
  const hasMoreItems = allInvoices.length > displayedInvoices.length;

  const renderStatus = (invoice: InvoiceData) => {
    if (invoice.status === 3) {
      return <span className="text-green-600 bg-green-100 px-5 py-1 rounded-lg font-medium">{t("paid")}</span>;
    } else if (invoice.status === 0) {

      if (invoice.invoiceType === 2) {
        return <span className="text-orange-600 bg-orange-100 px-5 py-1 rounded-lg font-medium">{t("pix")}</span>;
      } else {
        // Comparar apenas as datas (dd/mm/yyyy) sem considerar o horário
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const dueDate = new Date(invoice.dueDateNumber * 1000);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (dueDateOnly < todayDateOnly) {
          return <span className="text-red-600 bg-red-100 px-5 py-1 rounded-lg font-medium">{t("overdue")}</span>;
        } else {
          return <span className="text-blue-600 bg-blue-100 px-5 py-1 rounded-lg font-medium">{t("toPay")}</span>;
        }
    }

    } else if (invoice.status === 1) {
      return <span className="text-gray-600 bg-gray-100 px-5 py-1 rounded-lg font-medium">{t("cancelled")}</span>;
    } else {
      return <span className="text-blue-600 bg-blue-100 px-5 py-1 rounded-lg font-medium"></span>;
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

  const ConfirmationDialog = () => {
    const { type, invoiceId, reason } = dialogState;
    if (!type || !invoiceId) return null;

    const invoice = invoices.find(inv => inv.invoiceId === invoiceId);
    if (!invoice) return null;

    const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDialogState(prev => ({
        ...prev,
        reason: e.target.value
      }));
    };

    const handleConfirmClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!wallet) {
        setMessage(common("login"));
        closeDialog();
        return;
      }

      if (type === 'confirm') {
        await handleConfirmPayment(invoiceId, invoice.propertyId);
      } else {
        await handleDeleteInvoice(invoiceId, reason, invoice.propertyId);
      }
    };

    const handleCancelClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      closeDialog();
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleCancelClick}
      >
        <div
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-lg font-semibold mb-4">
            {type === 'confirm' ? t("confirmPaymentTitle") : t("confirmDeleteTitle")}
          </div>
          <div className="mb-6 text-gray-600">
            {type === 'confirm' ? (
              t("confirmPaymentMessage", {
                invoiceId: invoice.invoiceId,
                date: paymentDates[invoice.invoiceId] ? formatDateToBrazilian(paymentDates[invoice.invoiceId]) : '',
                amount: invoice.totalInvoice
              })
            ) : (
              <>
                <p className="mb-4">{t("confirmDeleteMessage", {
                  invoiceId: invoice.invoiceId,
                  amount: invoice.totalInvoice
                })}</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("cancellationReason")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={reason}
                    onChange={handleReasonChange}
                    placeholder={t("cancellationReasonPlaceholder")}
                    autoFocus
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isConfirming === invoiceId}
              className={`px-4 py-2 text-xs text-white hover:text-white flex items-center ${isConfirming === invoiceId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <X size={16} className="mr-1" />
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isConfirming === invoiceId || (type === 'delete' && !reason.trim())}
              className={`text-white text-xs px-4 py-2 rounded-lg flex items-center ${type === 'confirm'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
                } ${isConfirming === invoiceId || (type === 'delete' && !reason.trim()) ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {type === 'confirm' ? (
                <Check size={16} className="mr-1" />
              ) : (
                <Trash2 size={16} className="mr-1" />
              )}
              {isConfirming === invoiceId
                ? t("processing")
                : type === 'confirm'
                  ? t("confirm")
                  : t("delete")
              }
            </button>
          </div>
        </div>
      </div>
    );
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
          <div className={`mb-6 rounded-md p-4 text-sm ${message.includes('sucesso')
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
            }`}>
            {message}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.boleto")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.propertyId")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.dueDate")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.total")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.rentValue")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.rentValueFee")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.condoFee")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.propertyTax")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.tokensToBuy")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.tokensToBuyFee")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.maintenance")}
                      </th>
                      {isAdminView && (
                        <>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("tableHeaders.penalty")}
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("tableHeaders.interest")}
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("tableHeaders.paymentDate")}
                          </th>
                          <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("tableHeaders.confirmPaymentOrReason")}
                          </th>
                        </>
                      )}
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.status")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableHeaders.details")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedInvoices.map((invoice) => (
                      <React.Fragment key={invoice.invoiceId}>
                        <tr className={visibleInvoiceId === invoice.invoiceId ? "bg-blue-50" : "hover:bg-gray-50"}>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.invoiceId}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.propertyId}
                          </td>
                          <td className={`px-3 py-4 whitespace-nowrap text-sm ${(() => {
                            if (invoice.status === 3 || invoice.status === 1) return 'text-gray-900';

                            const today = new Date();
                            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                            const dueDate = new Date(invoice.dueDateNumber * 1000);
                            const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

                            return dueDateOnly < todayDateOnly ? 'text-red-900' : 'text-gray-900';
                          })()
                            }`}>
                            {invoice.dueDate}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                            {formatValue(invoice.totalInvoice, parseFloat(invoice.totalInvoice.replace('R$', '').replace('.', '').replace(',', '.')))}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatValue(invoice.currentRentAsOwnerValue, invoice.currentRentAsOwnerValueNumber)}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatValue(invoice.rentValueFee, invoice.rentValueFeeNumber)}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatValue(invoice.condoFee, invoice.condoFeeNumber)}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatValue(invoice.propertyTaxCurrency, invoice.propertyTax)}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatValue(invoice.tokensToBuyCurrency, invoice.tokensToBuy)}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatValue(invoice.tokensToBuyFee, invoice.tokensToBuyFeeNumber)}
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatValue(invoice.maintenanceAsOwnerValue, invoice.maintenanceAsOwnerNumber)}
                          </td>
                          {isAdminView && (
                            <>
                              <td className="px-1 py-4 whitespace-nowrap text-sm text-center">
                                {invoice.status === 3 || invoice.status === 1 ? (
                                  // Status pago ou cancelado: mostrar valor se existir
                                  !isZeroValue(invoice.penaltyCurrency) && (
                                    <p className="text-sm">{invoice.penaltyCurrency}</p>
                                  )
                                ) : isOverdue(invoice) ? (
                                  // Status diferente e em atraso: campo de texto editável
                                  <input
                                    type="text"
                                    value={penaltyValues[invoice.invoiceId] || ''}
                                    onChange={(e) => handlePenaltyChange(invoice.invoiceId, e.target.value)}
                                    placeholder="0,00"
                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                ) : (
                                  // Outros casos: mostrar valor existente se houver
                                  !isZeroValue(invoice.penaltyCurrency) && (
                                    <p className="text-sm">{invoice.penaltyCurrency}</p>
                                  )
                                )}
                              </td>
                              <td className="px-1 py-4 whitespace-nowrap text-sm text-center">
                                {invoice.status === 3 || invoice.status === 1 ? (
                                  // Status pago ou cancelado: mostrar valor se existir
                                  !isZeroValue(invoice.interestCurrency) && (
                                    <p className="text-sm">{invoice.interestCurrency}</p>
                                  )
                                ) : isOverdue(invoice) ? (
                                  // Status diferente e em atraso: campo de texto editável
                                  <input
                                    type="text"
                                    value={interestValues[invoice.invoiceId] || ''}
                                    onChange={(e) => handleInterestChange(invoice.invoiceId, e.target.value)}
                                    placeholder="0,00"
                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                ) : (
                                  // Outros casos: mostrar valor existente se houver
                                  !isZeroValue(invoice.interestCurrency) && (
                                    <p className="text-sm">{invoice.interestCurrency}</p>
                                  )
                                )}
                              </td>
                              <td className="px-1 py-4 whitespace-nowrap text-sm text-center">
                                {invoice.status === 3 || invoice.status === 1 ? (
                                  <span className="text-green-600">{invoice.paymentDate}</span>
                                ) : invoice.status === 1 ? (
                                  <span className="text-gray-500">-</span>
                                ) : showCalendar === invoice.invoiceId ? (
                                  <div className="relative flex items-center justify-center date-picker-container">
                                    <CustomDatePicker
                                      selectedDate={paymentDates[invoice.invoiceId]}
                                      onChange={(date) => handleCalendarChange(invoice.invoiceId, date)}
                                      placeholder="dd/mm/yyyy"
                                      className="w-32"
                                    />
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setShowCalendar(invoice.invoiceId)}
                                    className="w-32 px-3 py-1.5 text-gray-700 bg-white hover:bg-gray-50 font-normal rounded border border-gray-300 transition-colors text-sm"
                                  >
                                    {paymentDates[invoice.invoiceId] 
                                      ? formatDateToBrazilian(paymentDates[invoice.invoiceId])
                                      : "Selecionar data"}
                                  </button>
                                )}
                              </td>
                              <td className="px-1 py-4 whitespace-nowrap text-sm text-center">

                                {invoice.status === 1 ? (
                                  <div className="text-red-600 text-xs max-w-xs mx-auto">

                                  </div>
                                ) : invoice.status === 0 ? (
                                  <div className="flex justify-center space-x-2">

                                  {invoice.statusBD === 0 && invoice.invoiceType !== 2 && (
                                      <button
                                      onClick={async () => {
                                        // Invalidate cache before navigation
                                        APICache.invalidate('getInvoice');
                                        router.push(`/connected/invoiceUpload/${invoice.invoiceId}`);
                                        router.refresh(); // Force refresh when returning from upload
                                      }}
                                        className="px-3 py-1 rounded text-xs text-white bg-gray-600 hover:bg-gray-700 flex items-center"
                                      >                                      
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v6a1 1 0 001 1h6" />
                                        </svg>
                                      </button>
                                    )}
                                    
                                    {invoice.statusBD === 2 && (
                                      <button
                                        onClick={() => window.open(`${invoice.path}`, '_blank', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no')}
                                        className="px-3 py-1 rounded text-xs text-white bg-green-600 hover:bg-green-700 flex items-center"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
                                        </svg>
                                      </button>
                                    )}

                                    <button
                                      onClick={(e) => openDialog('confirm', invoice.invoiceId, invoice.propertyId, e)}
                                      disabled={isConfirming === invoice.invoiceId || !paymentDates[invoice.invoiceId] || !isValidDateFormat(formatDateToBrazilian(paymentDates[invoice.invoiceId])) || !isValidPenaltyInterest(invoice.invoiceId)}
                                      className={`px-3 py-1 rounded text-xs text-white flex items-center ${isConfirming === invoice.invoiceId || !paymentDates[invoice.invoiceId] || !isValidDateFormat(formatDateToBrazilian(paymentDates[invoice.invoiceId])) || !isValidPenaltyInterest(invoice.invoiceId)
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                      <Check size={16} className="mr-1" />

                                    </button>
                                    <button
                                      onClick={() => openDialog('delete', invoice.invoiceId, invoice.propertyId)}
                                      disabled={isConfirming === invoice.invoiceId}
                                      className={`px-3 py-1 rounded text-xs text-white flex items-center ${isConfirming === invoice.invoiceId
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                    >
                                      <Trash2 size={16} className="mr-1" />

                                    </button>
                                  </div>
                                ) : invoice.status === 3 ? null : (
                                  <div className="flex justify-center space-x-2">
                                    <button
                                      onClick={(e) => openDialog('confirm', invoice.invoiceId, invoice.propertyId, e)}
                                      disabled={isConfirming === invoice.invoiceId || !paymentDates[invoice.invoiceId] || !isValidDateFormat(formatDateToBrazilian(paymentDates[invoice.invoiceId])) || !isValidPenaltyInterest(invoice.invoiceId)}
                                      className={`px-3 py-1 rounded text-xs text-white flex items-center ${isConfirming === invoice.invoiceId || !paymentDates[invoice.invoiceId] || !isValidDateFormat(formatDateToBrazilian(paymentDates[invoice.invoiceId])) || !isValidPenaltyInterest(invoice.invoiceId)
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                      <Check size={16} className="mr-1" />

                                    </button>
                                    <button
                                      onClick={() => openDialog('delete', invoice.invoiceId, invoice.propertyId)}
                                      disabled={isConfirming === invoice.invoiceId}
                                      className={`px-3 py-1 rounded text-xs text-white flex items-center ${isConfirming === invoice.invoiceId
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                    >
                                      <Trash2 size={16} className="mr-1" />

                                    </button>
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                          <td className="px-1 py-4 whitespace-nowrap text-center">
                            {renderStatus(invoice)} 
                          </td>
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-center">
                            <button
                              className="button-line-transparent text-xs px-2 py-1 flex items-center mx-auto"
                              onClick={() => toggleInvoiceDetails(invoice.invoiceId)}
                            >
                              <svg
                                className={`ml-1 h-4 w-4 transition-transform ${visibleInvoiceId === invoice.invoiceId ? 'transform rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        {visibleInvoiceId === invoice.invoiceId && (
                          <tr>
                            <td colSpan={isAdminView ? 7 : 5} className="px-3 py-4 bg-gray-50">
                              <InvoiceItem
                                invoice={invoice}
                                property={invoice.propertyId}
                                maintenanceList={maintenanceMap[invoice.invoiceId] || []}
                                isAdminView={isAdminView}
                                onConfirmPayment={isAdminView ? () => handleConfirmPayment(invoice.invoiceId, invoice.propertyId) : undefined}
                                isConfirming={isConfirming === invoice.invoiceId}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {!isLoading && displayedInvoices.length === 0 && (
                      <tr>
                        <td colSpan={isAdminView ? 13 : 11} className="px-3 py-16 text-center text-sm text-gray-500">
                          {t("noInvoicesFound")}
                        </td>
                      </tr>
                    )}
                    {/* Add empty rows to maintain minimum height when few records */}
                    {displayedInvoices.length > 0 && displayedInvoices.length < 6 && (
                      Array(6 - displayedInvoices.length).fill(0).map((_, index) => (
                        <tr key={`empty-${index}`}>
                          <td colSpan={isAdminView ? 10 : 11} className="h-24"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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

        {/* Confirmation Dialog */}
        <ConfirmationDialog />
      </main>
    </div>
  );
}
