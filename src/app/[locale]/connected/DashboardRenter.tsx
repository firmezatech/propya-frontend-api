"use client";

import React, {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useProfile } from '../../context/ProfileContext';

import { PropertyData, RentDetailData, InvoiceData } from "../../../services/web3-api";
import TokensPurchaseBanner from "./TokensPurchaseBanner";

interface Props {
  rentDetail: RentDetailData | null;
  propertyDetail: PropertyData | null;
  profile: number | null;
  invoiceData: InvoiceData | null;
}

export default function DashboardRenter({
  rentDetail,
  propertyDetail,
  profile,
  invoiceData
}: Props) {
  const { setCurrentProfile } = useProfile();

  const router = useRouter();
  const t = useTranslations('DashboardRenter');
  const comm = useTranslations("Common");

  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Get propertyId from propertyDetail
  const propertyId = propertyDetail?.propertyId || 1;

  useEffect(() => {
    // Use the invoiceData prop instead of making an API call
    if (invoiceData) {
      console.log("✅ Dados do boleto recebidos:", invoiceData);
      setInvoiceSummary(invoiceData);
      setMessage("");
    } else {
      console.log("⚠️ Nenhum dado de boleto recebido");
      // Only show error if we expected data but didn't get it
      setMessage(null);
    }
  }, [invoiceData, comm]);

  // Log when property or rent details change
  useEffect(() => {
    if (propertyDetail) {
      console.log("✅ Dados da propriedade atualizados:", propertyDetail);
    } else {
      console.log("⚠️ Nenhum dado de propriedade disponível");
    }

    if (rentDetail) {
      console.log("✅ Dados do aluguel atualizados:", rentDetail);
    } else {
      console.log("⚠️ Nenhum dado de aluguel disponível");
    }
  }, [propertyDetail, rentDetail]);

  // Show loading state if we're waiting for data
  if (!propertyDetail || !rentDetail) {
    console.log("⏳ Aguardando carregamento dos dados...");
    return (
      <div className="w-full">
        <div className="flex flex-col md:flex-row gap-6 w-full mt-12">
          <div className="w-full md:w-2/5 rounded-2xl">
            <div className="p-4">
              <span className="text-3xl font-bold mb-12 pb-6">{t('monthSummary')}</span>
              <div className="w-full mt-6 mb-4 bg-gray-50 rounded-2xl p-8 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded-md w-48 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded-md w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-40"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-3/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
              <div className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if we have an error message
  if (message) {
    console.log("❌ Erro exibido:", message);
    return (
      <div className="w-full">
        <div className="flex flex-col md:flex-row gap-6 w-full mt-12">
          <div className="w-full rounded-2xl">
            <div className="p-4">
              <div className="w-full mt-6 mb-4 bg-red-50 rounded-2xl p-8 flex items-center justify-center">
                <span className="text-red-600">{message}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validate required data before rendering
  if (!propertyDetail.percentageMissingNumber || !propertyDetail.percentageBuyerNumber) {
    console.warn("⚠️ Dados de porcentagem ausentes na propriedade:", propertyDetail);
  }

  if (!rentDetail.currentRentAsOwnerValue || !rentDetail.currentRentValue) {
    console.warn("⚠️ Dados de aluguel ausentes:", rentDetail);
  }

  console.log("✅ Renderizando dashboard com todos os dados disponíveis");

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-6 w-full mt-12">
        <div className="w-full md:w-2/5 rounded-2xl">
          <div className="p-4">
            <span className="text-3xl font-bold mb-12 pb-6">{t('monthSummary')}</span>
            {invoiceSummary ? (
              <>
                <div className="w-full mt-6 mb-4 bg-gray-50 rounded-2xl flex flex-col items-center justify-center">
                  <table className="py-12 px-6 mb-8 w-full bg-gray-50 rounded-2xl">
                    <tbody>
                      <tr>
                        <td colSpan={2} className="bg-indigo-50 py-4 px-8 rounded-t-xl">
                          <div>
                            {t('totalToPay')}
                            <h1 className="font-bold mt-2 mb-2 text-left" style={{ fontSize: "2rem" }}>
                              {invoiceSummary.totalInvoice}
                            </h1>
                            {t('dueDate')} <span className="font-bold text-left">{invoiceSummary.dueDate}</span>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2 px-8 pt-3 text-gray-900">{t('rentWithDiscount')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('rentDiscountInfo')}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{invoiceSummary.currentRentAsOwnerValue}</td>
                      </tr>

                      <tr>
                        <td className="py-2 px-8 pt-3 text-gray-900">{t('rentValueFee')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('rentValueFeeInfo')}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{invoiceSummary.rentValueFee}</td>
                      </tr>

                      <tr>
                        <td className="py-2 px-8 text-gray-900">{t('condominium')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('condominiumInfo')}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{invoiceSummary.condoFee}</td>
                      </tr>

                      {invoiceSummary.propertyTax > 0 && (
                      <tr>
                        <td className="py-2 px-8 text-gray-900">{t('propertyTax')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('propertyTaxInfo')}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{invoiceSummary.propertyTaxCurrency}</td>
                      </tr>                     
                      )}

                      <tr>
                        <td className="py-2 px-8 text-gray-900">{t('scheduledTokenPurchase')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t.rich('scheduledTokenPurchaseInfo', { amount: invoiceSummary.tokensToBuyCurrency })}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{invoiceSummary.tokensToBuyCurrency}</td>
                      </tr>

                      <tr>
                        <td className="py-2 px-8 text-gray-900">{t('fractionAcquisitionFee')}&nbsp;
                          <div className="relative group inline-block">
                            <div className="info-icon" />
                            <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                              {t('fractionAcquisitionFeeInfo')}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-8 text-gray-900 text-right">{invoiceSummary.tokensToBuyFee}</td>
                      </tr>

                      {invoiceSummary.maintenanceAsOwnerNumber !== 0 && (
                        <tr>
                          <td className="py-2 px-8 pb-5 text-gray-900">{t('maintenance')}&nbsp;
                            <div className="relative group inline-block">
                              <div className="info-icon" />
                              <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                                {t('maintenanceInfo')}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-8 pb-5 text-gray-900 text-right">{invoiceSummary.maintenanceAsOwnerValue}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <button 
                    className={`text-sm px-12 py-3 mb-6 rounded-full cursor-pointer ${
                      (invoiceSummary.statusBD === 2 && invoiceSummary.dueDateNumber > invoiceSummary.todayNumber) || invoiceSummary.statusBD === 1
                        ? 'font-bold bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                    onClick={() => {
                      if (invoiceSummary.statusBD === 2 && invoiceSummary.dueDateNumber > invoiceSummary.todayNumber) {
                        window.open(invoiceSummary.path || "", "_blank", "width=800,height=600,menubar=no,toolbar=no,location=no,status=no");
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}>
                    {t('paySlip')}
                  </button>
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
            ) : null}
          </div>
        </div>

        <div className="w-full md:w-3/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div
              className="card-body items-center pb-6 p-6 py-4 rounded-2xl border border-gray-200 cursor-pointer"
              onClick={() => {
                setCurrentProfile(profile);
                router.push("/connected/recordsMenu?target=adjust");
              }}
            >
              <span className="font-bold pb-8 pt-8 ">{t('currentRent')}</span>
              <div className="relative group inline-block">
                <div className="info-icon" />
                <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                  {t('rentReductionInfo')}
                </div>
              </div>
              <h3 className="text-sm pb-8">
                {t('rentReducedTo')}&nbsp;
                <span className="font-bold text-sm">{rentDetail?.currentRentAsOwnerValue}</span>{" "}
              </h3>
              <div className="barrinha w-full">
                <div className="gauge relative">
                  <div className="gauge__body">
                    <div
                      className="gauge__fill"
                      style={{
                        transform: `rotate(${(propertyDetail?.percentageMissingNumber || 0) * 180}deg)`,
                      }}
                    ></div>
                    <div className="gauge__cover flex items-center justify-center flex-col">
                      <div className="font-bold text-black text-2xl">
                        {propertyDetail?.percentageMissingTruncate || "0%"}
                      </div>
                      <div className="text-xs text-black">{t('propertyIsRent')}</div>
                    </div>
                  </div>
                </div>
                <div className="barraP mt-12">
                  <div className="dados flex justify-between">
                    <div className="quantotem text-center pt-4">
                      <div className="font-bold text-sm">
                        {rentDetail?.currentRentAsOwnerValue || "R$ 0,00"}
                      </div>
                      <div className="font-normal mt-2 text-sm">{t('currentValue')}</div>
                    </div>
                    <div className="quantofalta text-center pt-4">
                      <div className="text-sm">
                        {rentDetail?.currentRentValue || "R$ 0,00"}
                      </div>
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
              <span className="font-bold pb-8 pt-8">{t('purchaseJourney')}</span>
              <div className="relative group inline-block">
                <div className="info-icon" />
                <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-md w-64">
                  {t('purchaseJourneyInfo')}
                </div>
              </div>
              <h3 className="pb-8 text-sm">
                {t('accumulatedTokens')}&nbsp;
                <span className="font-bold text-sm">
                  {propertyDetail?.totalTokensRenterNumberFormat || "0"}&nbsp; tokens
                </span>
              </h3>
              <div className="barrinha w-full">
                <div className="gauge relative">
                  <div className="gauge__body">
                    <div
                      className="gauge__fill"
                      style={{
                        transform: `rotate(${((propertyDetail?.percentageBuyerNumber || 0)) * 180}deg)`,
                      }}
                    ></div>
                    <div className="gauge__cover flex items-center justify-center flex-col">
                      <div className="font-bold text-black text-2xl">
                        {propertyDetail?.percentageBuyerTruncate || "0%"}
                      </div>
                      <div className="text-xs text-black">{t('propertyIsYours')}</div>
                    </div>
                  </div>
                </div>
                <div className="barraP mt-12">
                  <div className="dados flex justify-between">
                    <div className="quantotem text-center pt-4">
                      <div className="font-bold text-sm">
                        {propertyDetail?.totalTokensRenterCurrency || "R$ 0,00"}
                      </div>
                      <div className="font-normal mt-2 text-sm">{t('tokensAcquired')}</div>
                    </div>
                    <div className="quantofalta text-center pt-4">
                      <div className="text-sm">
                        {propertyDetail?.propertyValueCurrency || "R$ 0,00"}
                      </div>
                      <div className="mt-2 text-sm">{t('propertyValue')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <br />

          <div className="mt-20">
            <TokensPurchaseBanner profile={profile} propertyId={propertyId} />
          </div>        

        </div>
      </div>

      {/* Modal de pagamento não disponível */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('paymentNotAvailable')}</h3>
              <p className="text-gray-600">{t('paymentNotAvailableMessage')}</p>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="bg-blue-600 text-white text-sm px-6 py-2 rounded-full hover:bg-blue-700 font-semibold"
            >
              {t('understood')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
