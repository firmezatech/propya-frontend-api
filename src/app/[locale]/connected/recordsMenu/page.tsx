"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, SlidersHorizontal, Wrench, FileText, Settings, Users, ShoppingCart, BarChart, Receipt, ArrowLeft , HousePlus} from 'lucide-react';
import { useTranslations } from "next-intl";

import TokensPurchaseInvestorList from "../records/TokensPurchaseInvestorList";
import InvestorsList from "../records/InvestorsList";
import RentAdjustPurchaseList from "../records/RentAdjustPurchaseList";
import RentAdjustPurchaseInvestorList from "../records/RentAdjustPurchaseInvestorList";
import RentAdjustIGPMList from "../records/RentAdjustIGPMList";
//import RentDistributionList from "../records/RentDistributionList";
import RentDistributionList from "../records/RentDistributionAndRePurchasedTokensLists";
import TokensPurchaseRentList from "../records/TokensPurchaseRenterList";
import TokensRePurchaseList from "../records/TokensRePurchaseList";
import TokensRePurchaseListByInvestor from "../records/TokensRePurchaseListByInvestor";
import InvoiceList from "../records/InvoiceList";
import MaintenanceTable from "../records/MaintenanceTable";
import MaintenanceTableInvestor from "../records/MaintenanceTableInvestor";

import { useProfile } from "app/context/ProfileContext";

export default function _RecordsMenu() {
  const t = useTranslations("Menu");
  const common = useTranslations("Common");

  const { currentProfile, propertyId } = useProfile();
  console.log("RecordsMenu - currentProfile from context:", currentProfile);
  
  const searchParams = useSearchParams();
  const targetParam = searchParams.get('target');

  const profile = currentProfile;

  const router = useRouter();
  
  // Remove the target parameter from URL after it's been processed
  const removeTargetFromURL = () => {
    if (targetParam) {
      // Create new URL without the target parameter
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  };

  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<string>(""); // Default view
  const [activeTab, setActiveTab] = useState<string>(""); // Para as abas principais

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) setWallet(storedWallet);
  }, []);

  useEffect(() => {
    // Set initial view based on target parameter
    if (targetParam) {
      handleTargetParam(targetParam);
      // Remove target parameter after it's been processed
      removeTargetFromURL();
    }

    // Validate selected view based on profile
    const allowedViews = getViewsForProfile(profile);

    // Set initial view and tab based on profile if no target or invalid target
    if (!selectedView || !allowedViews.includes(selectedView)) {
      if (profile === 2) {
        setSelectedView("invoices");
        setActiveTab("invoices");
      } else {
        setSelectedView("paymentsInvestor");
        setActiveTab("paymentsInvestor");
      }
    }

    // Update active tab based on selected view
    if (selectedView === "invoices") {
      setActiveTab("invoices");
    } else if (selectedView === "tokensPurchaseRenter") {
      setActiveTab("tokensPurchaseRenter");
    } else if (selectedView === "adjustPurchase" || selectedView === "adjustIGPM") {
      setActiveTab("adjust");
    } else if (selectedView === "adjustPurchaseInvestor") {
      setActiveTab("adjustInvestor");
    } else if (selectedView === "maintenances") {
      setActiveTab("maintenance");
    } else if (selectedView === "maintenancesInvestor") {
      setActiveTab("maintenanceInvestor");
    } else if (selectedView === "paymentsInvestor") {
      setActiveTab("paymentsInvestor");
    } else if (selectedView === "tokensRePurchase") {
      setActiveTab("tokensRePurchase"); 
    } else if (selectedView === "tokensRePurchaseByInvestor") {
      setActiveTab("tokensRePurchaseByInvestor");            
    } else {
      setActiveTab("investors");
    }
  }, [profile, targetParam, selectedView]);

  // Handle target parameter
  const handleTargetParam = (target: string) => {
    const allowedViews = getViewsForProfile(profile);
    
    // Map target parameter to corresponding view
    switch (target) {
      case "history":
        if (allowedViews.includes("invoices")) {
          setSelectedView("invoices");
          setActiveTab("invoices");
        }
        break;
      case "tokens":
        if (profile == 2 && allowedViews.includes("tokensPurchaseRenter")) {
          setSelectedView("tokensPurchaseRenter");
          setActiveTab("tokensPurchaseRenter");
        }
        if (profile == 1 || profile == 3 || profile == 4 && allowedViews.includes("tokensRePurchaseByInvestor")) {  
          setSelectedView("tokensRePurchaseByInvestor");
          setActiveTab("tokensRePurchaseByInvestor");
        }
        break;
      case "adjust":
        if (profile == 2 && allowedViews.includes("adjustPurchase")) {
          setSelectedView("adjustPurchase");
          setActiveTab("adjust");
        }
        if (profile == 1 || profile == 3 && allowedViews.includes("adjustPurchaseInvestor")) {
          setSelectedView("adjustPurchaseInvestor");
          setActiveTab("adjustInvestor");
        }
        break;
      default:
        // Default views handled in the next useEffect
        break;
    }
  };

  const handleBackNavigation = () => {
    router.back();
  };

  const handleViewChange = (view: string) => {
    // Check if the view is allowed for the current profile
    const allowedViews = getViewsForProfile(profile);
    if (allowedViews.includes(view)) {
      setSelectedView(view);

      // Set the active tab based on the selected view
      if (view === "invoices") {
        setActiveTab("invoices");
      }else if (view === "tokensPurchaseRenter") {
        setActiveTab("tokensPurchaseRenter");
        } else if (view === "adjustPurchase" || view === "adjustIGPM") {
          setActiveTab("adjust");
      } else if (view === "adjustPurchaseInvestor") {
        setActiveTab("adjustInvestor");
      } else if (view === "maintenances") {
        setActiveTab("maintenance");
      } else if (view === "maintenancesInvestor") {
        setActiveTab("maintenanceInvestor");
      } else if (view === "paymentsInvestor") {
        setActiveTab("paymentsInvestor");
      } else if (view === "tokensRePurchase") {
        setActiveTab("tokensRePurchase");
      } else if (view === "tokensRePurchaseByInvestor") {
        setActiveTab("tokensRePurchaseByInvestor");                
      } else {
        setActiveTab("investors");
      }
    }
  };

  // Function to determine which views are available based on profile
  const getViewsForProfile = (profile: number | null) => {
    if (profile === 0) {
      // Admin - show all options
      return [
        "invoices",
        "adjustPurchase",
        "adjustPurchaseInvestor",
        "adjustIGPM",
        "paymentsInvestor",
        "investors",
        "tokensPurchaseRenter",
        "tokensPurchaseInvestor",
        "tokensRePurchase",
        "tokensRePurchaseByInvestor",
        "maintenances"
      ];
    } else if (profile === 1 || profile === 3) {
      // Show only investor-related options
      return [
        "paymentsInvestor",
        "maintenancesInvestor",
        "investors",
        "tokensPurchaseInvestor",
        "tokensRePurchaseByInvestor",
        "adjustPurchaseInvestor"
      ];
     }
      else if (profile == 4) {
        // Show only investor-related options
        return [
          "paymentsInvestor",
          "tokensPurchaseInvestor",
          "tokensRePurchaseByInvestor",
        ];
      
    } else if (profile === 2) {
      // Show renter-related options
      return [
        "invoices",
        "tokensPurchaseRenter",
        "adjustPurchase",
        "adjustIGPM",
        "maintenances",
      ];
    }

    // Default fallback
    return [""];
  };

  // Função para renderizar as abas principais
  const renderMainTabs = () => {
    const allowedViews = getViewsForProfile(profile);

    const mainTabs = [];

    // Tab Pagamentos
    if (allowedViews.includes("invoices")) {
      mainTabs.push({
        id: "invoices",
        // title: profile === 2 ? t("outgoingPayments") : t("incomingPayments"),
        title: t("outgoingPayments"),
        icon: <Wallet size={20} />
      });
    }

    // Tab Tokens
    if ((profile === 2 || profile === 0 ) && allowedViews.includes("tokensPurchaseRenter")) {
      mainTabs.push({
        id: "tokensPurchaseRenter",
        title: t("purchaseToken"),
        icon: <HousePlus size={20} />
      });
    }

    // Tab Reajustes
    if (allowedViews.includes("adjustPurchase") || allowedViews.includes("adjustIGPM")) {
      mainTabs.push({
        id: "adjust",
        title: t("rentAdjustment"),
        icon: <SlidersHorizontal size={20} />
      });
    }

    if (profile !== 2 && (allowedViews.includes("paymentsInvestor"))) {
      mainTabs.push({
        id: "paymentsInvestor",
        title: t("incomingPayments"),
        icon: <Wallet size={20} />
      });
    }
    
    // Tab Manutenção
    if (allowedViews.includes("maintenances")) {
      mainTabs.push({
        id: "maintenance",
        title: t('maintenance'),
        icon: <Wrench size={20} />
      });
    }

    
    if (allowedViews.includes("tokensRePurchase")) {
      mainTabs.push({
        id: "tokensRePurchase",
        title: t('distributionTokens'),
        icon: <ShoppingCart size={20} />
      });
    }

    if ((profile == 1 || profile == 3 || profile == 4) && allowedViews.includes("tokensRePurchaseByInvestor")) {
      mainTabs.push({
        id: "tokensRePurchaseByInvestor",
        title: t('yourTokens'),
        icon: <HousePlus size={20} />
      });
    }

    // Tab Investidores (para perfis 0, 1, 3)
    if (profile == 0 && (allowedViews.includes("investors") ||
       allowedViews.includes("tokensPurchaseInvestor"))) {
      mainTabs.push({
        id: "investors",
        title: t('coOwners'),
        icon: <Users size={20} />
      });
    }

    if (allowedViews.includes("adjustPurchaseInvestor")) {
      mainTabs.push({
        id: "adjustInvestor",
        title: t("rentAdjustment"),
        icon: <SlidersHorizontal size={20} />
      });
    }

    if (allowedViews.includes("maintenancesInvestor")) {
      mainTabs.push({
        id: "maintenanceInvestor",
        title: t('maintenance'),
        icon: <Wrench size={20} />
      });
    }
    return (
      <div className="flex gap-4 mb-6 overflow-x-auto py-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center text-sm gap-2 px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
              ? "bg-white text-blue-700 menu-item-active"
              : "bg-white hover:bg-gray-50 text-gray-600 menu-item"
              }`}
            onClick={() => {
              setActiveTab(tab.id);
              // Seleciona a primeira view compatível com a aba
              const compatibleViews = getViewsForTab(tab.id);
              const firstAllowedView = compatibleViews.find(view => allowedViews.includes(view));
              if (firstAllowedView) {
                setSelectedView(firstAllowedView);
              }
            }}
          >
            {tab.icon}
            <span className="font-medium">{tab.title}</span>
          </button>
        ))}
      </div>
    );
  };

  // Função para obter as views compatíveis com cada aba
  const getViewsForTab = (tabId: string) => {
    switch (tabId) {
      case "invoices":
        return ["invoices"];
      case "adjust":
        return ["adjustPurchase", "adjustIGPM"];
      case "maintenance":
        return ["maintenances"];
      case "tokensPurchaseRenter":
        return ["tokensPurchaseRenter"];        
      case "paymentsInvestor":
        return ["paymentsInvestor"];
      case "maintenanceInvestor":
        return ["maintenancesInvestor"];
      case "tokensRePurchase":
        return ["tokensRePurchase"];
      case "tokensRePurchaseByInvestor":
        return ["tokensRePurchaseByInvestor"];
      case "adjustInvestor":
        return ["adjustPurchaseInvestor"];
        case "investors":
        return ["investors", "tokensPurchaseInvestor"];
      default:
        return [];
    }
  };

  // Função para renderizar as sub-opções da aba atual
  const renderSubOptions = () => {
    const allowedViews = getViewsForProfile(profile);
    const subOptions = getViewsForTab(activeTab)
      .filter(view => allowedViews.includes(view))
      .map(view => {
        const option = {
          id: view,
          title: getViewTitle(view) || "",
          icon: getViewIcon(view)
        };
        return option;
      });

    // Se só tiver uma opção, não precisa mostrar
    if (subOptions.length <= 1) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {subOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleViewChange(option.id)}
            className={`
              p-2 rounded-lg border transition-all text-sm flex items-center gap-2
              ${selectedView === option.id
                ? "bg-blue-100 text-blue-700 border border-blue-00"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"}
            `}
          >
            {option.icon}
            <span>{option.title}</span>
          </button>
        ))}
      </div>
    );
  };

  // Função auxiliar para obter o ícone de cada view
  const getViewIcon = (view: string) => {
    switch (view) {
      case "invoices":
        return <Wallet size={16} />;
      case "adjustPurchase":
        return <BarChart size={16} />;
      case "adjustIGPM":
        return <SlidersHorizontal size={16} />;
      case "paymentsInvestor":
        return <Wallet size={16} />;
      case "investors":
        return <Users size={16} />;
      case "tokensPurchaseInvestor":
        return <ShoppingCart size={16} />;
      case "tokensPurchaseRenter":
        return <ShoppingCart size={16} />;
      case "tokensRePurchase":
        return <ShoppingCart size={16} />;
       case "tokensRePurchaseByInvestor":
        return <ShoppingCart size={16} />;  
      case "adjustInvestor":
        return <Wallet size={16} />;
      case "maintenances":
        return <Settings size={16} />;
      case "maintenancesInvestor":
        return <Settings size={16} />;  
      default:
        return <Settings size={16} />;
    }
  };

  // Função para renderizar o conteúdo selecionado
  const renderSelectedContent = () => {
    switch (selectedView) {
      case "invoices":
        return <InvoiceList propertyId={propertyId} />;
      case "adjustPurchase":
        return <RentAdjustPurchaseList propertyId={propertyId} />;
      case "adjustPurchaseInvestor":
        return <RentAdjustPurchaseInvestorList propertyId={propertyId} />;
      case "adjustIGPM":
        return <RentAdjustIGPMList propertyId={propertyId} />;
      case "maintenances":
        return <MaintenanceTable propertyId={propertyId} />;

      case "tokensPurchaseInvestor":
        return <TokensPurchaseInvestorList propertyId={propertyId} />;
      case "investors":
        return <InvestorsList profile={profile} propertyId={propertyId} />;
      case "paymentsInvestor":       
        return <RentDistributionList profile={profile} propertyId={propertyId} />;
      case "maintenancesInvestor":
        return <MaintenanceTableInvestor propertyId={propertyId} />;        
      case "tokensPurchaseRenter":
        return <TokensPurchaseRentList profile={profile} propertyId={propertyId} />;
      case "tokensRePurchase":
        return <TokensRePurchaseList profile={profile} propertyId={propertyId} />;
      case "tokensRePurchaseByInvestor":
        return <TokensRePurchaseListByInvestor profile={profile} propertyId={propertyId} />;        

      default:
        return null;
    }
  };

  // Função auxiliar para obter o título baseado na view selecionada
  const getViewTitle = (view: string = selectedView) => {
    switch (view) {
      case "invoices":
        return t('outgoingPayments');
      case "adjustPurchase":
        return t('adjustAfterPurchase');
      case "adjustPurchaseInvestor":
        return t('adjustAfterPurchase');
      case "adjustIGPM":
        return t('adjustByIGPM');
      case "maintenances":
        return t('maintenances');

      case "tokensPurchaseInvestor":
        return t('purchaseByCoOwners')
      case "investors":
        return t('ownersList');
      case "paymentsInvestor":
        return t('incomingPaymentRent');
      case "maintenancesInvestor":
        return t('maintenances');        
      case "tokensPurchaseRenter":
        return t('purchaseToken');
      case "tokensRePurchase":
        return t('distributionTokens');
      case "tokensRePurchaseByInvestor":
        return t('yourTokens');

      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto">
      <main className="mt-4 px-2 mb-6">
        {/* Botão voltar */}
        <div className="mb-4">
          <button onClick={handleBackNavigation} className="text-gray-400 button-line-transparent border border-white text-sm">
            <ArrowLeft size={28} />
          </button>
        </div>

        {message && <div className="text-red-500 mb-4 text-sm">{message}</div>}

        {/* Abas principais de navegação */}
        {renderMainTabs()}

        {/* Sub-opções da aba atual, se houver */}
        {renderSubOptions()}

        {/* Área de conteúdo */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">
            {/* {getViewTitle()} */}
          </h2>
          {renderSelectedContent()}
        </div>
      </main>
    </div>
  );
}