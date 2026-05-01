"use client"

import React, { useState, useEffect } from "react";
import { ArrowLeft, X } from 'lucide-react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

import {
  getPropertyDetail, PropertyData,
  getRentDetail, RentDetailData,
  getInvestorDetail, InvestorData,
} from "../../../../services/web3-api";

// Componente reutilizável para linhas de informação
interface InfoRowProps {
  label: string;
  children: React.ReactNode;
  tooltip?: string;
  showTooltip?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, children, tooltip, showTooltip = false }) => (
  <div className="flex flex-col md:flex-row md:items-center py-2">
    <div className="md:w-1/3 text-gray-600 font-bold flex items-center">
      {label}
      {showTooltip && tooltip && (
        <div className="relative group inline-block font-medium ml-2">
          <div className="info-icon" />
          <div className="absolute z-10 hidden group-hover:block bg-white text-black text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-normal shadow-lg border w-64">
            {tooltip}
          </div>
        </div>
      )}
    </div>
    <div className="md:w-2/3 text-gray-800 px-6">
      {children}
    </div>
  </div>
);

export default function ActiveContractPage() {
  const t = useTranslations('ActiveContract');
  const common = useTranslations('Common');

  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const [propertyId, setPropertyId] = useState<number>(1);
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [propertyDetail, setPropertyDetail] = useState<PropertyData | null>(null);
  const [rentDetail, setRentDetail] = useState<RentDetailData | null>(null);
  const [investorDetail, setInvestorDetail] = useState<InvestorData | null>(null);

  const openModal = (image: string) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage('');
  };

  useEffect(() => {

    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      setWallet(storedWallet);
    }

    setMessage(common('loading'));

    const fetchData = async () => {
      try {
        const propertyDetails = await getPropertyDetail(propertyId);
        setPropertyDetail(propertyDetails);

        setMessage(common('loading'));
        try {
          const rentDetails = await getRentDetail(propertyId);
          setRentDetail(rentDetails);
        } catch (err) {
          setMessage(err instanceof Error ? err.message : common('errorLoadingData'));
        }
        setMessage(common('loading'));
        try {
          const investorDetails = await getInvestorDetail(propertyId, wallet!);
          setInvestorDetail(investorDetails);
          setMessage("");
        } catch (err) {
          setMessage(err instanceof Error ? err.message : common('errorLoadingData'));
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : common('errorLoadingData'));
      }
    };

    if (wallet) {
      fetchData();
    }
  }, [wallet, propertyId, t]);

  const handleBackNavigation = () => {
    router.back();
  };
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <main>
        {propertyDetail ? (
          <>
            <div className="flex items-center w-full gap-3 mb-4">
              <button onClick={handleBackNavigation} className="text-gray-400 button-line-transparent border border-white ml-2 text-sm py-1">
                <ArrowLeft size={28} />
              </button>
            </div>

            <h2 className="text-4xl  mb-6">{t('activeContractTitle')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="bg-blue-50 mt-16 rounded-xl mb-6 relative">
                  <div className="absolute right-8 -top-12">
                    <Image
                      src="/Home.png"
                      alt=""
                      width={120}
                      height={120}
                      className="object-contain"
                    />
                  </div>

                  <div className="flex items-center px-8 py-6 bg-indigo-100 rounded-t-xl">
                    <h2 className="text-xl font-bold">{propertyDetail.name}</h2>
                  </div>

                  <div className="p-6">
                    <table className="w-full">
                      <tbody>
                        {propertyDetail.attributes.map((attribute, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 text-gray-600 font-semibold">{attribute.trait_type}</td>
                            <td className="py-3 text-gray-800">{attribute.value}</td>
                          </tr>
                        ))}

                        {investorDetail?.profile != 2 && (
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-gray-600 font-semibold">{t('propertyValueLabel')}</td>
                            <td className="py-3 text-gray-800">
                              {propertyDetail?.propertyValueCurrency} &nbsp;
                              {/* <a href="#" className="text-blue-600 hover:underline">{t('viewDocument')}</a> */}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-600 font-semibold">{t('propertyRGI')}</td>
                          <td className="py-3 text-gray-800">
                            {propertyDetail.deedRegistration} &nbsp;
                            {/* <a href="#" className="text-blue-600 hover:underline">{t('viewDocument')}</a> */}
                          </td>
                        </tr>

                        {/* <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-600 font-semibold">Smart Contract:</td>
                          <td className="py-3 text-gray-800">

                            <a href={propertyDetail.blockExplorerUrl} target="_blank" className="text-blue-600 hover:underline">{propertyDetail.smartContract}</a>
                          </td>
                        </tr> */}
                        {investorDetail && investorDetail.profile === 0 && (                        
                          <tr className="border-b border-gray-100">
                           <td className="py-3 text-gray-600 font-semibold">Smart Contract:</td>
                           <td className="py-3 text-gray-800">
 
                             <a href={propertyDetail.blockExplorerUrl} target="_blank" className="text-blue-600 hover:underline">{propertyDetail.smartContract}</a>
                           </td>
                           </tr>                          
                        )}
                        <tr>
                          <td className="py-3 text-gray-600 font-semibold">{t('galleryLabel')}</td>
                          <td className="py-3 text-gray-800">
                            <a onClick={() => openModal(propertyDetail.image)} className="text-blue-600 hover:underline">{t('viewImages')}</a>
                            {/* <a onClick={() => openModal("/fmz1/doorfmz1.jpeg")} className="text-blue-600 hover:underline">{t('viewImages')}</a> */}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Contract Details Card */}
              {investorDetail !== null && investorDetail.profile !== 3 && investorDetail.profile !== 4 && (
              <div>
                <h2 className="text-xl mt-40 mb-6 ">{t('contractInfoTitle')}</h2>

                <div className="grid grid-cols-1 gap-y-4">
                  {/* Contrato */}
                  {investorDetail && (
                    <InfoRow label={t('contractLabel')}>
                      {investorDetail.profile != 3 ? (
                        <a href="/fmz1/Contrato_FMZ-1.pdf" target="_blank" className="text-blue-600 hover:underline">
                          {t('viewDocument')}
                        </a>
                      ) : (
                        t('viewDocument')
                      )}
                    </InfoRow>
                  )}

                  {/* Data de Assinatura */}
                  <InfoRow label={t('signedOnLabel')}>
                    {investorDetail && investorDetail.profile != 3 && rentDetail?.startDate}
                  </InfoRow>

                  {/* Valor da Propriedade (apenas para perfil 2) */}
                  {investorDetail && investorDetail.profile === 2 && (
                    <InfoRow label={t('propertyValueLabel')}>
                      {propertyDetail?.propertyValueCurrency}
                    </InfoRow>
                  )}

                  {/* Tokens Comprados (apenas para perfil 3) */}
                  {investorDetail && investorDetail.profile === 3 && (
                    <InfoRow
                      label={t('purchasedTokensLabel')}
                      tooltip={t('purchasedTokensInfo')}
                      showTooltip={true}
                    >
                      {investorDetail?.capitalValueNumberFormat} {t('purchasedTokens')} {t.rich('percenTokens', { percent: investorDetail?.initTokensPercentFormat })}
                    </InfoRow>
                  )}

                  {investorDetail && investorDetail.profile === 3 && (
                    <InfoRow
                      label={t('periodLabel')}
                      tooltip={t('periodInfo')}
                      showTooltip={true}
                    >
                      {t('periodResult')}
                    </InfoRow>
                  )}

                  {/* Co-proprietários */}
                  {/* <InfoRow
                    label={`${t('coOwnersLabel')}`}
                    tooltip={investorDetail?.profile == 1 || investorDetail?.profile == 3 ? t('coOwnersInfoInvestor') : t('coOwnersInfo')}
                    showTooltip={true}
                  >
                    {investorDetail?.totalInvestors} {t('participantLabel')}
                  </InfoRow> */}
                </div>
              </div>
              )}
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                <div className="relative">
                  <button
                    onClick={closeModal}
                    className="absolute button-circle-gray top-3 right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                  <img
                    src={selectedImage}
                    className="max-w-full max-h-screen object-contain"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h1 className="text-xl font-medium text-gray-700 mb-2">
                {message}
              </h1>
              <div className="animate-pulse bg-gray-200 rounded-md h-4 w-32 mx-auto"></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}