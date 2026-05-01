"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getTokensRePurchasedList, TokensRePurchasedType } from "../../../../services/web3-api";

interface Props {
  profile: number | null;
  propertyId: number;
  onExportDataUpdate?: (data: any[]) => void;
}

const TokensRePurchaseList: React.FC<Props> = ({ profile, propertyId, onExportDataUpdate }) => {

  const router = useRouter();
  const t = useTranslations("TokensRePurchaseList");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [purchasesList, setPurchasesList] = useState<TokensRePurchasedType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<TokensRePurchasedType[]>([]);
  const [itemsToShow, setItemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
  }, []);

  const loadMoreItems = async () => {
    setIsLoadingMore(true);
    
    // Simular um pequeno delay para UX (opcional)
    setTimeout(() => {
      setDisplayedItems(purchasesList);
      setIsLoadingMore(false);
    }, 300);
  };

  const fetchPurchases = async () => {
    if (!wallet) {
      setMessage(common('pleaseLogin'));
      return;
    }

    setMessage(common('loading'));

    try {
      const data = await getTokensRePurchasedList();
      const safeData = data || [];

      const filteredData = safeData.filter(item => item.propertyId === propertyId);

      const sortedData = [...filteredData].sort((a, b) =>
        Number(b.dateNumber) - Number(a.dateNumber)
      );

      setPurchasesList(sortedData);
      
      // Mostrar apenas os primeiros 8 itens inicialmente
      const itemsToDisplay = sortedData.slice(0, itemsToShow);
      setDisplayedItems(itemsToDisplay);
      
      // Preparar dados para exportação
      if (onExportDataUpdate) {
        const exportData = sortedData.map(item => ({
          "Data": item.date,
          "Vendedor": item.seller,
          "Tokens Recomprados": item.tokensPurchased,
          "Valor": "N/A", // Campo não disponível na API
          "Status": "Concluído"
        }));
        onExportDataUpdate(exportData);
      }
      
      setMessage(null);
    } catch (err) {
      console.error(common('errorLoadingData'), err);
      setMessage(common('errorLoadingData'));
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [wallet, propertyId, itemsToShow]);

  const handleBackNavigation = () => {
    router.back();
  };

  const hasMoreItems = purchasesList.length > displayedItems.length;

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">

        {(Number(profile) == 2) ? (
          <>
            <button onClick={handleBackNavigation} className="text-gray-400 button-line-transparent border border-white ml-2 text-sm py-1">
              <ArrowLeft size={28} />
            </button>
            <h1 className="text-2xl font-semibold mb-2">{t('titles.coOwnersToTenant')}</h1>
          </>
        ) : ""}

        {message && (
          <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
            {message}
          </div>
        )}

        {displayedItems.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-1/2 divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('tableHeaders.date')}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('tableHeaders.tokens')}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('tableHeaders.wallet')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr key={`${item.dateNumber}-${index}`} className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.date}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.tokensPurchased || "N/A"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.seller || "0"}
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
          <p className="text-gray-500 p-4 border rounded">{common('dataNotAvailable')}</p>
        )}

      </main>
    </div>
  );
}
export default TokensRePurchaseList;
