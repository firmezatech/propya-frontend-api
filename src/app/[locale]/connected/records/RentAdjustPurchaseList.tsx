'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { getRentAdjustPurchaseList, RentAdjustmentType } from "../../../../services/web3-api";

const RentAdjustPurchaseList = ({ propertyId }: { propertyId: number }) => {
  const router = useRouter();
  const t = useTranslations("RentAdjustment");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<RentAdjustmentType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<RentAdjustmentType[]>([]);
  const [totalRow, setTotalRow] = useState<RentAdjustmentType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

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
        const purchaseList = await getRentAdjustPurchaseList();

        const filteredByProperty = purchaseList?.filter(item => item.propertyId === propertyId) || [];

        const sortedData = [...filteredByProperty].sort((a, b) => {
          const dateA = new Date(a.dateTimestamp).getTime();
          const dateB = new Date(b.dateTimestamp).getTime();
          return dateB - dateA;
        });

        if (sortedData.length > 0) {
          const lastItem = sortedData[0];
          const totalRowData = {
            ...lastItem,
            date: t("totalAccumulated")
          };
          setTotalRow(totalRowData);
        }

        setTransactionDetails(sortedData);
        
        // Mostrar apenas os primeiros 8 itens inicialmente
        const itemsToDisplay = sortedData.slice(0, itemsToShow);
        setDisplayedItems(itemsToDisplay);
        
        setMessage(sortedData.length ? null : common("dataNotAvailable"));
      } catch (err) {
        console.error(common("errorLoadingData"), err);
        setMessage(common("errorLoadingData"));
      }
    };

    fetchData();
  }, [wallet, itemsToShow, propertyId]);

  const hasMoreItems = transactionDetails.length > displayedItems.length;

  return (
    <div className="card overflow-x-auto mb-7">
      {message ? (
        <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
          {message}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 ">
                <tr>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">{t("tableHeaders.date")}</th>
                   <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                     <div>
                       <div>{t('tableHeaders.currentRent.line1')}</div>
                       <div>{t('tableHeaders.currentRent.line2')}</div>
                     </div>
                   </th>              
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                    <div>
                      <div>{t('tableHeaders.tokensPurchased.line1')}</div>
                      <div>{t('tableHeaders.tokensPurchased.line2')}</div>
                    </div>
                  </th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                    <div>
                      <div>{t('tableHeaders.percentAcquired.line1')}</div>
                      <div>{t('tableHeaders.percentAcquired.line2')}</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {totalRow && (
                  <tr className="bg-indigo-50 font-bold text-xl">
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-bold text-gray-500">{totalRow.date}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-bold bg-blue-600 text-white text-center">{totalRow.newRentValue}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-bold text-gray-500 text-right">{totalRow.totalCumulativeFormatted}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-bold text-gray-500 text-right">{totalRow.percentAdjustment}</td>
                  </tr>
                )}
                {displayedItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{item.newRentValue}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.tokensPurchased}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.percentPurchased}</td>
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
  );
};

export default RentAdjustPurchaseList;
