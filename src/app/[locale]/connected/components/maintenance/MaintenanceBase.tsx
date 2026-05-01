"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import MaintenanceItem from "./MaintenanceItem";
import { Trash2, X } from 'lucide-react';

import {
  getMaintenanceList,
  MaintenanceData,
  cancelMaintenance
} from "../../../../../services/web3-api";

export interface MaintenanceBaseContext {
  wallet: string | null;
  message: string | null;
  maintenanceMap: Record<number, MaintenanceData[]>;
  selectedInvoiceId: number | null;
  propertyId: number;
  maintenanceTotal: string;
  setMessage: (msg: string | null) => void;
  fetchMaintenances: () => Promise<void>;
  setSelectedInvoiceId: (invoiceId: number) => void;
  handleBackNavigation: () => void;
}

interface MaintenanceBaseProps {
  children?: React.ReactNode | ((context: MaintenanceBaseContext) => React.ReactNode);
  isAdminView?: boolean;
}

export default function MaintenanceBase({ 
  children, 
  isAdminView = false,
}: MaintenanceBaseProps) {
  const router = useRouter();
  const t = useTranslations("MaintenanceBase");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [maintenanceMap, setMaintenanceMap] = useState<Record<number, MaintenanceData[]>>({});
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [maintenanceTotal, setMaintenanceTotal] = useState<string>("");
  const [propertyId, setPropertyId] = useState<number>(1);
  const [displayedMaintenances, setDisplayedMaintenances] = useState<MaintenanceData[]>([]);
  const [itemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [dialogState, setDialogState] = useState<{
    maintenanceId: number | null;
    reason: string;
  }>({
    maintenanceId: null,
    reason: ''
  });

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

  const fetchMaintenances = async () => {
    if (!wallet) {
      setMessage(common("login"));
      return;
    }

    setIsLoading(true);
    setMessage(common("loading"));

    try {
      const data = await getMaintenanceList(propertyId);
      const safeData = data || [];

      // Agrupar por invoiceId, incluindo 0
      const grouped: Record<number, MaintenanceData[]> = {};
      safeData.forEach((item) => {
        const invoiceId = Number(item.invoiceId);
        if (!grouped[invoiceId]) grouped[invoiceId] = [];
        grouped[invoiceId].push(item);
      });

      setMaintenanceMap(grouped);

      // Ordenar: 0 primeiro, depois os demais em ordem decrescente
      const allMaintenances = safeData.sort((a, b) => Number(b.maintenanceId) - Number(a.maintenanceId));
      const initialItems = allMaintenances.slice(0, itemsToShow);
      setDisplayedMaintenances(initialItems);

      setMessage(null);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setMessage(common("errorLoadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (wallet) {
      fetchMaintenances();
    }
  }, [wallet, propertyId]);

  const loadMoreItems = async () => {
    setIsLoadingMore(true);

    setTimeout(() => {
      const allMaintenances = Object.values(maintenanceMap).flat()
        .sort((a, b) => Number(b.maintenanceId) - Number(a.maintenanceId));
      setDisplayedMaintenances(allMaintenances);
      setIsLoadingMore(false);
    }, 300);
  };

  const handleBackNavigation = () => {
    router.back();
  };

  // Create context for children
  const contextValue: MaintenanceBaseContext = {
    wallet,
    message,
    maintenanceMap,
    selectedInvoiceId,
    propertyId,
    maintenanceTotal,
    setMessage,
    fetchMaintenances,
    setSelectedInvoiceId,
    handleBackNavigation
  };

  // Determine what to render as children
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(contextValue);
    }
    return children;
  };

  const allMaintenances = Object.values(maintenanceMap).flat()
    .sort((a, b) => Number(b.maintenanceId) - Number(a.maintenanceId));
  const hasMoreItems = allMaintenances.length > displayedMaintenances.length;

  const toggleMaintenanceDetails = (maintenanceId: number) => {
    setSelectedMaintenanceId(prev => prev === maintenanceId ? null : maintenanceId);
  };

  const openDeleteDialog = (maintenanceId: number, e?: React.MouseEvent) => {
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
      maintenanceId,
      reason: ''
    });
  };

  const closeDialog = useCallback(() => {
    setDialogState({
      maintenanceId: null,
      reason: ''
    });
  }, []);

  const handleDeleteMaintenance = async (maintenanceId: number, reason: string) => {
    if (!reason.trim()) {
      setMessage(t("cancellationReasonRequired"));
      return;
    }

    setIsDeleting(maintenanceId);
    setMessage(null);

    try {
      //const today = new Date();
      //const timestamp = Math.floor(today.getTime() / 1000);

      const response = await cancelMaintenance(
        propertyId.toString(),
        maintenanceId.toString(),
        reason.trim()
      );

      if (response.success) {
        setMessage(t("maintenanceCancelledSuccess"));
        await fetchMaintenances();
        closeDialog();
      } else {
        throw new Error(response.message || t("errorCancellingMaintenance"));
      }
    } catch (error) {
      console.error("Erro ao cancelar manutenção:", error);
      const errorMessage = error instanceof Error ? error.message : t("errorCancellingMaintenance");
      setMessage(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const ConfirmationDialog = () => {
    const { maintenanceId, reason } = dialogState;
    if (!maintenanceId) return null;

    const maintenance = displayedMaintenances.find(m => m.maintenanceId === maintenanceId);
    if (!maintenance) return null;

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

      await handleDeleteMaintenance(maintenanceId, reason);
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
            {t("confirmDeleteTitle")}
          </div>
          <div className="mb-6 text-gray-600">
            <p className="mb-4">{t("confirmDeleteMessage", {
              maintenanceId: maintenance.maintenanceId,
              value: maintenance.priceResolution
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
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isDeleting === maintenanceId}
              className={`px-4 py-2 text-xs text-white hover:text-white flex items-center ${isDeleting === maintenanceId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <X size={16} className="mr-1" />
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isDeleting === maintenanceId || !reason.trim()}
              className={`bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg flex items-center ${isDeleting === maintenanceId || !reason.trim() ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              <Trash2 size={16} className="mr-1" />
              {isDeleting === maintenanceId ? t("processing") : t("delete")}
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
          {isAdminView && renderChildren()}
        </div>

        {message && (
          <div className={`mb-6 rounded-md p-4 text-sm ${
            message.includes('sucesso') 
              ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("number")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("problem")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("resolution")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("date")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("value")}
                  </th>
                  {!isAdminView && (
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("valueCoOwner")}
                    </th>
                  )}
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("invoice")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!isLoading && displayedMaintenances.map((maintenance) => (
                  <React.Fragment key={maintenance.maintenanceId}>
                    <tr className={selectedMaintenanceId === maintenance.maintenanceId ? "bg-blue-50" : "hover:bg-gray-50"}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {maintenance.maintenanceId}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {maintenance.descriptionItem}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 max-w-xs break-words">
                        {maintenance.resolutionItem}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {maintenance.dateCreated}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {maintenance.priceResolution}
                      </td>
                      {!isAdminView && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {maintenance.maintenanceAsOwner}
                        </td>
                      )}
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        {maintenance.cancelled ? (
                          <span className="text-gray-600 bg-gray-100 px-5 py-1 rounded-lg font-medium">
                            {t("cancelled")}
                          </span>
                        ) : maintenance.invoiceId > 0 ? (
                          <span className="text-blue-600 bg-blue-100 px-5 py-1 rounded-lg font-medium">
                            {t("processed")}
                          </span>
                        ) : (
                          <span className="text-yellow-600 bg-yellow-100 px-5 py-1 rounded-lg font-medium">
                            {t("waiting")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {maintenance.invoiceId > 0 ? `#${maintenance.invoiceId}` : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            className="button-line-transparent text-xs px-2 py-1 flex items-center mx-auto"
                            onClick={() => toggleMaintenanceDetails(maintenance.maintenanceId)}
                          >
                            <svg
                              className={`ml-1 h-4 w-4 transition-transform ${selectedMaintenanceId === maintenance.maintenanceId ? 'transform rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                        </div>
                      </td>
                      {isAdminView && maintenance.invoiceId === 0 && !maintenance.cancelled && (
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openDeleteDialog(maintenance.maintenanceId)}
                            disabled={isDeleting === maintenance.maintenanceId}
                            className={`px-3 py-1 rounded text-xs text-white flex items-center ${
                              isDeleting === maintenance.maintenanceId
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            <Trash2 size={16} className="mr-1" />
                          </button>
                        </td>
                      )}
                    </tr>
                    {selectedMaintenanceId === maintenance.maintenanceId && (
                      <tr>
                        <td colSpan={8} className="px-3 py-4 bg-gray-50">
                          <MaintenanceItem 
                            maintenanceList={[maintenance]}
                            maintenanceTotal={maintenanceTotal} 
                            isAdminView={isAdminView}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {!isLoading && displayedMaintenances.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
                      {t("noMaintenancesFound")}
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
                    {t("viewMore")} ({allMaintenances.length - displayedMaintenances.length} {t("remaining")})
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
            {t("showing")} {displayedMaintenances.length} {t("of")} {allMaintenances.length} {t("records")}
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog />
      </main>
    </div>
  );
}