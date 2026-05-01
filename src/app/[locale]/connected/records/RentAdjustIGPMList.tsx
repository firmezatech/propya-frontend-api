'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useProfile } from "app/context/ProfileContext";

import { getRentAdjustIGPMList, RentAdjustmentType } from "../../../../services/web3-api";

interface Props {
  propertyId?: number;
}

const RentAdjustIGPMList: React.FC<Props> = ({ propertyId }) => {
  const router = useRouter();
  const t = useTranslations("RentAdjustment");
  const common = useTranslations("Common");
  const { currentProfile } = useProfile();

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionIGPMDetails, setTransactionIGPMDetails] = useState<RentAdjustmentType[]>([]);
  const [message1, setMessage1] = useState<string | null>(null);
  const [message2, setMessage2] = useState<string | null>(null);

  useEffect(() => {
    const handleWalletChange = () => {
      const storedWallet = localStorage.getItem("wallet");
      if (storedWallet) {
        setWallet(storedWallet);
      }
    };

    window.addEventListener('walletChanged', handleWalletChange);

    handleWalletChange();

    return () => {
      window.removeEventListener('walletChanged', handleWalletChange);
    };
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const igpmList = await getRentAdjustIGPMList();

        // If admin user (profile === 0), show all adjustments
        // Otherwise, filter by propertyId
        const filteredList = currentProfile === 0
          ? igpmList
          : igpmList?.filter(item => item.propertyId === propertyId);

        if (!filteredList || !filteredList.length) {
          setMessage1(t("messageNoData1"));
          setMessage2(t("messageNoData2"));
          setTransactionIGPMDetails([]);
        } else {
          const sortedData = [...filteredList].sort((a, b) => {
            const dateA = new Date(a.dateTimestamp).getTime();
            const dateB = new Date(b.dateTimestamp).getTime();
            return dateB - dateA;
          });
          setTransactionIGPMDetails(sortedData);
          setMessage1(null);
        }
      } catch (err) {
        console.error(common("errorLoadingData"), err);
        setMessage1(common("errorLoadingData"));
      }
    };

    fetchData();
  }, [wallet, propertyId, currentProfile, t, common]);

  return (
    <>
      {message1 ? (
        <div className="mb-6 rounded-md p-4 text-sm bg-gray-50 text-gray-700  border-blue-500">
          {message1}
          <br/><br/>
          {message2}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-300">
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("tableHeaders.date")}</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>{t("tableHeaders.initialRent.line1")}</div>
                  <div>{t("tableHeaders.initialRent.line2")}</div>
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>{t("tableHeaders.percentAdjustment")}</div>
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>{t("tableHeaders.newRentValue.line1")}</div>
                  <div>{t("tableHeaders.newRentValue.line2")}</div>
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>{t("tableHeaders.currentRent.line1")}</div>
                  <div>{t("tableHeaders.currentRent.line2")}</div>
                </th>

              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactionIGPMDetails.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.initRentValue}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.percentAdjustment}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.currentRentValue}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.newRentValue}</td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default RentAdjustIGPMList;
