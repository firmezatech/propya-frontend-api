"use client";

import React from "react";

import { RentDetailData, PropertyData } from "../../../services/web3-api";
import { useTranslations } from 'next-intl';

interface RentInfoProps {
  rentDetail: RentDetailData | null;
  propertyDetail: PropertyData | null;
  handleNavigation: (path: string) => void;
}

const RenterInfo: React.FC<RentInfoProps> = ({ rentDetail, propertyDetail, handleNavigation }) => {
  const t = useTranslations('RenterInfo');

  if (!rentDetail) return <div className="text-sm">{t('noRentInfo')}</div>;

  return (
    <>
      <div className="p-4 mb-2 rounded-2xl border bg-white shadow-lg border-black justify-between items-center transition-transform transform hover:scale-105 hover:shadow-xl">
        <h2 className="text-xs text-gray-900">
          {t('wallet')}:
          <span className="text-1xl font-bold text-gray-900">
            {rentDetail.renter.slice(0, 15) + "..." + rentDetail.renter.slice(-4)}
          </span>
        </h2>

        <h2 className="text-xs text-gray-900">
          {t('renterTokensPercentage')}:
          <span className="text-1xl font-bold text-gray-900">
            {propertyDetail?.percentageBuyer || 0}
          </span>
        </h2>

        <h2 className="text-xs text-gray-900">
          {t('monthlyTokenPurchaseExpected')}:
          <span className="text-1xl font-bold text-gray-900">
            {rentDetail.tokensToBuy || 0}
          </span>
        </h2>  
      </div>
    </>
  );
};

export default RenterInfo;
