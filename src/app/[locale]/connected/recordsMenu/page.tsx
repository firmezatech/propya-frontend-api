"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Wrench, HousePlus, Receipt, ArrowLeft } from 'lucide-react';
import { useTranslations } from "next-intl";

import RentAdjustPurchaseList from "../records/RentAdjustPurchaseList";
import RentAdjustIGPMList from "../records/RentAdjustIGPMList";
import TokensPurchaseRenterList from "../records/TokensPurchaseRenterList";
import InvoiceList from "../records/InvoiceList";
import MaintenanceTable from "../records/MaintenanceTable";

import { useProfile } from "app/context/ProfileContext";

type RecordsView = "invoices" | "tokensPurchaseRenter" | "adjustPurchase" | "adjustIGPM" | "maintenances";
type RecordsTab = "invoices" | "tokensPurchaseRenter" | "adjust" | "maintenance";

const TAB_VIEWS: Record<RecordsTab, RecordsView[]> = {
  invoices: ["invoices"],
  tokensPurchaseRenter: ["tokensPurchaseRenter"],
  adjust: ["adjustPurchase", "adjustIGPM"],
  maintenance: ["maintenances"],
};

const TARGET_MAP: Record<string, RecordsView> = {
  history: "invoices",
  tokens: "tokensPurchaseRenter",
  adjust: "adjustPurchase",
};

export default function RecordsMenuPage() {
  const t = useTranslations("Menu");
  const { propertyId } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetParam = searchParams.get('target');

  const [selectedView, setSelectedView] = useState<RecordsView>("invoices");
  const [activeTab, setActiveTab] = useState<RecordsTab>("invoices");

  useEffect(() => {
    if (targetParam && TARGET_MAP[targetParam]) {
      const view = TARGET_MAP[targetParam];
      setSelectedView(view);
      setActiveTab(resolveTabForView(view));
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [targetParam, router]);

  const resolveTabForView = (view: RecordsView): RecordsTab => {
    for (const [tab, views] of Object.entries(TAB_VIEWS) as [RecordsTab, RecordsView[]][]) {
      if (views.includes(view)) return tab;
    }
    return "invoices";
  };

  const handleTabClick = (tab: RecordsTab) => {
    setActiveTab(tab);
    setSelectedView(TAB_VIEWS[tab][0]);
  };

  const handleViewChange = (view: RecordsView) => {
    setSelectedView(view);
    setActiveTab(resolveTabForView(view));
  };

  const tabs: { id: RecordsTab; title: string; icon: React.ReactNode }[] = [
    { id: "invoices", title: t("outgoingPayments"), icon: <Receipt size={20} /> },
    { id: "tokensPurchaseRenter", title: t("purchaseToken"), icon: <HousePlus size={20} /> },
    { id: "adjust", title: t("rentAdjustment"), icon: <SlidersHorizontal size={20} /> },
    { id: "maintenance", title: t("maintenance"), icon: <Wrench size={20} /> },
  ];

  const renderSubOptions = () => {
    const views = TAB_VIEWS[activeTab];
    if (views.length <= 1) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            className={`p-2 rounded-lg border transition-all text-sm flex items-center gap-2 ${
              selectedView === view
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>{getViewTitle(view)}</span>
          </button>
        ))}
      </div>
    );
  };

  const getViewTitle = (view: RecordsView): string => {
    switch (view) {
      case "invoices": return t("outgoingPayments");
      case "tokensPurchaseRenter": return t("purchaseToken");
      case "adjustPurchase": return t("adjustAfterPurchase");
      case "adjustIGPM": return t("adjustByIGPM");
      case "maintenances": return t("maintenances");
    }
  };

  const renderContent = () => {
    switch (selectedView) {
      case "invoices": return <InvoiceList propertyId={propertyId} />;
      case "tokensPurchaseRenter": return <TokensPurchaseRenterList profile={2} propertyId={propertyId} />;
      case "adjustPurchase": return <RentAdjustPurchaseList propertyId={propertyId} />;
      case "adjustIGPM": return <RentAdjustIGPMList propertyId={propertyId} />;
      case "maintenances": return <MaintenanceTable propertyId={propertyId} />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] flex-1">
      <main className="mt-4 px-2 mb-6">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-gray-400 button-line-transparent border border-white text-sm">
            <ArrowLeft size={28} />
          </button>
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center text-sm gap-2 px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-blue-700 menu-item-active"
                  : "bg-white hover:bg-gray-50 text-gray-600 menu-item"
              }`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.icon}
              <span className="font-medium">{tab.title}</span>
            </button>
          ))}
        </div>

        {renderSubOptions()}

        <div className="bg-white rounded-lg shadow-md p-4">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
