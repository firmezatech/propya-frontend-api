'use client';

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { getDistributionAndRePurchasedTokensList, DistributionRentAndTokensType } from "../../../../services/web3-api";
import { InfoTooltip } from "../../components/ui";

interface Props {
  profile: number | null;
  propertyId: number;
  onExportDataUpdate?: (data: any[]) => void;
}

const formatCurrencyValue = (value: string | null | undefined, isDiscount: boolean = false) => {
  if (!value) {
    return '-';
  }

  const numberString = value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
  const numericValue = parseFloat(numberString);

  let displayValue = value;
  let isZero = false;

  if (!isNaN(numericValue) && numericValue === 0) {
    displayValue = '-';
    isZero = true;
  }

  if (isDiscount && !isZero) {
    return `- ${displayValue}`;
  }

  return displayValue;
};

const parseCurrencyToNumber = (value: string | null | undefined): number => {
  if (!value) return 0;
  const numberString = value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
  const numericValue = parseFloat(numberString);
  return isNaN(numericValue) ? 0 : numericValue;
};

const formatNumberToCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const calculateTotalValue = (item: DistributionRentAndTokensType, profile: number | null): string => {
  // Para profile === 4, soma apenas amount (co-participação) + tokensRepurchasedCurrency (tokens recomprados)
  if (profile === 4) {
    const amountValue = parseCurrencyToNumber(item.amount);
    const tokensRepurchasedValue = parseCurrencyToNumber(item.tokensRepurchasedCurrency);
    const total = amountValue + tokensRepurchasedValue;
    return formatNumberToCurrency(total);
  }
  
  // Para outros profiles, soma todas as colunas mas subtrai taxa de administração e manutenção
  const amountValue = parseCurrencyToNumber(item.amount);
  const tokensRepurchasedValue = parseCurrencyToNumber(item.tokensRepurchasedCurrency);
  const feeValue = parseCurrencyToNumber(item.fee);
  const maintenanceValue = parseCurrencyToNumber(item.maintenanceDiscount);
  
  const total = amountValue + tokensRepurchasedValue - feeValue - maintenanceValue;
  return formatNumberToCurrency(total);
};

const formatWalletAddress = (address: string) => {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const RentDistributionList: React.FC<Props> = ({ profile, propertyId, onExportDataUpdate }) => {
  {/*Investor and Seller*/}
  const t = useTranslations("RentDistributionAndRepurchasedTokensList");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<DistributionRentAndTokensType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<DistributionRentAndTokensType[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const loadMoreItems = async () => {
    setIsLoadingMore(true);

    // Simular um pequeno delay para UX (opcional)
    setTimeout(() => {
      setDisplayedItems(transactionDetails);
      setIsLoadingMore(false);
    }, 300);
  };

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet && !wallet) {
      setWallet(storedWallet);
    }

    const fetchData = async () => {
      try {
        let eventDetails: DistributionRentAndTokensType[] = [];
        if (profile != 0) {
          // Para usuários não-admin, sempre envia a wallet
          eventDetails = await getDistributionAndRePurchasedTokensList(propertyId, wallet || "") || [];
        } else {
          // Para admin (profile = 0), nunca envia wallet - busca todos os registros
          eventDetails = await getDistributionAndRePurchasedTokensList(propertyId) || [];
        }

        if (!eventDetails || eventDetails.length === 0) {
          setMessage(common('dataNotAvailable'));
          setTransactionDetails([]);
          setDisplayedItems([]);
        } else {
          let filteredDetails: DistributionRentAndTokensType[] = [];

          // Primeiro filtro: excluir itens com type igual a INVESTMENTS
          const filteredByType = eventDetails.filter(item =>
            item.type !== "INVESTMENT"
          );

          let walletFiltered = filteredByType;
          if (profile != 0) {
            walletFiltered = filteredByType.filter(item =>
              item.investor.toLowerCase() === wallet?.toLowerCase()
            );
          }

          // Não precisamos mais filtrar por propertyId aqui pois já estamos passando na chamada da API
          filteredDetails = walletFiltered;

          if (filteredDetails.length === 0) {
            setMessage(common('dataNotAvailable'));
            setTransactionDetails([]);
            setDisplayedItems([]);
          } else {
            setTransactionDetails(filteredDetails);

            // Mostrar apenas os primeiros 8 itens inicialmente
            const itemsToDisplay = filteredDetails.slice(0, itemsToShow);
            setDisplayedItems(itemsToDisplay);
            setMessage(null);
          }
        }
      } catch (err) {
        console.error(common('errorLoadingData'), err);
        setMessage(common('errorLoadingData'));
      }
    };

    if (wallet) {
      fetchData();
    }

  }, [wallet, profile, t, itemsToShow, propertyId]);

  const hasMoreItems = transactionDetails.length > displayedItems.length;

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        {message ? (
          <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
            {message}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-1/2 divide-y divide-gray-200">
                <thead className="bg-gray-50 px-6">
                  <tr className="border-b border-gray-300">
                    {profile === 0 && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">wallet</th>
                    )}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('time')}</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('totalValue')}</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('valueCoOwner.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('valueCoOwner.line2')}&nbsp;
                          <InfoTooltip content={t('valueCoOwnerInfo')} />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('repurchasedTokens.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('repurchasedTokens.line2')}&nbsp;
                          <InfoTooltip content={t('repurchasedTokensInfo')} />
                        </div>
                      </div>
                    </th>
                    {profile !== 4 && (
                      <>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('fee.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('fee.line2')}&nbsp;
                          <InfoTooltip content={t('feeInfo')} />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end">
                        {t('maintenance')}&nbsp;
                        <InfoTooltip content={t('maintenanceInfo')} />
                      </div>
                    </th>  
                    </>
                    )}                                     
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('dateReceive.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('dateReceive.line2')}&nbsp;
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-gray-50">
                        {profile === 0 && (
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {item.profileDescription} {formatWalletAddress(item.investor)}</td>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.dateExpected}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right font-bold">
                          {calculateTotalValue(item, profile)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrencyValue(item.amount)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrencyValue(item.tokensRepurchasedCurrency)}
                        </td>
                        {profile !== 4 && (
                          <>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrencyValue(item.fee, true)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrencyValue(item.maintenanceDiscount, true)}
                        </td>
                        </>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.date}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                          {/* <p className="text-green-600">
                            <span className="text-green-600 bg-green-100 px-5 py-1 rounded-lg font-medium">{t("statusReceived")}</span>
                          </p> */}
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
}

export default RentDistributionList;
