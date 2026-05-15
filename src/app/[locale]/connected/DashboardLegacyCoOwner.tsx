"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useProfile } from '../../context/ProfileContext';

import { PropertyData, RentDetailData, InvestorData as CoOwnerData } from "../../../services/web3-api";

interface Props {
  coOwnerDetail: CoOwnerData;
  rentDetail: RentDetailData | null;
  propertyDetail: PropertyData | null;
  profile: number | null;
}

export default function DashboardLegacyCoOwner({
  coOwnerDetail,
  rentDetail,
  propertyDetail,
  profile
}: Props) {
  const { setCurrentProfile } = useProfile();
  const router = useRouter();
  const t = useTranslations('DashboardCoOwner');

  // Função para formatar números com separador de milhares
  const formatNumberWithSeparator = (value: string | number): string => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return value.toString();
    return new Intl.NumberFormat('pt-BR').format(numericValue);
  };

  // Ajustar nextRentPayment se profile === 4
  const adjustedNextRentPayment = profile === 4 
    ? Math.floor((coOwnerDetail.nextRentPayment / 1000) * 100)  /100
    : coOwnerDetail.nextRentPayment;

  // Formatar o valor ajustado
  const adjustedNextRentPaymentCurrency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(adjustedNextRentPayment);

  // Ajustar initRentValue dividindo por 10 (R$ 5,00 -> R$ 0,50)
  const adjustedInitRentValue = coOwnerDetail.initRentValue / 10;

  // Formatar o valor inicial ajustado
  const adjustedInitRentValueCurrency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(adjustedInitRentValue);

  // Calcular totalMonthly ajustado se profile === 4
  const adjustedTotalMonthly = profile === 4 
    ? adjustedNextRentPayment + coOwnerDetail.expectedTokensPurchase 
    : null;

  // Formatar o total ajustado
  const adjustedTotalMonthlyCurrency = adjustedTotalMonthly !== null 
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(adjustedTotalMonthly)
    : coOwnerDetail.totalMonthly;

  // Calcular a porcentagem correta para o gráfico de tokens (tokens atuais / tokens comprados)
  const capitalValueNumber = typeof coOwnerDetail.capitalValueNumberFormat === 'string' 
    ? parseFloat(coOwnerDetail.capitalValueNumberFormat.replace(/\./g, '').replace(',', '.'))
    : coOwnerDetail.capitalValueNumberFormat;
  const tokensCurrentPercentage = capitalValueNumber > 0 
    ? (coOwnerDetail.propertyTokens / capitalValueNumber) 
    : 0;

  // Calcular a porcentagem correta para o gráfico de aluguel (valor atual / valor inicial)
  const rentCurrentPercentage = adjustedInitRentValue > 0 
    ? (adjustedNextRentPayment / adjustedInitRentValue) 
    : 0;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-6 w-full mt-12">
        <div className="w-full md:w-2/5 rounded-2xl">
          <span className="text-3xl font-bold mb-3 pb-6 p-4">{t('monthSummary')}</span>
          <div className="p-4">
            {coOwnerDetail ? (
              <>
                <div className="w-full mt-6 mb-4 bg-gray-50 rounded-2xl flex flex-col items-center justify-center">
                  <table className="py-12 px-6 mb-8 w-full bg-gray-50 rounded-2xl">
                    <tbody>
                      <tr>
                        <td colSpan={2} className="bg-indigo-50 py-4 px-8 rounded-t-xl">
                          <div>
                            {t('totalToReceive')}
                            <h1 className="font-bold mt-2 mb-2 text-left" style={{ fontSize: "2rem" }}>
                              {adjustedTotalMonthlyCurrency}
                            </h1>
                            {t('dueDateLegacy')}
                            <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('dueDateLegacyInfo')}
                            </div>
                          </div>&nbsp; <span className="font-bold text-left">{rentDetail?.nextDatePaymentRent}</span>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2 px-8 pt-3 text-gray-900">{t('rentValueLegacy')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('rentValueInfoLegacy')}
                            </div>
                          </div>

                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{adjustedNextRentPaymentCurrency}</td>
                      </tr>

                      {/* <tr>
                        <td className="py-2 px-8 text-gray-900">{t('feeValue')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('feeValueInfo')}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right"> - {coOwnerDetail.calcNextRentPaymentFeeCurrency}</td>
                      </tr> */}

                      <tr>
                        <td className="py-2 px-8 pt-3 text-gray-900">{t('rePurchased')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('rePurchasedLegacy')}
                            </div>
                          </div>

                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{coOwnerDetail.expectedTokensPurchaseCurrency}</td>
                      </tr>

                      {/* <tr>
                        <td className="py-2 px-8 text-gray-900">{t('rePurchasedExtra')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('rePurchasedExtraInfo')}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">R$ 0,00</td>
                      </tr> */}

                        {/* {coOwnerDetail.maintenanceExpectedCurrency !== 'R$ 0,00' && (
                          <tr>
                            <td className="py-2 px-8 text-gray-900">{t('maintenance')}&nbsp;
                              <div className="relative group inline-block">
                                <div className="info-icon" />
                                <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                                  {t('maintenanceInfo')}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-8 text-gray-900 text-right"> - {coOwnerDetail.maintenanceExpectedCurrency}</td>
                          </tr>
                        )} */}

                      </tbody>

                  </table>


                  {/* <button className="bg-blue-600 text-sm text-white font-bold px-12 py-3 mb-6 rounded-full">
                    {t('paySlip')}
                  </button> */}
                </div>

                <div className="flex flex-col items-center justify-center">

                  <br />
                  <Link
                    href="/connected/recordsMenu?target=history"
                    className="pt-6 text-blue-600 hover:text-blue-800 text-center block no-underline"
                    onClick={() => {
                      setCurrentProfile(profile);
                    }}
                  >
                    {t('paymentHistory')}
                  </Link>
                </div>

              </>
            ) : ""}
          </div>
        </div>

        <div className="w-full md:w-3/5">
          <span className="text-3xl font-bold mb-3 pb-6">{t('graphicSummaryLegacy')}</span> {" "}
          <div className="relative group inline-block">
            <div className="info-icon" />
            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
              {t('graphicSummaryInfo')}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div
              className="card-body items-center pb-6 p-6 py-4 rounded-2xl border border-gray-200 cursor-pointer"
              onClick={() => {
                setCurrentProfile(profile);
                router.push("/connected/recordsMenu?target=adjust");
              }}
            >
              <span className="font-bold pb-8 pt-8">{t('currentRent')}</span> {" "}
              <div className="relative group inline-block">
                <div className="info-icon" />
                <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                  {t('rentReductionInfoLegacy')}
                </div>
              </div>
              <h3 className="pb-12">
                {t('rentReducedTo1')}
                <span className="font-bold">{adjustedNextRentPaymentCurrency}</span>
                {t('rentReducedTo2')}
              </h3>
              <div className="barrinha w-full">
                <div className="gauge relative group">
                  <div className="gauge__body">
                    <div
                      className="gauge__fill"
                      style={{
                        transform: `rotate(${rentCurrentPercentage * 180}deg)`,
                      }}
                    ></div>
                    <div className="gauge__cover flex items-center justify-center flex-col">
                      <div className="font-bold text-black text-2xl">{coOwnerDetail.rentYield}</div>
                      <div className="text-sm text-black">{t('rentYieldFeeLabel')} &nbsp;
                        <div className="relative inline-block">
                          <div className="info-icon" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute z-50 hidden group-hover:block bg-white text-black text-xs rounded py-3 px-4 -top-16 left-1/2 -translate-x-1/2 whitespace-normal shadow-lg border w-72">
                    {t('rentYieldFeeInfo')}
                  </div>
                </div>
                <div className="barraP mt-12">
                  <div className="dados flex justify-between">
                    <div className="quantotem text-center pt-4">
                      <div className="font-bold text-sm">{adjustedNextRentPaymentCurrency}</div>
                      <div className="font-normal mt-2 text-sm">{t('currentValue')}</div>
                    </div>
                    <div className="quantofalta text-center pt-4">
                      <div className="text-sm">{adjustedInitRentValueCurrency}</div>
                      <div className="mt-2 text-sm">{t('initialValue')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card-body items-center pb-6 p-4 py-4 rounded-2xl border border-gray-200 cursor-pointer"
              onClick={() => {
                setCurrentProfile(profile);
                router.push("/connected/recordsMenu?target=tokens");
              }}
            >
              <span className="font-bold pb-8 pt-8">{t('purchaseJourneyLegacy')}</span> {" "}
              <div className="relative group inline-block">
                <div className="info-icon" />
                <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                  {t('purchaseJourneyLegacyInfo')}
                </div>
              </div>
              <h3 className="pb-8">
                {t('accumulatedTokens1Legacy')}&nbsp;
                <span className="font-bold">{coOwnerDetail.propertyTokensCurrentFormat} tokens</span>{" "}
                {t.rich('accumulatedTokens2Legacy', { percent: coOwnerDetail.percentageInvested })}&nbsp;
              </h3>
              <div className="barrinha w-full">
                <div className="gauge relative">
                  <div className="gauge__body">
                    <div
                      className="gauge__fill"
                      style={{
                        transform: `rotate(${tokensCurrentPercentage * 180}deg)`,
                      }}
                    ></div>
                    <div className="gauge__cover flex items-center justify-center flex-col">
                      <div className="font-bold text-black text-2xl">{coOwnerDetail.rePurchasedTokensNumberFormat}</div>
                      <div className="text-sm text-black">{t('tokensRepurchased')}</div>
                    </div>
                  </div>
                </div>
                <div className="barraP mt-12">
                  <div className="dados flex justify-between">
                    <div className="quantotem text-center pt-4">
                      <div className="font-bold text-sm">{coOwnerDetail.propertyTokensCurrentFormat}</div>
                      <div className="font-normal mt-2 text-sm">{t('tokensCurrent')}</div>
                    </div>
                    <div className="quantofalta text-center pt-4">
                      <div className="text-sm">{formatNumberWithSeparator(coOwnerDetail.capitalValueNumberFormat)}</div>
                      <div className="mt-2 text-sm">{t('tokensAcquired')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>


        </div>
      </div>
    </div>
  );
}