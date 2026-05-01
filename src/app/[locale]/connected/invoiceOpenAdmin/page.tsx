"use client";

import React, { useState } from "react";
import InvoiceBaseAdmin, { InvoiceBaseContext } from "../components/invoice/InvoiceBaseAdmin";
import { InvoiceData } from "../../../../services/web3-api";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function InvoiceOpenAdminPage() {
  const router = useRouter();
  const t = useTranslations("InvoiceOpenAdmin");
  const common = useTranslations("Common");
  
  const [message, setMessage] = useState<string | null>(null);

  // Função de filtro para mostrar apenas boletos em aberto
  const filterOpenInvoices = (invoices: InvoiceData[]) => {
    return invoices.filter(invoice => invoice.status == 0);
  };


  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <InvoiceBaseAdmin
      isAdminView={true}
      filterInvoices={filterOpenInvoices}
      customTitle={t('openInvoicesTitle')}
    >
      {(context: InvoiceBaseContext) => {
        const { fetchInvoices, setMessage, toggleInvoiceDetails, invoices, wallet } = context;
        
        return (
          <>

          <button onClick={handleBackNavigation} className="border rounded button-line ml-2">
            {t('backButton')}
          </button> 
          &nbsp;
            {invoices.length === 0 && !context.message && (
              <div className="mb-6 rounded-md p-4 text-sm bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500 mt-4">
                {t('noOpenInvoices')}
              </div>
            )}
            
            <div className="text-sm text-gray-500 mt-2 mb-4">
              {t('pendingInvoicesCount', { count: invoices.length })}
            </div>
          </>
        );
      }}
    </InvoiceBaseAdmin>
  );
}
