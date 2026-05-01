'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { getDistributionRentList, DistributionRentType } from "../../../../services/web3-api";

interface Props {
  profile: number | null;
}

const RentDistributionListX: React.FC<Props> = ({ profile }) => {

  const router = useRouter();
  const t = useTranslations("RentDistributionList");
  const common = useTranslations("Common");

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<DistributionRentType[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet && !wallet) {
      setWallet(storedWallet);
    }

    const fetchData = async () => {
      try {
        const eventDetails = await getDistributionRentList();
        if (!eventDetails || eventDetails.length === 0) {
          setMessage(common('dataNotAvailable'));
          setTransactionDetails([]);
        } else {
          let filteredDetails: DistributionRentType[] = [];

          if (profile != 0) {
            filteredDetails = eventDetails.filter(item =>
              item.investor.toLowerCase() === wallet?.toLowerCase()
            );
          } else {
            filteredDetails = eventDetails;
          }

          if (filteredDetails.length === 0) {
            setMessage(common('dataNotAvailable'));
            setTransactionDetails([]);
          } else {
            const sortedDetails = [...filteredDetails].sort((a, b) =>
              Number(b.invoiceId) - Number(a.invoiceId)
            );
            setTransactionDetails(sortedDetails);
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
  }, [wallet, profile, t]);

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
            <thead className="bg-gray-50">

              <tr className="border-b border-gray-300">
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.date')}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.wallet')}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.amount')}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.fee')}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.maintenance')}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.finalValue')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactionDetails.map((item, index) => (
                <tr
                  key={index}
                  className={
                    index > 0 &&
                      item.invoiceId !== transactionDetails[index - 1].invoiceId
                      ? 'border-t-4 border-gray-300'
                      : ''
                  }
                >
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.dateExpected}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                    {item.investor.slice(0, 6) + "..." + item.investor.slice(-4)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.amount}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.fee}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.maintenanceDiscount}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.valueDiscount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
      </main>
    </div>
  );
}

export default RentDistributionListX;
