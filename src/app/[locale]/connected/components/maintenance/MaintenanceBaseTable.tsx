"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useProfile } from '../../../../context/ProfileContext';

import {
  getMaintenanceList,
  MaintenanceData,
} from "../../../../../services/web3-api";

import MaintenanceTable from "./MaintenanceTable";

export interface MaintenanceBaseContext {
  wallet: string | null;
  message: string | null;
  maintenanceList: MaintenanceData[];
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

export default function MaintenanceBaseTable({ 
  children, 
  isAdminView = false,
  propertyId
}: MaintenanceBaseProps) {
  const router = useRouter();
  const common = useTranslations('Common');
  
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceData[]>([]);
  const [maintenanceTotal, setMaintenanceTotal] = useState<string>("");

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
  }, []);

  const fetchMaintenances = async () => {

    setMessage(common('loading'));

    try {
      const data = await getMaintenanceList(propertyId);
      
      // Ordenar por data (mais recente primeiro)
      const sortedData = [...data || []].sort((a, b) => {
        const dateA = new Date(a.maintenanceId).getTime();
        const dateB = new Date(b.maintenanceId).getTime();
        return dateB - dateA;
      });
      
      setMaintenanceList(sortedData);
      setMessage(null);
    } catch (err) {
      setMessage(common('errorLoadingData'));
    }
  };

  useEffect(() => {
    fetchMaintenances();
  }, [wallet, propertyId]);

  const handleBackNavigation = () => {
    router.back();
  };

  // Create context for children
  const contextValue: MaintenanceBaseContext = {
    wallet,
    message,
    maintenanceList,
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
          <div className={`mb-6 rounded-md p-4 text-sm ${
            message.includes('sucesso') 
              ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
          }`}>
            {message}
          </div>
        )}

        {maintenanceList.length > 0 && (
          <MaintenanceTable 
            maintenanceList={maintenanceList}
            propertyId={propertyId}
            
        />
        )}

        {!isAdminView && renderChildren()}
      </main>
    </div>
  );
}