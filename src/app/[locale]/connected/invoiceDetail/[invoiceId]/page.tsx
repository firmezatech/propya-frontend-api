"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useInvoiceDetails } from "../../components/invoice/UseInvoiceDetail";
import InvoiceItem from "../../components/invoice/InvoiceItem";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const invoiceId = params?.invoiceId ? Number(params.invoiceId) : null;
  
  const {
    invoiceDetail,
    maintenanceList,
    isLoading,
    errorMessage,
    fetchInvoiceData
  } = useInvoiceDetails(invoiceId, false); // Don't auto-fetch initially

  // Handle wallet authentication
  useEffect(() => {
    const handleWalletChange = () => {
      const storedWallet = localStorage.getItem("wallet");
      if (storedWallet) {
        setWallet(storedWallet);
      }
    };

    window.addEventListener("walletChanged", handleWalletChange);
    handleWalletChange();

    return () => {
      window.removeEventListener("walletChanged", handleWalletChange);
    };
  }, []);

  // Fetch invoice data when wallet is available
  useEffect(() => {
    if (!wallet) {
      setAuthMessage("Por favor, faça o login.");
      return;
    }

    if (invoiceId) {
      setAuthMessage("Carregando ...");
      fetchInvoiceData(invoiceId);
      setAuthMessage(null);
    } else {
      setAuthMessage("ID do boleto não encontrado.");
    }
  }, [wallet, invoiceId, fetchInvoiceData]);

  const handleBackNavigation = () => {
    router.back();
  };

  // Determine the message to show
  const displayMessage = authMessage || (isLoading ? "Carregando..." : errorMessage);

  return (
    <div className="container">
      <main className="mt-4 mb-6">
        <button
          onClick={handleBackNavigation}
          className="mb-4 border rounded button-line ml-2"
        >
          &larr; Voltar
        </button>

        <h1 className="text-2xl font-semibold mb-2">Boleto</h1>

        {invoiceDetail ? (
          <InvoiceItem
            invoice={invoiceDetail}
            maintenanceList={maintenanceList}
          />
        ) : (
          <p className="text-gray-500">{displayMessage}</p>
        )}
      </main>
    </div>
  );
}