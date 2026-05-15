"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useProfile } from "app/context/ProfileContext";
import { FmzConnectedEmptyHome } from "../../../../features/connected-home/components/FmzConnectedEmptyHome";
import { getCurrentAccessControlPrincipal } from "../../../../features/access-control/services";
import type { FmzAccessControlPrincipal } from "../../../../features/access-control/domain";
import { resolveDashboardKindFromAccess, type FmzDashboardKind } from "../../../../features/access-control/domain";
import { getFirmezaAccessToken } from "../../../../services/auth/auth-storage";
import { isFirmezaApiError } from "../../../../services/firmeza-api-client";
import { AdminDashboardModule } from "./_modules/AdminDashboardModule";
import { CoOwnerDashboardModule } from "./_modules/CoOwnerDashboardModule";
import { DashboardErrorState, DashboardLoadingState } from "./_modules/DashboardFeedback";
import { LegacyCoOwnerDashboardModule } from "./_modules/LegacyCoOwnerDashboardModule";
import { RenterDashboardModule } from "./_modules/RenterDashboardModule";
import { DEFAULT_PROPERTY_ID } from "./_modules/co-owner-dashboard.constants";
import { getTenantDashboardPropertyIdFromUrl, getWalletFromStorage } from "./_modules/dashboard-client-state";

export default function DashboardPage() {
  const comm = useTranslations("Common");
  const { setPropertyId: setContextPropertyId } = useProfile();
  const [wallet, setWallet] = useState<string | null>(null);
  const [tenantDashboardPropertyId, setTenantDashboardPropertyId] = useState<string | null>(null);
  const [dashboardKind, setDashboardKind] = useState<FmzDashboardKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const currentPrincipalRef = useRef<FmzAccessControlPrincipal | null>(null);
  const accessRequestSequenceRef = useRef(0);

  useEffect(() => {
    setWallet(getWalletFromStorage());
    setTenantDashboardPropertyId(getTenantDashboardPropertyIdFromUrl());
  }, []);

  useEffect(() => {
    setContextPropertyId(DEFAULT_PROPERTY_ID);
  }, [setContextPropertyId]);

  const loadAccess = useCallback(async () => {
    if (currentPrincipalRef.current) {
      return currentPrincipalRef.current;
    }

    const principal = await getCurrentAccessControlPrincipal();
    currentPrincipalRef.current = principal;
    return principal;
  }, []);

  useEffect(() => {
    const accessRequestSequence = accessRequestSequenceRef.current + 1;
    accessRequestSequenceRef.current = accessRequestSequence;

    async function resolveDashboardAccess() {
      const accessToken = getFirmezaAccessToken();

      if (!accessToken) {
        setIsLoadingAccess(false);
        setDashboardKind(null);
        setError(comm("pleaseLogin"));
        return;
      }

      setIsLoadingAccess(true);
      setError(null);

      try {
        const principal = await loadAccess();
        if (accessRequestSequence !== accessRequestSequenceRef.current) return;

        setDashboardKind(resolveDashboardKindFromAccess(principal));
      } catch (error) {
        if (accessRequestSequence !== accessRequestSequenceRef.current) return;

        if (isFirmezaApiError(error) && error.response?.status === 401) {
          setError("Sessão expirada ou não autorizada. Faça login novamente para carregar o dashboard.");
          setDashboardKind(null);
          return;
        }

        setError(error instanceof Error ? error.message : "Erro ao carregar acessos do dashboard.");
        setDashboardKind(null);
      } finally {
        if (accessRequestSequence === accessRequestSequenceRef.current) {
          setIsLoadingAccess(false);
        }
      }
    }

    void resolveDashboardAccess();
  }, [comm, loadAccess]);

  if (isLoadingAccess) return <DashboardLoadingState />;
  if (error) return <DashboardErrorState message={error} />;

  if (dashboardKind === "admin") return <AdminDashboardModule />;
  if (dashboardKind === "renter") return <RenterDashboardModule propertyId={tenantDashboardPropertyId} />;
  if (dashboardKind === "coOwner") return <CoOwnerDashboardModule propertyId={DEFAULT_PROPERTY_ID} wallet={wallet} />;
  if (dashboardKind === "legacyCoOwner") return <LegacyCoOwnerDashboardModule propertyId={DEFAULT_PROPERTY_ID} wallet={wallet} />;

  return <FmzConnectedEmptyHome />;
}
