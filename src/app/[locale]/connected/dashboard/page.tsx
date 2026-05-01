"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import DashboardRenter from "../DashboardRenter";
import DashboardInvestor from "../DashboardInvestor";
import DashboardAdmin from "../DashboardAdmin";
import { useProfile } from "app/context/ProfileContext";
import {
  getPropertyDetail,
  PropertyData,
  getRentDetail,
  RentDetailData,
  getInvestorDetail,
  InvestorData,
  getInvoiceOrRentDetail,
  InvoiceData
} from "../../../../services/web3-api";
import DashboardLegado from "../DashboardLegado";

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">Carregando...</p>
    </div>
  </div>
);

// Error component
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mx-auto mb-4">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados</h3>
        <p className="text-sm text-red-600">{message}</p>
      </div>
    </div>
  </div>
);

// Info component for informational messages
const InfoMessage = ({ message }: { message: string }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-blue-800 mb-2">Informação</h3>
        <p className="text-sm text-blue-600">{message}</p>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("DashboardRenter");
  const comm = useTranslations("Common");

  const { setPropertyId: setContextPropertyId } = useProfile();
  const [propertyId, setPropertyId] = useState<number>(1);
  const [wallet, setWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [investorDetail, setInvestorDetail] = useState<InvestorData | null>(null);
  const [rentDetail, setRentDetail] = useState<RentDetailData | null>(null);
  const [propertyDetail, setPropertyDetail] = useState<PropertyData | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [profile, setProfile] = useState<number>(99);

  // Initialize wallet and profile from localStorage
  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    const storedProfile = localStorage.getItem("profile");
    
    if (storedWallet) {
      setWallet(storedWallet);
    }
    if (storedProfile) {
      const profileValue = parseInt(storedProfile);
      setProfile(profileValue);
      // Only set propertyId context if not admin
      if (profileValue !== 0) {
        setContextPropertyId(propertyId);
      }
    } else {
      // If no profile is stored, set a default value
      setProfile(99);
    }
  }, [setContextPropertyId, propertyId]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!wallet) {
      console.log("⚠️ Usuário não está logado");
      setError(comm("pleaseLogin"));
      setIsLoading(false);
      return;
    }

    // For admin users, just set loading to false and return
    if (profile === 0) {
      console.log("ℹ️ Usuário é admin, não carregando dados específicos");
      setError(null); // Clear any existing error
      setIsLoading(false);
      setInvestorDetail(null);
      setRentDetail(null);
      setPropertyDetail(null);
      setInvoiceData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 Iniciando carregamento dos dados para propertyId:", propertyId);
      
      // Primeiro, vamos carregar o investorDetail para determinar o perfil correto
      console.log("🔄 Carregando detalhes do investidor para determinar perfil...");
      try {
        const investorData = await getInvestorDetail(propertyId, wallet);
        if (investorData) {
          setInvestorDetail(investorData);
          if (investorData.profile !== undefined) {
            console.log("ℹ️ Perfil do usuário atualizado:", investorData.profile);
            setProfile(investorData.profile);
            localStorage.setItem("profile", investorData.profile.toString());
          }
          console.log("✅ Detalhes do investidor carregados:", investorData);
        }
      } catch (investorError) {
        console.warn("⚠️ Usuário não é investidor:", investorError);
        setInvestorDetail(null);
        // Se não é investidor, assume que é locatário
        // setProfile(2);
        // localStorage.setItem("profile", "2");
      }

      // Then, get property details
      let propertyDetails;
      try {
        propertyDetails = await getPropertyDetail(propertyId);
        if (!propertyDetails) {
          console.error("❌ Propriedade não encontrada");
          throw new Error(t("propertyNotFound"));
        }
        setPropertyDetail(propertyDetails);
        console.log("✅ Detalhes da propriedade carregados:", propertyDetails);
      } catch (propertyError) {
        console.error("❌ Erro ao carregar propriedade:", propertyError);
        const errorMessage = propertyError instanceof Error ? propertyError.message : String(propertyError);
        if (errorMessage.includes('No metadata available') || errorMessage.includes('Sem metadados')) {
          throw new Error(t("propertyNotConfigured"));
        } else {
          throw new Error(t("propertyNotFound"));
        }
      }

      // Agora que temos o perfil correto, vamos carregar os dados específicos
      let apiCalls = [];
      
      // Sempre precisamos do rentDetail para todos os perfis
      apiCalls.push(getRentDetail(propertyId));
      
      // Se é locatário (profile 2), carrega os dados do boleto
      if (profile === 2) {
        console.log("🔄 Carregando dados do boleto para locatário...");
        apiCalls.push(getInvoiceOrRentDetail(propertyId));
      }
      
      const results = await Promise.allSettled(apiCalls);

      // Handle rent details (primeiro resultado sempre é rentDetail)
      const rentDetails = results[0];
      if (rentDetails.status === 'fulfilled') {
        const rentData = rentDetails.value as RentDetailData;
        setRentDetail(rentData);
        console.log("✅ Detalhes do aluguel carregados:", rentData);
      } else {
        console.error("❌ Erro ao carregar detalhes do aluguel:", rentDetails.reason);
        const errorMessage = rentDetails.reason instanceof Error ? rentDetails.reason.message : String(rentDetails.reason);
        if (errorMessage.includes('No metadata available') || errorMessage.includes('Sem metadados')) {
          setError(t("noMetadataAvailable"));
        } else {
          setError(t("errorLoadingRentDetails"));
        }
        return; // Stop processing if rent details fail
      }

      // Handle invoice details for profile 2
      if (profile === 2 && results[1]) {
        const invoiceDetails = results[1];
        if (invoiceDetails.status === 'fulfilled') {
          const invoiceData = invoiceDetails.value as InvoiceData;
          if ('invoiceId' in invoiceData) {
            setInvoiceData(invoiceData);
            console.log("✅ Detalhes do boleto carregados:", invoiceData);
          }
        } else if (invoiceDetails.status === 'rejected') {
          console.error("❌ Erro ao carregar detalhes do boleto:", invoiceDetails.reason);
          const errorMessage = invoiceDetails.reason instanceof Error ? invoiceDetails.reason.message : String(invoiceDetails.reason);
          if (errorMessage.includes('No metadata available') || errorMessage.includes('Sem metadados')) {
            console.warn("⚠️ Dados de boleto não disponíveis - isso é normal se não houver boletos pendentes");
            // Don't set error for missing invoice metadata as it's not critical
          } else {
            setError(t("errorLoadingInvoiceDetails"));
          }
          // Don't return here as invoice details are not critical
        }
      }

      // Validate critical data
      if (rentDetails.status === 'fulfilled') {
        const rentData = rentDetails.value as RentDetailData;
        if (!rentData.currentRentAsOwnerValue || !rentData.currentRentValue) {
          console.warn("⚠️ Dados de aluguel incompletos:", rentData);
        }
      }

      if (!propertyDetails.percentageMissingNumber || !propertyDetails.percentageBuyerNumber) {
        console.warn("⚠️ Dados de porcentagem incompletos:", propertyDetails);
      }

      console.log("✅ Todos os dados carregados com sucesso");

    } catch (err) {
      console.error("❌ Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : t("errorLoadingProperty"));
      setInvestorDetail(null);
      setRentDetail(null);
      setPropertyDetail(null);
      setInvoiceData(null);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, profile, propertyId, t, comm]);

  // Fetch data when wallet, profile, or propertyId changes
  useEffect(() => {
    if (wallet && propertyId) {
      console.log("🔄 Recarregando dados devido a mudança em wallet, profile ou propertyId");
      fetchData();
    }
  }, [fetchData, wallet, propertyId]);

  // Determine which component to render
  const renderContent = useMemo(() => {
    if (isLoading) {
      console.log("⏳ Exibindo loading skeleton");
      return <LoadingSkeleton />;
    }

    // For admin users, show the admin dashboard regardless of other states
    if (profile === 0) {
      console.log("👤 Renderizando dashboard admin");
      return <DashboardAdmin profile={profile} />;
    }

    if (error && profile !== 0) {
      console.log("❌ Exibindo mensagem de erro:", error);
      return <ErrorMessage message={error} />;
    }

    if (!propertyDetail && profile !== 0) {
      console.log("❌ Propriedade não encontrada");
      return <ErrorMessage message={t("propertyNotFound")} />;
    }

    // Determine profile: prioritize localStorage profile, then investorDetail profile
    const effectiveProfile = profile !== 99 ? profile : (investorDetail?.profile || undefined);
    
    console.log("🔍 Perfil efetivo determinado:", effectiveProfile);
    console.log("🔍 Profile do localStorage:", profile);
    console.log("🔍 Profile do investorDetail:", investorDetail?.profile);

    if(investorDetail?.profile === undefined){
      return <InfoMessage message={t("noInvestment")} />;
    }

    // Render appropriate dashboard based on effective profile
    if (effectiveProfile === 1 || effectiveProfile === 3) {
      console.log("👤 Renderizando dashboard investidor para perfil:", effectiveProfile);
     
      // Check if investorDetail is available for investor dashboard
      if (!investorDetail) {
        console.log("❌ Dados do investidor não disponíveis");
        return <ErrorMessage message={t("errorLoadingInvestorDetails")} />;
      }
      
      return (
        <DashboardInvestor
          investorDetail={investorDetail}
          rentDetail={rentDetail}
          propertyDetail={propertyDetail}
          profile={effectiveProfile}
        />
      );
    }
    else if (effectiveProfile === 4) {
      console.log("👤 Renderizando dashboard investidor legado para perfil:", effectiveProfile);
     
      // Check if investorDetail is available for investor dashboard
      if (!investorDetail) {
        console.log("❌ Dados do investidor não disponíveis");
        return <ErrorMessage message={t("errorLoadingInvestorDetails")} />;
      }
      
      return (
        <DashboardLegado
          investorDetail={investorDetail}
          rentDetail={rentDetail}
          propertyDetail={propertyDetail}
          profile={effectiveProfile}
        />
      );
    } else if (effectiveProfile === 2) {
      console.log("👤 Renderizando dashboard locatário para perfil:", effectiveProfile);
      return (
        <DashboardRenter
          rentDetail={rentDetail}
          propertyDetail={propertyDetail}
          profile={effectiveProfile}
          invoiceData={invoiceData}
        />
      );
    }

    // Default case - show error message
    console.log("❌ Perfil inválido:", effectiveProfile);
    return <ErrorMessage message={t("invalidProfile")} />;
  }, [isLoading, profile, error, propertyDetail, investorDetail, rentDetail, invoiceData, t]);

  return (
    <div className="container w-full">
      <main className="mt-4 mb-6">
        
        {renderContent}
      </main>
    </div>
  );
}