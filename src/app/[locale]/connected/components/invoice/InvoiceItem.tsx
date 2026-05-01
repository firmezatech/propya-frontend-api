"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { isZeroValue } from "services/format";
import { InvoiceData, MaintenanceData } from "../../../../../services/web3-api";
import MaintenanceItem from "../maintenance/MaintenanceItem";

type Props = {
  invoice: InvoiceData;
  maintenanceList: MaintenanceData[];
  isAdminView?: boolean;
  onConfirmPayment?: () => Promise<void>;
  isConfirming?: boolean;
  property?: number;
};

export default function InvoiceItem({
  invoice,
  maintenanceList,
  isAdminView = false,
  onConfirmPayment,
  isConfirming = false
}: Props) {
  const t = useTranslations("InvoiceItem");
  const router = useRouter();

  const [showMaintenance, setShowMaintenance] = useState(false);
  const [today, setToday] = useState<number>(0);

  useEffect(() => {
    setToday(Math.floor(Date.now() / 1000));
  }, []);

  return (
    <div className="p-4 border rounded bg-white shadow space-y-2 mt-4">
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <p className="text-sm">
            <strong>{t("invoiceNumber")}:</strong> {invoice.invoiceId}
          </p>
          <p className="text-sm">
            <strong>{t("propertyId")}:</strong> {invoice.propertyId}
          </p>
          <p className="text-sm">
            <strong>{t("dueDate")}:</strong> {invoice.dueDate}
          </p>
          {!isZeroValue(invoice.currentRentAsOwnerValue) && (
            <p className="text-sm">
              <strong>{t("rent")}:</strong> {invoice.currentRentAsOwnerValue}
            </p>
          )}
          {!isZeroValue(invoice.rentValueFee) && (
            <p className="text-sm">
              <strong>{t("rentValueFee")}:</strong> {invoice.rentValueFee}
            </p>
          )}
          {!isZeroValue(invoice.condoFee) && (
            <p className="text-sm">
              <strong>{t("condoFee")}:</strong> {invoice.condoFee}
            </p>
          )}
          {!isZeroValue(invoice.propertyTaxCurrency) && (
            <p className="text-sm">
              <strong>{t("propertyTax")}:</strong> {invoice.propertyTaxCurrency}
            </p>
          )}
          {maintenanceList?.length > 0 && (
            <>
              {!isZeroValue(invoice.maintenanceAsOwnerValue) && (
                <p className="text-sm">
                  <strong>{t("maintenanceCoOwner")}:</strong> {invoice.maintenanceAsOwnerValue}{" "}
                  <span className="text-sx"></span>
                </p>
              )}

              <button
                onClick={() => setShowMaintenance(!showMaintenance)}
                className="border rounded px-3 py-1 text-xs button-line"
              >
                {showMaintenance
                  ? t("hideMaintenanceDetails")
                  : t("showMaintenanceDetails")}
              </button>
              {showMaintenance && (
                <MaintenanceItem
                  maintenanceList={maintenanceList}
                  maintenanceTotal={invoice.maintenanceTotal}
                  isAdminView={isAdminView}
                />
              )}
            </>
          )}

          {!isZeroValue(invoice.tokensToBuyCurrency) && (
            <p className="text-sm">
              <strong>{t("tokenPurchase")}:</strong> {invoice.tokensToBuyCurrency}
            </p>
          )}
          {!isZeroValue(invoice.tokensToBuyFee) && (
            <p className="text-sm">
              <strong>{t("adminFee")}:</strong> {invoice.tokensToBuyFee}
            </p>
          )}
          {!isZeroValue(invoice.penaltyCurrency) && (
            <p className="text-sm">
              <strong>{t("penalty")}:</strong> {invoice.penaltyCurrency}
            </p>
          )}
          {!isZeroValue(invoice.interestCurrency) && (
            <p className="text-sm">
              <strong>{t("interest")}:</strong> {invoice.interestCurrency}
            </p>
          )}
         {invoice.delayDays > 0 && (
            <p className="text-sm text-red-600">
              <strong>{t("delayDays")}:</strong> {invoice.delayDays}
            </p>
          )}
          
          {invoice.earlyDays > 0 && (
              <p className="text-sm text-green-600">
                <strong>{t("earlyDays")}:</strong> {invoice.earlyDays}
              </p>
            )}
          <p className="text-sm">
            <strong>{t("total")}:</strong> {invoice.totalInvoice}
          </p> 

          <p
            className={`font-semibold ${invoice.status === 3 ? "text-green-600" : "text-blue-600"}`}
          >
            {
              invoice.status === 3 ? (
                <span className="text-green-600">✔️ {t("paid")}</span>
              ) : ((invoice.status === 0) && (invoice.dueDateNumber < today)) ? (
                <span className="text-red-600">❌ {t("overdue")}</span>
              ) : ((invoice.status === 0) && (invoice.dueDateNumber >= today)) ? (
                <span className="text-blue-600">🔵 {t("toPay")}</span>
              ) : invoice.status === 1 ? (
                <span className="text-orange-600">🚫 {t("cancelled")}
                  {invoice.cancellationReason && (
                    <>
                      <span className="text-xs font-normal"> - {t("cancellationReason")} {invoice.cancellationReason}</span>
                    </>
                  )}
                </span>
              ) : (
                <span className="text-gray-600">❓</span>
              )
            }
          </p>
        </div>

       
      </div>
    </div>
  );
}
