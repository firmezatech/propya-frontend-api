"use client";

import React, { useState } from "react";
import { InvoiceData, MaintenanceData } from "../../../../../services/web3-api";
import MaintenanceItem from "../maintenance/MaintenanceItem";

type Props = {
  invoice: InvoiceData;
  maintenanceList: MaintenanceData[];
};

export default function InvoiceItemSummary({
  invoice,
  maintenanceList
}: Props) {
  const [showMaintenance, setShowMaintenance] = useState(false);
  
  // Filter the maintenance list to only include items related to the current invoice
  const filteredMaintenanceList = maintenanceList.filter(
    (item) => item.invoiceId === invoice.invoiceId
  );

  return (
    <div className="p-4 border rounded bg-white shadow space-y-2 mt-4">
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <p className="text-sm">
            <strong>Boleto:</strong> {invoice.invoiceId}
          </p>
          <p className="text-sm">
            <strong>Data Vencimento:</strong> {invoice.dueDate}
          </p>
          <p className="text-sm">
            <strong>Manutenção Co-Proprietário:</strong> {invoice.maintenanceAsOwnerValue}{" "}
            <span className="text-sx"> </span>
          </p>

          {filteredMaintenanceList.length > 0 && (
            <>
              <button
                onClick={() => setShowMaintenance(!showMaintenance)}
                className="border rounded px-3 py-1 text-xs button-line"
              >
                {showMaintenance
                  ? "Ocultar detalhes da manutenção"
                  : "Ver detalhes da manutenção"}
              </button>
              {showMaintenance && (
                <MaintenanceItem
                  maintenanceList={filteredMaintenanceList}
                  maintenanceTotal={invoice.maintenanceTotal}
                  isAdminView={false}
                />
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}