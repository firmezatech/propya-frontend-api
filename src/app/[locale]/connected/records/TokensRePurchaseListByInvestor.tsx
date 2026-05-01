"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

import { getDistributionAndRePurchasedTokensList, DistributionRentAndTokensType, getStatusProfile } from "../../../../services/web3-api";
import { InfoTooltip } from "../../components/ui";

interface Props {
  profile: number | null;
  propertyId: number;
  onExportDataUpdate?: (data: any[]) => void;
}

const formatDisplayValue = (value: string | null | undefined) => {
  // Debug: Verificar o valor recebido
  console.log("🔍 formatDisplayValue recebeu:", value, "tipo:", typeof value);
  
  if (!value || value.trim() === '') {
      console.log("🔍 Valor vazio ou nulo, retornando '-'");
      return '-';
  }
  
  // Para valores monetários, verificar se é zero
  if (value.includes('R$')) {
    const numberString = value
        .replace('R$', '')
        .trim()
        .replace(/\./g, '')
        .replace(',', '.');
    const numericValue = parseFloat(numberString);
    if (!isNaN(numericValue) && numericValue === 0) {
        console.log("🔍 Valor monetário é zero, retornando '-'");
        return '-';
    }
  }
  
  // Para valores numéricos simples, verificar se é zero
  if (!isNaN(Number(value)) && Number(value) === 0) {
      console.log("🔍 Valor numérico é zero, retornando '-'");
      return '-';
  }
  
  console.log("🔍 Valor válido, retornando:", value);
  return value;
};

const TokensRePurchaseListByInvestor: React.FC<Props> = ({ profile, propertyId, onExportDataUpdate }) => {

  const router = useRouter();
  const t = useTranslations("TokensRePurchaseListByInvestor");
  const tprofile = useTranslations("Profile");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<DistributionRentAndTokensType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<DistributionRentAndTokensType[]>([]);
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
      setDisplayedItems(transactionDetails);
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
      console.log("🔍 Chamando API com propertyId:", propertyId, "wallet:", wallet);
      const eventDetails = await getDistributionAndRePurchasedTokensList(propertyId, wallet);
      console.log("🔍 Resposta da API:", eventDetails);

      const safeData = eventDetails || [];

      // Since we're now filtering by propertyId at the API level, we don't need to filter again
      const sortedData = [...safeData].sort((a, b) =>
        Number(b.dateNumber) - Number(a.dateNumber)
      );

      setTransactionDetails(sortedData);
      
      // Debug: Verificar os dados recebidos
      console.log("🔍 Dados recebidos da API:", sortedData);
      if (sortedData.length > 0) {
        console.log("🔍 Primeiro item:", sortedData[0]);
        console.log("🔍 Campos do primeiro item:", Object.keys(sortedData[0]));
      }
      
      // Mostrar apenas os primeiros 8 itens inicialmente
      const itemsToDisplay = sortedData.slice(0, itemsToShow);
      setDisplayedItems(itemsToDisplay);
      
      // Preparar dados para exportação
      if (onExportDataUpdate) {
        const exportData = sortedData.map(item => ({
          "Data": item.date,
          "Tokens Comprados": item.tokensInvestedFormatted,
          "Tokens Recomprados": item.tokensRepurchasedNumber,
          "Perfil": getStatusProfile(item.profile, tprofile),
          "Valor Transação": item.tokensRepurchasedCurrency,
          "Tokens Restantes": item.tokensRemaining,
          "Percentual Atual": item.currentParticipation
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

  const hasMoreItems = transactionDetails.length > displayedItems.length;

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">

        {message && (
          <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
            {message}
          </div>
        )}

        {displayedItems.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-1/2 divide-y divide-gray-200">
                <thead className="bg-gray-50 px-6">
                  <tr className="border-b border-gray-300">
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('date.line1')}</div>
                        <div>{t('date.line2')}</div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('tokensPurchased.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('tokensPurchased.line2')}&nbsp;
                          <InfoTooltip content={t('tokensPurchasedInfo')} />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">
                          {t('tokensRepurchased.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('tokensRepurchased.line2')}&nbsp;
                          <InfoTooltip content={t('tokensRepurchasedInfo')} />
                        </div>
                      </div>
                    </th>
                    {profile !== 4 && (
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('profile.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('profile.line2')}&nbsp;
                          <InfoTooltip content={t('profileInfo')} />
                        </div>
                      </div>
                    </th>
                    )}
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('transactionValue.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('transactionValue.line2')}&nbsp;
                          <InfoTooltip content={t('transactionValueInfo')} />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('remainingTokens.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('remainingTokens.line2')}&nbsp;
                          <InfoTooltip content={t('remainingTokensInfo')} />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('currentPercent.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('currentPercent.line2')}&nbsp;
                          <InfoTooltip content={t('currentPercentInfo')} />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-left">{item.date}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatDisplayValue(item.tokensInvestedFormatted)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatDisplayValue(item.tokensRepurchasedNumber)}</td>
                        {profile !== 4 && (
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{getStatusProfile(item.profile, tprofile)}</td>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatDisplayValue(item.tokensRepurchasedCurrency)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatDisplayValue(item.tokensRemaining)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.currentParticipation}</td>
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
        ) : (
          <p className="text-gray-500 p-4 border rounded">{common('dataNotAvailable')}</p>
        )}

      </main>
    </div>
  );
}
export default TokensRePurchaseListByInvestor;
