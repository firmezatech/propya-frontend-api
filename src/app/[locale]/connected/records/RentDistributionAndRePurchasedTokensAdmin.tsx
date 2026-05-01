'use client';

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { getDistributionAndRePurchasedTokensList, DistributionRentAndTokensType } from "../../../../services/web3-api";
import { InfoTooltip } from "../../components/ui";

interface Props {
  profile: number | null;
  propertyId: number;
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

const calculateTotalForLegacy = (amount: string, tokensRepurchased: string) => {
  // Para legados: somar coparticipação + tokens recomprados
  const amountString = amount.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
  const tokensString = tokensRepurchased.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
  
  const amountNumeric = parseFloat(amountString);
  const tokensNumeric = parseFloat(tokensString);
  
  if (isNaN(amountNumeric) || isNaN(tokensNumeric)) {
    return amount; // fallback para o valor original
  }
  
  const result = amountNumeric + tokensNumeric;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(result);
};

const calculateTotalWithoutFees = (totalValue: string, fee: string, maintenanceFee: string, isLegacy: boolean) => {
  if (!isLegacy) {
    return totalValue; // Para não-legados, retorna o valor original
  }
  
  // Para legados, não usar esta função - usar calculateTotalForLegacy
  return totalValue;
};

const formatWalletAddress = (address: string) => {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const isLegacyInvestor = (profile: number | null): boolean => {
  return profile !== null && Number(profile) === 4;
};

// Função para buscar perfil de um investidor específico
const getInvestorProfile = async (investorAddress: string, propertyId: number): Promise<number | null> => {
  try {
    const { getInvestorDetail } = await import("../../../../services/web3-api");
    const investorDetail = await getInvestorDetail(propertyId, investorAddress);
    return investorDetail?.profile || null;
  } catch (error) {
    console.warn('⚠️ Erro ao buscar perfil para', investorAddress, error);
    return null;
  }
};

const RentDistributionListAdmin: React.FC<Props> = ({ profile, propertyId }) => {
{/*Admin*/}
  const t = useTranslations("RentDistributionAndRepurchasedTokensList");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<DistributionRentAndTokensType[]>([]);
  const [displayedItems, setDisplayedItems] = useState<DistributionRentAndTokensType[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(false);
  const [investorProfiles, setInvestorProfiles] = useState<Map<string, number | null>>(new Map());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Função para ordenar os dados
  const sortData = (data: DistributionRentAndTokensType[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'dateExpected':
          // Converter datas para comparação
          aValue = new Date(a.dateExpected);
          bValue = new Date(b.dateExpected);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Função para lidar com clique no header
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const loadMoreItems = async () => {
    setIsLoadingMore(true);

    // Simular um pequeno delay para UX (opcional)
    setTimeout(() => {
      const sortedDetails = sortColumn ? sortData(transactionDetails, sortColumn, sortDirection) : transactionDetails;
      setDisplayedItems(sortedDetails);
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
        setIsLoadingProfiles(true);
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

          // Primeiro filtro: excluir itens com type igual a INVESTMENTS (assumindo que 1 = INVESTMENTS)
          const filteredByType = eventDetails.filter(item =>
            item.type !== "INVESTMENT" // Excluir se type for 1 (INVESTMENTS)
          );

          if (profile != 0) {
            filteredDetails = filteredByType.filter(item =>
              item.investor.toLowerCase() === wallet?.toLowerCase()
            );
          } else {
            filteredDetails = filteredByType;
          }

          if (filteredDetails.length === 0) {
            setMessage(common('dataNotAvailable'));
            setTransactionDetails([]);
            setDisplayedItems([]);
          } else {
            setTransactionDetails(filteredDetails);

            // Buscar perfis dos investidores únicos
            const uniqueInvestors = Array.from(new Set(filteredDetails.map(item => item.investor)));
            console.log(`🔍 Buscando perfis para ${uniqueInvestors.length} investidores únicos`);
            
            const profilePromises = uniqueInvestors.map(async (investor) => {
              const investorProfile = await getInvestorProfile(investor, propertyId);
              return { investor, profile: investorProfile };
            });
            
            const profileResults = await Promise.all(profilePromises);
            const newProfileMap = new Map(profileResults.map(result => [result.investor, result.profile]));
            setInvestorProfiles(newProfileMap);
            
            console.log('✅ Perfis carregados:', Array.from(newProfileMap.entries()));

            // Aplicar ordenação se especificada
            const sortedDetails = sortColumn ? sortData(filteredDetails, sortColumn, sortDirection) : filteredDetails;
            
            // Mostrar apenas os primeiros 8 itens inicialmente
            const itemsToDisplay = sortedDetails.slice(0, itemsToShow);
            setDisplayedItems(itemsToDisplay);

            setMessage(null);
          }
        }
      } catch (err) {
        console.error(common('errorLoadingData'), err);
        setMessage(common('errorLoadingData'));
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    if (wallet) {
      fetchData();
    }

  }, [wallet, profile, propertyId, t, itemsToShow]);

  // useEffect para aplicar ordenação quando sortColumn ou sortDirection mudam
  useEffect(() => {
    if (transactionDetails.length > 0) {
      const sortedDetails = sortColumn ? sortData(transactionDetails, sortColumn, sortDirection) : transactionDetails;
      const itemsToDisplay = sortedDetails.slice(0, itemsToShow);
      setDisplayedItems(itemsToDisplay);
    }
  }, [sortColumn, sortDirection, transactionDetails, itemsToShow]);

  const hasMoreItems = transactionDetails.length > displayedItems.length;

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        {isLoadingProfiles ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando perfis de investidores...</span>
          </div>
        ) : message ? (
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
                      <>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">wallet</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">perfil</th>
                      </>
                    )}
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('dateExpected')}
                    >
                      <div className="flex items-center">
                        {t('time')}
                        {sortColumn === 'dateExpected' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
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
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="inline-block">
                        <div className="text-left">{t('dateReceive.line1')}</div>
                        <div className="flex items-center justify-end">
                          {t('dateReceive.line2')}&nbsp;
                        </div>
                      </div>
                    </th>
                    {/* <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-gray-50">
                        {profile === 0 && (
                          <>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {item.investor}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                              {(() => {
                                const investorProfile = investorProfiles.get(item.investor) || null;
                                const getProfileName = (profile: number | null) => {
                                  switch (profile) {
                                    case 0: return 'Admin';
                                    case 1: return 'Proprietário';
                                    case 2: return 'Inquilino';
                                    case 3: return 'Investidor';
                                    case 4: return 'Legado';
                                    case 5: return 'FMZ';
                                    default: return 'N/A';
                                  }
                                };
                                
                                return (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    investorProfile === 0 ? 'bg-red-100 text-red-800' :
                                    investorProfile === 1 ? 'bg-blue-100 text-blue-800' :
                                    investorProfile === 2 ? 'bg-green-100 text-green-800' :
                                    investorProfile === 3 ? 'bg-purple-100 text-purple-800' :
                                    investorProfile === 4 ? 'bg-orange-100 text-orange-800' :
                                    investorProfile === 5 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {getProfileName(investorProfile)}
                                  </span>
                                );
                              })()}
                            </td>
                          </>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.dateExpected}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right font-bold">
                          {(() => {
                            const investorProfile = investorProfiles.get(item.investor) || null;
                            const isLegacy = isLegacyInvestor(investorProfile);
                            
                            if (isLegacy) {
                              // Para legados: somar coparticipação + tokens recomprados
                              return calculateTotalForLegacy(item.amount, item.tokensRepurchasedCurrency);
                            } else {
                              // Para não-legados: usar valor original
                              return item.totalValue;
                            }
                          })()}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrencyValue(item.amount)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrencyValue(item.tokensRepurchasedCurrency)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {(() => {
                            const investorProfile = investorProfiles.get(item.investor) || null;
                            return isLegacyInvestor(investorProfile) ? '-' : formatCurrencyValue(item.fee, true);
                          })()}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {(() => {
                            const investorProfile = investorProfiles.get(item.investor) || null;
                            return isLegacyInvestor(investorProfile) ? '-' : formatCurrencyValue(item.maintenanceDiscount, true);
                          })()}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.date}</td>
                        {/* <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                          <p className="text-green-600">
                            <span className="text-green-600 bg-green-100 px-5 py-1 rounded-lg font-medium">{t("statusReceived")}</span>
                          </p> 
                        </td> */}
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

export default RentDistributionListAdmin;
