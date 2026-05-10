"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import DashboardRenter from "../DashboardRenter";
import DashboardInvestor from "../DashboardInvestor";
import DashboardAdmin from "../DashboardAdmin";
import DashboardLegado from "../DashboardLegado";
import { useProfile } from "app/context/ProfileContext";
import {
  getPropertyDetail,
  type PropertyData,
  getRentDetail,
  type RentDetailData,
  getInvestorDetail,
  type InvestorData,
  type InvoiceData,
} from "../../../../services/web3-api";
import { FmzConnectedEmptyHome } from "../../../../features/connected-home/components/FmzConnectedEmptyHome";
import { hasRenterDashboardData } from "../../../../features/renter-dashboard/components";
import { getCurrentAccessControlPrincipal } from "../../../../features/access-control/services";
import type { FmzAccessControlPrincipal } from "../../../../features/access-control/domain";
import { resolveDashboardKindFromAccess, type FmzDashboardKind } from "../../../../features/access-control/domain";
import { getTenantDashboardData } from "../../../../features/renter-dashboard/services/fmz-tenant-dashboard-api";
import { getFirmezaAccessToken } from "../../../../services/auth/auth-storage";
import { isFirmezaApiError } from "../../../../services/firmeza-api-client";

const DEFAULT_PROPERTY_ID = 1;
const LEGACY_INVESTOR_PROFILE_CODE = 4;
const STANDARD_INVESTOR_PROFILE_CODE = 3;

const LoadingSkeleton = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-blue-500" />
      <p className="text-lg text-gray-600">Carregando...</p>
    </div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex h-64 items-center justify-center">
    <div className="text-center">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-red-800">Erro ao carregar dados</h3>
        <p className="text-sm text-red-600">{message}</p>
      </div>
    </div>
  </div>
);

type DashboardDataState = {
  investorDetail: InvestorData | null;
  rentDetail: RentDetailData | null;
  propertyDetail: PropertyData | null;
  invoiceData: InvoiceData | null;
  renterName: string | null;
  referenceMonthLabel: string | null;
};

const emptyDashboardData: DashboardDataState = {
  investorDetail: null,
  rentDetail: null,
  propertyDetail: null,
  invoiceData: null,
  renterName: null,
  referenceMonthLabel: null,
};

const isMetadataNotAvailableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("No metadata available") || message.includes("Sem metadados") || message.toLowerCase().includes("metadata");
};

const getWalletFromStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wallet");
};

export default function DashboardPage() {
  const t = useTranslations("DashboardRenter");
  const comm = useTranslations("Common");
  const { setPropertyId: setContextPropertyId } = useProfile();
  const [propertyId] = useState<number>(DEFAULT_PROPERTY_ID);
  const [wallet, setWallet] = useState<string | null>(null);
  const [tenantDashboardPropertyId, setTenantDashboardPropertyId] = useState<string | null>(null);
  const currentPrincipalRef = useRef<FmzAccessControlPrincipal | null>(null);
  const activeFetchKeyRef = useRef<string | null>(null);
  const fetchSequenceRef = useRef(0);
  const [dashboardKind, setDashboardKind] = useState<FmzDashboardKind | null>(null);
  const [data, setData] = useState<DashboardDataState>(emptyDashboardData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shouldShowEmptyHome, setShouldShowEmptyHome] = useState<boolean>(false);

  useEffect(() => {
    setWallet(getWalletFromStorage());

    if (typeof window !== "undefined") {
      const nextPropertyId = new URLSearchParams(window.location.search).get("propertyId");
      setTenantDashboardPropertyId(nextPropertyId);
    }
  }, []);

  useEffect(() => {
    setContextPropertyId(propertyId);
  }, [propertyId, setContextPropertyId]);

  const resetData = useCallback(() => {
    setData(emptyDashboardData);
  }, []);

  const loadAccess = useCallback(async () => {
    if (currentPrincipalRef.current) {
      setDashboardKind(resolveDashboardKindFromAccess(currentPrincipalRef.current));
      return currentPrincipalRef.current;
    }

    const principal = await getCurrentAccessControlPrincipal();
    currentPrincipalRef.current = principal;
    setDashboardKind(resolveDashboardKindFromAccess(principal));
    return principal;
  }, []);

  const loadPropertyAndRent = useCallback(async () => {
    const propertyDetail = await getPropertyDetail(propertyId);
    if (!propertyDetail) throw new Error(t("propertyNotFound"));
    const rentDetail = await getRentDetail(propertyId);
    return { propertyDetail, rentDetail };
  }, [propertyId, t]);

  const loadRenterDashboard = useCallback(async () => {
    const tenantDashboardData = await getTenantDashboardData(tenantDashboardPropertyId);

    setData({
      investorDetail: null,
      propertyDetail: tenantDashboardData.propertyDetail,
      rentDetail: tenantDashboardData.rentDetail,
      invoiceData: tenantDashboardData.invoiceData,
      renterName: tenantDashboardData.renterName,
      referenceMonthLabel: tenantDashboardData.referenceMonthLabel,
    });
    setShouldShowEmptyHome(!hasRenterDashboardData(tenantDashboardData.propertyDetail, tenantDashboardData.rentDetail));
  }, [tenantDashboardPropertyId]);

  const loadInvestorDashboard = useCallback(async (kind: Extract<FmzDashboardKind, "investor" | "legacyInvestor">, investorWallet: string | null) => {
    if (!investorWallet) throw new Error(comm("pleaseLogin"));
    const [investorDetail, propertyAndRent] = await Promise.all([
      getInvestorDetail(propertyId, investorWallet),
      loadPropertyAndRent(),
    ]);

    if (!investorDetail) throw new Error(t("errorLoadingInvestorDetails"));

    setData({
      investorDetail,
      propertyDetail: propertyAndRent.propertyDetail,
      rentDetail: propertyAndRent.rentDetail,
      invoiceData: null,
      renterName: null,
      referenceMonthLabel: null,
    });
    setShouldShowEmptyHome(false);
  }, [comm, loadPropertyAndRent, propertyId, t]);

  const fetchData = useCallback(async () => {
    const nextWallet = wallet ?? getWalletFromStorage();
    const accessToken = getFirmezaAccessToken();
    const fetchKey = `${nextWallet ?? 'no-wallet'}:${tenantDashboardPropertyId ?? 'default-property'}`;

    if (!accessToken) {
      resetData();
      setIsLoading(false);
      setShouldShowEmptyHome(false);
      setError(comm("pleaseLogin"));
      return;
    }

    if (activeFetchKeyRef.current === fetchKey) {
      return;
    }

    activeFetchKeyRef.current = fetchKey;
    const fetchSequence = fetchSequenceRef.current + 1;
    fetchSequenceRef.current = fetchSequence;

    setWallet(nextWallet);
    setIsLoading(true);
    setError(null);
    setShouldShowEmptyHome(false);

    try {
      const principal = await loadAccess();
      if (fetchSequence !== fetchSequenceRef.current) return;

      const kind = resolveDashboardKindFromAccess(principal);
      setDashboardKind(kind);

      if (!kind) {
        resetData();
        setShouldShowEmptyHome(true);
        return;
      }

      if (kind === "admin") {
        resetData();
        return;
      }

      if (kind === "renter") {
        await loadRenterDashboard();
        return;
      }

      await loadInvestorDashboard(kind, nextWallet);
    } catch (err) {
      if (fetchSequence !== fetchSequenceRef.current) return;

      if (isMetadataNotAvailableError(err)) {
        resetData();
        setShouldShowEmptyHome(true);
        setError(null);
        return;
      }

      resetData();
      setShouldShowEmptyHome(false);

      if (isFirmezaApiError(err) && err.response?.status === 401) {
        setError("Sessão expirada ou não autorizada. Faça login novamente para carregar o dashboard.");
        return;
      }

      setError(err instanceof Error ? err.message : t("errorLoadingProperty"));
    } finally {
      if (fetchSequence === fetchSequenceRef.current) {
        setIsLoading(false);
      }
      activeFetchKeyRef.current = null;
    }
  }, [comm, loadAccess, loadInvestorDashboard, loadRenterDashboard, resetData, t, tenantDashboardPropertyId, wallet]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const renderContent = useMemo(() => {
    if (isLoading) return <LoadingSkeleton />;

    if (dashboardKind === "admin") {
      return <DashboardAdmin />;
    }

    if (shouldShowEmptyHome) {
      return <FmzConnectedEmptyHome />;
    }

    if (error) {
      return <ErrorMessage message={error} />;
    }

    if (dashboardKind === "renter") {
      if (!hasRenterDashboardData(data.propertyDetail, data.rentDetail)) {
        return <FmzConnectedEmptyHome />;
      }

      return (
        <DashboardRenter
          rentDetail={data.rentDetail}
          propertyDetail={data.propertyDetail}
          invoiceData={data.invoiceData}
          renterName={data.renterName}
          referenceMonthLabel={data.referenceMonthLabel}
        />
      );
    }

    if (dashboardKind === "investor") {
      if (!data.investorDetail) return <ErrorMessage message={t("errorLoadingInvestorDetails")} />;
      return (
        <DashboardInvestor
          investorDetail={data.investorDetail}
          rentDetail={data.rentDetail}
          propertyDetail={data.propertyDetail}
          profile={STANDARD_INVESTOR_PROFILE_CODE}
        />
      );
    }

    if (dashboardKind === "legacyInvestor") {
      if (!data.investorDetail) return <ErrorMessage message={t("errorLoadingInvestorDetails")} />;
      return (
        <DashboardLegado
          investorDetail={data.investorDetail}
          rentDetail={data.rentDetail}
          propertyDetail={data.propertyDetail}
          profile={LEGACY_INVESTOR_PROFILE_CODE}
        />
      );
    }

    return <FmzConnectedEmptyHome />;
  }, [dashboardKind, data, error, isLoading, shouldShowEmptyHome, t]);

  return <main className="w-full">{renderContent}</main>;
}
