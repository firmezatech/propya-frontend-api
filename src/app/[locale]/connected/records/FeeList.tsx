'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { getFeeList, FeeType } from "../../../../services/web3-api";

export default function FeeList() {

  const router = useRouter();

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<FeeType[]>([]);
  const [totalValueCurrency, setTotalValueCurrency] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
  }, []);

  useEffect(() => {
    fetchData();
  }, [wallet]);

  const fetchData = async () => {
    if (!wallet) {
      setMessage("Por favor, faça o login.");
      return;
    }
    setMessage("Carregando ...");

    try {
      const eventDetails = await getFeeList();

      if (!eventDetails || !eventDetails.fees || eventDetails.fees.length === 0) {
        setMessage("Não há informações disponíveis.");
        setTransactionDetails([]);
        setTotalValueCurrency(0);
      } else {
        // Ordenação decrescente por invoiceId
        const sortedDetails = eventDetails.fees.slice().sort(
          (a, b) => Number(b.invoiceId) - Number(a.invoiceId)
        );

        setTransactionDetails(sortedDetails);
        setTotalValueCurrency(eventDetails.totalValueCurrency);
        setMessage(null);
      }
    } catch (err) {
      console.error("Erro ao carregar taxas", err);
      setMessage("Erro ao carregar dados de taxas.");
    }
  };

  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handleBackNavigation} className="border rounded button-line ml-2">
            &larr; Voltar
          </button>
        </div>

        <h1 className="text-2xl font-semibold mb-4">Taxas Recebidas</h1>

        {transactionDetails.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Recebida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Boleto#
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compra de  Tokens (7,5% da Compra de Tokens))
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distr.Aluguel (10% do Aluguel)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FMZ (Legado)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactionDetails.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.invoiceId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.purchaseTenantCurrency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.distrRentCurrency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.fmzYieldCurrency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.valueCurrency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-end items-center">
                <span className="font-medium text-gray-700 mr-2">Total:</span>
                <span className="text-lg font-semibold">{totalValueCurrency}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-md p-4 text-sm bg-blue-50 text-blue-700 border-l-4 border-blue-500">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}