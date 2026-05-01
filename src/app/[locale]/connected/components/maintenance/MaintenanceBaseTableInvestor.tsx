"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

import {
  getMaintenanceInvestorData,
  MaintenanceData,
  InvestorData,
  MaintenanceExpectedType,
} from "../../../../../services/web3-api";

import MaintenanceTableInvestor from "./MaintenanceTableInvestor";

export interface MaintenanceBaseContext {
  wallet: string | null;
  message: string | null;
  maintenanceList: MaintenanceData[];
  investorData: InvestorData | null;
  maintenanceExpected: MaintenanceExpectedType | null;
  propertyId: number;
  maintenanceTotal: string;
  setMessage: (msg: string | null) => void;
  fetchMaintenances: () => Promise<void>;
  handleBackNavigation: () => void;
}

interface MaintenanceBaseProps {
  children?: React.ReactNode | ((context: MaintenanceBaseContext) => React.ReactNode);
  isAdminView?: boolean;
  propertyId: number;
}

export default function MaintenanceBaseTableInvestor({
  children,
  isAdminView = false,
  propertyId,
}: MaintenanceBaseProps) {
  const router = useRouter();
  const t = useTranslations("MaintenanceTable");
  const common = useTranslations('Common');

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceData[]>([]);
  const [investorData, setInvestorData] = useState<InvestorData | null>(null);
  const [maintenanceExpected, setMaintenanceExpected] = useState<MaintenanceExpectedType | null>(null);
  const [maintenanceTotal, setMaintenanceTotal] = useState<string>("R$ 0,00");

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
  }, []);

  const fetchMaintenances = async () => {
    setMessage(common('loading'));

    if (!wallet) {
      setMessage(common('errorLoadingData'));
      return;
    }

    try {
      console.log(`🔍 Buscando dados completos para wallet ${wallet} na propriedade ${propertyId}`);
      
      const data = await getMaintenanceInvestorData(propertyId, wallet);

      if (!data) {
        setMessage(common('errorLoadingData'));
        return;
      }

      if (data.error) {
        console.error('Erro retornado pela API:', data.error);
        setMessage(common('errorLoadingData'));
        return;
      }

      // Atualizar todos os estados com os dados retornados
      setInvestorData(data.investorData);
      setMaintenanceTotal(data.maintenanceTotal);

      // Ordenar manutenções por data (mais recente primeiro)
      const sortedData = [...(data.maintenanceList || [])].sort((a, b) => {
        const dateA = new Date(a.dateCreated || 0).getTime();
        const dateB = new Date(b.dateCreated || 0).getTime();
        
        // Se as datas são inválidas, usar maintenanceId como fallback
        if (isNaN(dateA) || isNaN(dateB)) {
          return (b.maintenanceId || 0) - (a.maintenanceId || 0);
        }
        
        return dateB - dateA;
      });

      setMaintenanceList(sortedData);
      setMessage(null);

      console.log(`✅ Dados carregados: ${sortedData.length} manutenções, total: ${data.maintenanceTotal}`);

    } catch (err) {
      console.error('Erro ao carregar dados de manutenção e investidor:', err);
      setMessage(common('errorLoadingData'));
    }
  };

  useEffect(() => {
    if (wallet) {
      fetchMaintenances();
    }
  }, [wallet, propertyId]);

  const handleBackNavigation = () => {
    router.back();
  };

  // Create context for children
  const contextValue: MaintenanceBaseContext = {
    wallet,
    message,
    maintenanceList,
    investorData,
    maintenanceExpected,
    propertyId,
    maintenanceTotal,
    setMessage,
    fetchMaintenances,
    handleBackNavigation
  };

  // Determine what to render as children
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(contextValue);
    }
    return children;
  };

  return (
    <div className="container mx-auto px-4">
      <main className="mt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          {isAdminView && renderChildren()}
        </div>

        {message && (
          <div
            className={`mb-6 rounded-md p-4 text-sm ${message.includes('sucesso')
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              }`}
          >
            {message}
          </div>
        )}
 

        {maintenanceList.length > 0 ? (
          <MaintenanceTableInvestor
            maintenanceList={maintenanceList}
            propertyId={propertyId}
            investorData={investorData}
            maintenanceTotal={maintenanceTotal}
          />
        ) : (
          !message && (
            <div className="text-blue-700 border-blue-500">
              {t('message')}
            </div>
          )
        )}
        {!isAdminView && renderChildren()}
      </main>
    </div>
  );
}