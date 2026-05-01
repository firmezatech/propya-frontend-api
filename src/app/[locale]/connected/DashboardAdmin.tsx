"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

import { useProfile } from '../../context/ProfileContext';
import Link from "next/link";

interface Report {
  profile: number | null;
}

const DashboardAdmin: React.FC<Report> = ({ profile }) => {
  const t = useTranslations('DashboardAdmin');
  const { setCurrentProfile } = useProfile();
  const router = useRouter();
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <div className="p-4 mb-2 rounded-2xl border bg-white shadow-lg border-black justify-between items-center transition-transform transform hover:scale-105 hover:shadow-xl">

          <div className="flex flex-row gap-6">
            <div className="flex flex-col gap-1 mt-2">
              <button className="text-2xl  bg-blue-400 text-white flex items-center px-1 py-1 rounded-lg mb-2">
                {t('propertyManagement')}
             </button>
              <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/rentAdjustmentAdmin")}>
                {t('adjustRentByIGPM')} <span className="text-xs">(Oracle Fact)</span>
              </button>
              <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/invoicesAdmin")}>
                {t('invoices')}
              </button>
              <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/maintenancesAdmin")}>
                {t('maintenances')}
              </button>
              <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/investPropertyAdmin")}>
                Incluir Investidores
              </button>

<br/>
              <button className="text-2xl  bg-blue-400 text-white flex items-center px-1 py-1 rounded-lg mb-2">
             </button>
<br/>

              <button className="text-xs border rounded button-line px-2 py-1"
               onClick={() => handleNavigation("/connected/reportAdminPaymentsInvestor")}>
                {t('paymentInvestor')}
              </button>
              {/* <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/invoiceOpenAdmin")}>
                {t('receiveRentAndTransferTokens')}
              </button> */}

              <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/feeList")}>
                {t('receivedFees')}
              </button> 

              <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/adminUserList")}>
                {t('users')}
              </button>

              {/* <hr className="mb-3 mt-3 " />
              <button
                onClick={() => {
                  setCurrentProfile(profile);
                  router.push("/connected/recordsMenu/");
                }}
               className="text-sm bg-blue-400 text-white flex items-center px-1 py-1 rounded-lg mb-2">
                {t('profileUsers')}
              </button>              */}
            </div>

          </div>
        </div>

        <div className="p-4 mb-2 rounded-2xl border bg-white shadow-lg border-black justify-between items-center transition-transform transform hover:scale-105 hover:shadow-xl">
          <div className="flex flex-row gap-6">
            <div className="flex flex-col gap-1 mt-2">
              <button className="text-2xl bg-blue-400 text-white flex items-center px-1 py-1 rounded-lg mb-2">
                {t('internal')}
              </button>

              <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/adminContactList")}>
                {t('contactsCalculator')}
              </button>
              {/* <button className="text-xs border rounded button-line px-2 py-1" onClick={() => handleNavigation("/connected/adminGas")}>
                {t('gasCost')}
              </button> */}

            </div>

          </div>

        </div>
          {/* Link para Gamificação */}
            <div className="mt-6">
            Exemplo para Gamificação (inspiracao)

            <Link
              href="/connected/gamification"
              className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-4 px-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                setCurrentProfile(profile);
              }}
            >
              🎮 {t('gameSystemLink')}
            </Link>
          </div> 
      </div>
    </>
  );
};

export default DashboardAdmin;
