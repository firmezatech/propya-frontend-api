"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from "next-intl";

import { getTokensPurchasedList, TokensPurchasedType } from "../../../../services/web3-api";

import { useInvoiceDetails } from "../components/invoice/UseInvoiceDetail";
import TokensPurchaseBanner from "../TokensPurchaseBanner";

interface Props {
  profile: number | null;
  propertyId: number;  // Keep it as number since that's what the API expects
}

const TokensPurchaseRentList: React.FC<Props> = ({ profile, propertyId }) => {
  const router = useRouter();
  const t = useTranslations("TokensPurchaseRenterList");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [purchasesList, setPurchasesList] = useState<TokensPurchasedType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<TokensPurchasedType[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [totalRow, setTotalRow] = useState<TokensPurchasedType | null>(null);
  const [itemsToShow, setItemsToShow] = useState<number>(8);
  const [showingAll, setShowingAll] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  const {
    invoiceDetail,
    maintenanceList,
    isLoading,
    errorMessage,
    fetchInvoiceData,
    clearInvoiceData
  } = useInvoiceDetails(null, false);


  const handleNavigation = (path: string) => {
    router.push(path);
  };

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

  const fetchPurchases = async (limit?: number) => {
    setMessage(common("loading"));

    if (!propertyId) {
      console.error("PropertyId is required but not provided");
      setMessage(t("errorLoadingPurchases"));
      setIsInitialLoading(false);
      return;
    }

    try {
      const data = await getTokensPurchasedList(Number(propertyId));
      const safeData = data || [];

      // Ordenar por data decrescente
      const sortedData = [...safeData].sort((a, b) =>
        Number(b.dateNumber) - Number(a.dateNumber)
      );

      setPurchasesList(sortedData);

      // Mostrar apenas os itens limitados inicialmente
      const itemsToDisplay = limit ? sortedData.slice(0, limit) : sortedData;
      setDisplayedItems(itemsToDisplay);

      // Calcular o total de tokens e outros valores acumulados
      if (sortedData.length > 0) {
        // Somar todos os valores para obter o total real
        const totalTokens = sortedData.reduce((sum, item) => sum + item.tokenAmount, 0);
        const totalCapitalValue = sortedData.reduce((sum, item) => sum + item.capitalValue, 0);

        // Criar uma linha resumo para o total
        const totalRowData = {
          ...sortedData[0],
          date: t("totalAccumulated"),
          tokenAmount: totalTokens,
          tokenAmountFormat: new Intl.NumberFormat('pt-BR').format(totalTokens),
          capitalValue: totalCapitalValue,
          capitalValueFormat: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(totalCapitalValue),
          // Para o total, usar os valores do último item (mais recente)
          buyerPercentFormat: sortedData[0].buyerPercentFormat,
          missingBuyerCurrency: sortedData[0].missingBuyerCurrency,
        };

        setTotalRow(totalRowData);
      }

      setMessage(null);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setMessage(t("errorLoadingPurchases"));
      setPurchasesList([]);
      setDisplayedItems([]);
      setTotalRow(null);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadMoreItems = async () => {
    setIsLoadingMore(true);
    
    // Simular um pequeno delay para UX (opcional)
    setTimeout(() => {
      setDisplayedItems(purchasesList);
      setShowingAll(true);
      setIsLoadingMore(false);
    }, 300);
  };

  useEffect(() => {
    fetchPurchases(itemsToShow);
  }, [wallet, propertyId]);

  const toggleDropdown = async (invoiceId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (openDropdown === invoiceId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(invoiceId);
      fetchInvoiceData(invoiceId);
    }
  };

  useEffect(() => {
    if (openDropdown === null) {
      clearInvoiceData();
    }
  }, [openDropdown]);

  const handleBackNavigation = () => {
    router.back();
  };



  const hasMoreItems = purchasesList.length > displayedItems.length;

  return (
    <>
        <div className="card overflow-x-auto mb-7">
            
          {(Number(profile) === 2) && (
            <TokensPurchaseBanner profile={profile} propertyId={propertyId} />
          )}
        </div>

    <div className="card overflow-x-auto mb-7">

      {message && (
        <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
          {message}
        </div>
      )}

      {!isInitialLoading && (
        displayedItems.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-1/2 divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("tableHeaders.date")}
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div>{t('tableHeaders.tokensPurchased.line1')}</div>
                        <div>{t('tableHeaders.tokensPurchased.line2')}</div>
                      </div>
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div>{t('tableHeaders.totalInReais.line1')}</div>
                        <div>{t('tableHeaders.totalInReais.line2')}</div>
                      </div>
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div>{t('tableHeaders.percentAcquired.line1')}</div>
                        <div>{t('tableHeaders.percentAcquired.line2')}</div>
                      </div>
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div>{t('tableHeaders.remainingValue.line1')}</div>
                        <div>{t('tableHeaders.remainingValue.line2')}</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {totalRow && (
                    <tr className="bg-indigo-50 font-bold text-sm">
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 font-bold text-left">{totalRow.date}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 font-bold text-right">{totalRow.tokenAmountFormat}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 font-bold text-right">{totalRow.capitalValueFormat}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 font-bold text-right">
                        {totalRow.buyerPercentFormat}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 font-bold text-right">
                        {totalRow.missingBuyerCurrency}
                      </td>
                    </tr>
                  )}

                  {displayedItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-left">
                          {item.date}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.tokenAmountFormat || t("notAvailable")}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.capitalValueFormat || "0"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.buyerPercentFormat}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.missingBuyerCurrency}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
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
                      Ver mais ({purchasesList.length - displayedItems.length} restantes)
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
              Mostrando {displayedItems.length} de {purchasesList.length} registros
            </div>
          </div>
        ) : (
          <p className="text-gray-500 p-4 border rounded text-center">{common("dataNotAvailable")}</p>
        )
      )}

    </div>
    </>
  );
};

export default TokensPurchaseRentList;
