"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import MaintenanceBase, { MaintenanceBaseContext } from "../components/maintenance/MaintenanceBase";

export default function MaintenancePageAdmin() {
  const router = useRouter();
  const t = useTranslations("MaintenanceBase");
  const common = useTranslations("Common");

  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleBackNavigation} 
              className="border rounded button-line"
            >
              &larr; {common("back")}
            </button>
            <button
              onClick={() => router.push('/connected/maintenanceCreate')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center text-sm"
              type="button"
            >
              <span className="mr-1">+ {t("newMaintenance")}</span>
            </button>
          </div>
        </div>

        <MaintenanceBase isAdminView={true}>
          {(context: MaintenanceBaseContext) => (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {context.message && (
                <div className={`mb-6 rounded-md p-4 text-sm ${
                  context.message.includes('sucesso')
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                    : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                }`}>
                  {context.message}
                </div>
              )}
              
              <div className="overflow-x-auto">
                {/* O conteúdo da MaintenanceBase será renderizado aqui */}
              </div>
            </div>
          )}
        </MaintenanceBase>
      </main>
    </div>
  );
}