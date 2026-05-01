'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { getInvestorJoinedList, InvestorJoinedType } from "../../../../services/web3-api";

export default function InvestorJoinedPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<InvestorJoinedType[]>([]);
  const [message, setMessage] = useState<string | null>(null);

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

    if (!wallet) {
      setMessage("Por favor, faça o login.");
      return;
    }
    setMessage("Carregando ...");

    const fetchData = async () => {
      try {
        const eventDetails = await getInvestorJoinedList();
        if (!eventDetails || eventDetails.length === 0) {
          setMessage("Não há informações disponíveis.");
          setTransactionDetails([]); // Limpa os detalhes da transação
        } else {
          setTransactionDetails(eventDetails);
          setMessage(null); // Limpa a mensagem de erro se houver dados
        }
      } catch (err) {
        console.error("Erro ao carregar distribuicao de aluguel:", err);
      }
    };

    if (wallet) {
      fetchData();
    }
  }, [wallet]);

  const handleBackNavigation = () => {
    router.back();
  }; 
  return (
    <div className="max-w-4xl mx-auto p-6">
       <button onClick={handleBackNavigation} className="mb-4 border rounded button-line ml-2">
        &larr; Voltar
      </button>     
      <h1 className="text-2xl font-semibold mb-2">Tokens Investidores</h1>
      <p className="text-gray-600 mb-4"></p>
      <div className="overflow-x-auto">
        {message ? (
          <p className="text-red-500">{message}</p>
        ) : (
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="border-b border-gray-300">
                 <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Carteira</th>
                <th className="p-3 text-left">Qtd Tokens </th>
                <th className="p-3 text-left">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactionDetails.map((item, index) => (
                <tr key={index} className={index === transactionDetails.length - 1 ? 'bg-gray-100' : ''}>
                  <td className="p-3 border-b">{item.date}</td>
                  <td className="p-3 border-b">{item.investor}</td>
                  <td className="p-3 border-b">{item.tokensInvested}</td>
                  <td className="p-3 border-b">{item.capitalValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}