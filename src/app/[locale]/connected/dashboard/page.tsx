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
  const [propertyId] = useState<number>(DEFAULT_PROPERTY_ID);
  const [tenantDashboardPropertyId, setTenantDashboardPropertyId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [dashboardKind, setDashboardKind] = useState<FmzDashboardKind | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPrincipalRef = useRef<FmzAccessControlPrincipal | null>(null);

  useEffect(() => {
    setContextPropertyId(propertyId);
    setWallet(getWalletFromStorage());
    setTenantDashboardPropertyId(getTenantDashboardPropertyIdFromUrl());
  }, [propertyId, setContextPropertyId]);

  const loadAccess = useCallback(async () => {
    const accessToken = getFirmezaAccessToken();

    if (!accessToken) {
      setDashboardKind(null);
      setError(comm("pleaseLogin"));
      setIsLoadingAccess(false);
      return;
    }

    setIsLoadingAccess(true);
    setError(null);

    try {
      const principal = currentPrincipalRef.current ?? await getCurrentAccessControlPrincipal();
      currentPrincipalRef.current = principal;
      setDashboardKind(resolveDashboardKindFromAccess(principal));
    } catch (err) {
      if (isFirmezaApiError(err) && err.response?.status === 401) {
        setError("Sessão expirada ou não autorizada. Faça login novamente para carregar o dashboard.");
        return;
      }

      setError(err instanceof Error ? err.message : "Erro ao carregar permissões do dashboard.");
    } finally {
      setIsLoadingAccess(false);
    }
  }, [comm]);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  if (isLoadingAccess) return <DashboardLoadingState />;
  if (error) return <DashboardErrorState message={error} />;

  if (dashboardKind === "admin") return <AdminDashboardModule />;
  if (dashboardKind === "renter") return <RenterDashboardModule propertyId={tenantDashboardPropertyId} />;
  if (dashboardKind === "investor") return <CoOwnerDashboardModule propertyId={propertyId} wallet={wallet} />;
  if (dashboardKind === "legacyInvestor") return <LegacyCoOwnerDashboardModule propertyId={propertyId} wallet={wallet} />;

  return <FmzConnectedEmptyHome />;
}
