'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

import { getInvestorJoinedList, InvestorJoinedType } from "../../../../services/web3-api";

export default function TokensPurchaseInvestorList({ propertyId, onExportDataUpdate }: { propertyId: number; onExportDataUpdate?: (data: any[]) => void }) {
  const router = useRouter();
  const t = useTranslations("TokensPurchaseInvestorList");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<InvestorJoinedType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<InvestorJoinedType[]>([]);
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
    if (!wallet) {
      setMessage(common('pleaseLogin'));
      setIsInitialLoading(false);
      return;
    }
    setMessage(common('loading'));

    const fetchData = async () => {
      try {
        const eventDetails = await getInvestorJoinedList();

        const filteredList = eventDetails?.filter(item => item.propertyId === propertyId);

        if (!filteredList || filteredList.length === 0) {
          setMessage(common('dataNotAvailable'));
          setTransactionDetails([]);
          setDisplayedItems([]);
        } else {
          setTransactionDetails(filteredList);
          
          // Mostrar apenas os primeiros 8 itens inicialmente
          const itemsToDisplay = filteredList.slice(0, itemsToShow);
          setDisplayedItems(itemsToDisplay);
          
          
          setMessage(null);
        }
      } catch (err) {
        console.error(common('errorLoadingData'), err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (wallet) {
      fetchData();
    }
  }, [wallet, t, itemsToShow, propertyId]);

  const hasMoreItems = transactionDetails.length > displayedItems.length;

  return (
    <div className="container mx-auto">

      <p className="text-gray-600 mb-4"></p>
      <div className="overflow-x-auto">
        {message && (
          <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
            {message}
          </div>
        )}
        
        {!isInitialLoading && !message && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.date')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.wallet')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.tokensQuantity')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item, index) => (
                    <tr key={index} className={index === displayedItems.length - 1 ? 'bg-gray-100' : ''}>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.investor.slice(0, 15) + "..." + item.investor.slice(-4)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.tokensInvested}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.capitalValue}</td>
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
      </div>
    </div>
  );
}
