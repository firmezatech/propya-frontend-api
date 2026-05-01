'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { getDistributionAndRePurchasedTokensList, DistributionRentAndTokensType } from "../../../../services/web3-api";
import { InfoTooltip } from "../../components/ui";

const formatDisplayValue = (value: string | null | undefined) => {
  if (!value || value.trim() === '') {
      return '-';
  }
  const numberString = value
      .replace('R$', '')
      .trim()
      .replace(/\./g, '')
      .replace(',', '.');
  const numericValue = parseFloat(numberString);
  if (!isNaN(numericValue) && numericValue === 0) {
      return '-';
  }
  return value;
};

const RentAdjustPurchaseInvestorList = ({ propertyId }: { propertyId: number }) => {
  const router = useRouter();
  const t = useTranslations("RentAdjustmentByInvestor");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<DistributionRentAndTokensType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<DistributionRentAndTokensType[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      setWallet(storedWallet);
    }
  }, []);

  const loadMoreItems = async () => {
    setIsLoadingMore(true);
    
    // Simular um pequeno delay para UX (opcional)
    setTimeout(() => {
      setDisplayedItems(transactionDetails);
      setIsLoadingMore(false);
    }, 300);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const purchaseList = await getDistributionAndRePurchasedTokensList(propertyId, wallet || "");

        // A API já retorna os dados filtrados, então só precisamos ordenar por data
        const sortedData = [...(purchaseList || [])].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });

        setTransactionDetails(sortedData);
        
        // Mostrar apenas os primeiros 8 itens inicialmente
        const itemsToDisplay = sortedData.slice(0, itemsToShow);
        setDisplayedItems(itemsToDisplay);
        
        setMessage(sortedData.length > 0 ? null : common("dataNotAvailable"));
      } catch (err) {
        console.error(common("errorLoadingData"), err);
        setMessage(common("errorLoadingData"));
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchData();
  }, [wallet, itemsToShow, propertyId]);

  const hasMoreItems = transactionDetails.length > displayedItems.length;

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        {message && (
          <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
            {message}
          </div>
        )}
        
        {!isInitialLoading && !message && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-1/2 divide-y divide-gray-200">
              <thead className="bg-gray-50 px-6">
                  <tr className="border-b border-gray-300">
                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("date")}</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('currentRent.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('currentRent.line2')}&nbsp;
                          <InfoTooltip content={t('currentRentInfo')} />
                        </div>
                      </div>
                    </th>              
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('tokensRePurchased.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('tokensRePurchased.line2')}&nbsp;
                          <InfoTooltip content={t('tokensRePurchasedInfo')} />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('currentParticipation.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('currentParticipation.line2')}&nbsp;
                          <InfoTooltip content={t('currentParticipationInfo')} />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('baseRent.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('baseRent.line2')}&nbsp;
                          <InfoTooltip content={t('baseRentInfo')} />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.date} </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right ">{formatDisplayValue(item.amount)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right ">{formatDisplayValue(item.tokensRepurchasedNumber)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right ">{item.currentParticipation}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right ">{formatDisplayValue(item.amountOriginal)}</td>
                    </tr>
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
                      Ver mais ({transactionDetails.length - displayedItems.length} restantes)
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
              Mostrando {displayedItems.length} de {transactionDetails.length} registros
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default RentAdjustPurchaseInvestorList;
