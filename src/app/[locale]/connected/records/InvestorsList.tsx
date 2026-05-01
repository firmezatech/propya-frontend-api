"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getInvestorList, InvestorData, getStatusProfile} from "../../../../services/web3-api";
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  profile: number | null;
  propertyId?: number;
}

const InvestorsList: React.FC<Props> = ({ profile, propertyId }) => {
  const router = useRouter();
  const t = useTranslations("InvestorsList");
  const common = useTranslations("Common");
  const profileT = useTranslations("Profile");

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [investorList, setInvestorList] = useState<InvestorData[]>([]);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      setWallet(storedWallet);
    }
  }, []);

  useEffect(() => {
    setInvestorList([]);

    if (!wallet) {
      setMessage(common('pleaseLogin'));
      return;
    }

    // For admin users (profile === 0), we don't need propertyId
    if (profile !== 0 && !propertyId) {
      setMessage(common('dataNotAvailable'));
      return;
    }

    setMessage(common('loading'));

    const fetchInvestors = async () => {
      try {
        const investors = await getInvestorList(profile === 0 ? undefined : propertyId);
        if (investors && investors.length > 0) {
          const investorDetails = investors.map(investor => ({
            ...investor,
          }));

          setInvestorList(investorDetails);
          setMessage(null);
        } else {
          setMessage(common('dataNotAvailable'));
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : common('errorLoadingData'));
      }
    };

    fetchInvestors();
  }, [wallet, propertyId, profile, common]);

  const handleBackNavigation = () => {
    router.back();
  };
  return (
    <div className="container">
      <main className="mt-4 mb-6">

        {(Number(profile) == 2) ? (
          <>
            <button onClick={handleBackNavigation} className="text-gray-400 button-line-transparent border border-white ml-2 text-sm py-1">
              <ArrowLeft size={28} />
            </button>
            <h1 className="text-2xl font-semibold mb-2">{t('titles.coOwnersList')}</h1>
          </>
        ) : ""}
        {investorList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {investorList.map((investor, index) => (
              <div key={index} className="p-6 rounded-2xl border bg-white shadow-lg border-black transition-transform transform hover:scale-105 hover:shadow-xl">

                {investor.profile == 0 ? "" : <>
                  <button className="bg-blue text-sm text-white px-4 py-1 rounded-lg">
                    {
                      investor.profile &&
                      getStatusProfile(investor.profile, profileT)
                    }
                  </button>
                </>
                }
                <h2 className="text-xs font-bold text-gray-900 mb-4">
                  {investor.investorAddress.slice(0, 15) + "..." + investor.investorAddress.slice(-4)}
                </h2>
                <p className="text-gray-700 text-sm">{t('labels.tokensPurchasedValue')} {investor.capitalValue} </p>
                <p className="text-gray-700 text-sm">{t('labels.tokensPurchasedQuantity')} {investor.capitalValueNumberFormat} </p>

                {investor.profile == 2 ? "" : <>
                  <p className="text-gray-700 text-sm">{t('labels.tokensSoldQuantity')} {investor.rePurchasedTokensNumberFormat} </p>
                </>
                }
                <p className="text-gray-700 text-sm">{t('labels.tokensCurrentQuantity')} {investor.propertyTokensCurrentFormat} </p>
                <p className="text-gray-700 text-sm">{t('labels.tokensCurrentPercent')} {investor.percentageInvested}</p>

                {investor.profile !== 2 && (
                  <>
                    {(Number(profile) === 0 || investor.investorAddress === wallet) ? (
                      <>
                        
                        <p className="text-gray-700 text-sm">{t('labels.grossYield')} {investor.rentYield}</p>
                        <p className="text-gray-700 text-sm">{t('labels.netYield')} {investor.rentYieldFee}</p>
                      </>
                    ) : null}
                  </>
                )}

              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}

export default InvestorsList;
