"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

const ADMIN_ROUTES = {
  rentAdjustment: '/connected/rentAdjustmentAdmin',
  invoices: '/connected/invoicesAdmin',
  maintenances: '/connected/maintenancesAdmin',
  feeList: '/connected/feeList',
  adminUserList: '/connected/admin-user-list',
  contactList: '/connected/adminContactList',
} as const;

export default function FmzDashboardAdmin() {
  const t = useTranslations('DashboardAdmin');
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 mb-2 rounded-2xl border bg-white shadow-lg border-black justify-between items-center transition-transform transform hover:scale-105 hover:shadow-xl">
        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-1 mt-2">
            <button className="text-2xl bg-blue-400 text-white flex items-center px-1 py-1 rounded-lg mb-2">
              {t('propertyManagement')}
            </button>
            <button className="text-xs border rounded button-line px-2 py-1" onClick={() => router.push(ADMIN_ROUTES.rentAdjustment)}>
              {t('adjustRentByIGPM')} <span className="text-xs">(Oracle Fact)</span>
            </button>
            <button className="text-xs border rounded button-line px-2 py-1" onClick={() => router.push(ADMIN_ROUTES.invoices)}>
              {t('invoices')}
            </button>
            <button className="text-xs border rounded button-line px-2 py-1" onClick={() => router.push(ADMIN_ROUTES.maintenances)}>
              {t('maintenances')}
            </button>
            <button className="text-xs border rounded button-line px-2 py-1" onClick={() => router.push(ADMIN_ROUTES.feeList)}>
              {t('receivedFees')}
            </button>
            <button className="text-xs border rounded button-line px-2 py-1" onClick={() => router.push(ADMIN_ROUTES.adminUserList)}>
              {t('users')}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 mb-2 rounded-2xl border bg-white shadow-lg border-black justify-between items-center transition-transform transform hover:scale-105 hover:shadow-xl">
        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-1 mt-2">
            <button className="text-2xl bg-blue-400 text-white flex items-center px-1 py-1 rounded-lg mb-2">
              {t('internal')}
            </button>
            <button className="text-xs border rounded button-line px-2 py-1" onClick={() => router.push(ADMIN_ROUTES.contactList)}>
              {t('contactsCalculator')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
