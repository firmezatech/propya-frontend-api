'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "app/context/ProfileContext";

import {
  getRentDetail, 
  RentDetailData,
  setRentAdjustment
} from "../../../../services/web3-api";

import RentAdjustIGPMList from "../records/RentAdjustIGPMList";

const RentAdjustmentAdminPage = () => {
  const router = useRouter();
  const { propertyId: contextPropertyId, currentProfile } = useProfile();
  
  const [propertyId, setPropertyId] = useState<number>(contextPropertyId || 1);
  const [profile, setProfile] = useState<number>(currentProfile || 0);
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rentDetail, setRentDetail] = useState<RentDetailData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [igpmValue, setIgpmValue] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(true);
  const [operationStatus, setOperationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // Add a key to force rerender of child components
  const [refreshListKey, setRefreshListKey] = useState(0);

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  const handleAdjustIGPM = async () => {
    if (!propertyId || isCreating || !igpmValue) return;
    
    setIsCreating(true);
    setMessage("Executando o reajuste IGPM...");
    
    try {
      const result = await setRentAdjustment(propertyId, igpmValue);
      
      // Mensagem de sucesso
      setMessage(`Aluguel reajustado com sucesso!`);
      setOperationStatus('success');
      setShowButton(false);
      
      // Recarregar os dados após operação bem-sucedida
      await fetchAllData();
      
      // Força o reload do componente da lista incrementando a key
      setRefreshListKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error("Erro ao reajustar aluguel:", error);
      setMessage(`Erro ao reajustar aluguel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setOperationStatus('error');
    } finally {
      setIsCreating(false);
    }
  };

  const fetchAllData = async () => {
    if (!wallet) return;

    try {
      const response = await fetch('/api/igpmOracle');
      const data = await response.json();
      
      if (response.ok) {
        console.log(data);
        setIgpmValue(data.igpm12m);
        setMessage(`Reajustar valor do IGPM - 12 meses - ${data.igpm12m}%`);
        setOperationStatus('idle');
        setShowButton(true);
      } else {
        setMessage(`Erro: ${data.message || 'Ocorreu um erro durante a consulta'}`);
        setOperationStatus('error');
      }
    } catch (error) {
      console.error("Erro ao obter dados da API ORACLE IGPM:", error);
      setMessage("Erro ao obter dados da API ORACLE IGPM. Tente novamente.");
      setOperationStatus('error');
    }

    try {
      const rentDetails = await getRentDetail(propertyId);
      setRentDetail(rentDetails);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao carregar aluguel.");
      setOperationStatus('error');
    }
  };

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
    // if (!wallet) {
    //   setMessage("Por favor, faça o login.");
    //   return;
    // }

    fetchAllData();
  }, [wallet, propertyId]);

  const handleBackNavigation = () => {
    router.back();
  };

  // Update propertyId when context changes
  useEffect(() => {
    if (contextPropertyId && currentProfile !== 0) {
      setPropertyId(contextPropertyId);
    }
  }, [contextPropertyId, currentProfile]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleBackNavigation} className="mb-4 border rounded button-line ml-2 px-4 py-2 hover:bg-gray-100">
          &larr; Voltar
        </button>
        <h1 className="text-xl font-medium text-gray-800"></h1>
      </div>

      {message && (
        <div className={`mb-6 rounded-md p-4 ${
          operationStatus === 'success' 
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
            : operationStatus === 'error'
              ? 'bg-red-50 text-red-700 border-l-4 border-red-500'
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <span className="text-lg font-medium">{message}</span>
              
              {operationStatus === 'success' && (
                <p className="mt-2 text-sm">
                  O valor do aluguel foi atualizado com sucesso conforme o índice IGPM.
                </p>
              )}
              
              {operationStatus === 'error' && (
                <p className="mt-2 text-sm">
                  Ocorreu um problema durante o reajuste. Por favor, tente novamente.
                </p>
              )}
            </div>
            
            {showButton && (
              <button 
                onClick={handleAdjustIGPM}
                disabled={isCreating || !wallet}
                className={`px-4 py-2 rounded-lg flex items-center ml-4 
                  ${isCreating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
                  text-white transition-colors`}
              >
                {isCreating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Executando...</span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span className="text-sm">Executar Reajuste</span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        {/* Pass the key to force rerender when data changes */}
        <RentAdjustIGPMList 
          key={refreshListKey} 
          propertyId={currentProfile === 0 ? undefined : propertyId}
        />
      </div>
    </div>
  );
};

export default RentAdjustmentAdminPage;