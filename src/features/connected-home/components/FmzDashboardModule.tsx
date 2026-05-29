"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useProfile } from "../../../app/context/ProfileContext";
import { getCurrentAccessControlPrincipal } from "../../access-control/services";
import { resolveDashboardKindFromAccess, type FmzDashboardKind } from "../../access-control/domain";
import type { FmzAccessControlPrincipal } from "../../access-control/domain";
import { getFirmezaAccessToken } from "../../../services/auth/auth-storage";
import { isFirmezaApiError } from "../../../services/firmeza-api-client";
import { getTenantDashboardPropertyIdFromUrl } from "../domain/fmz-dashboard-client-state";
import { FmzRenterDashboardModule } from "../../tenant-portal/renter-dashboard/components";
import { FmzDashboardErrorState, FmzDashboardLoadingState } from "../../tenant-portal/components/FmzDashboardFeedback";
import { FmzConnectedEmptyHome } from "../../tenant-portal/components/FmzConnectedEmptyHome";
import FmzDashboardAdmin from "./FmzDashboardAdmin";

const PROPERTY_ID = 1;

export function FmzDashboardModule() {
  const comm = useTranslations("Common");
  const { setPropertyId: setContextPropertyId } = useProfile();
  const [tenantDashboardPropertyId, setTenantDashboardPropertyId] = useState<string | null>(null);
  const [dashboardKind, setDashboardKind] = useState<FmzDashboardKind | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPrincipalRef = useRef<FmzAccessControlPrincipal | null>(null);

  useEffect(() => {
    setContextPropertyId(PROPERTY_ID);
    setTenantDashboardPropertyId(getTenantDashboardPropertyIdFromUrl());
  }, [setContextPropertyId]);

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

  if (isLoadingAccess) return <FmzDashboardLoadingState />;
  if (error) return <FmzDashboardErrorState message={error} />;
  if (dashboardKind === "admin") return <FmzDashboardAdmin />;
  if (dashboardKind === "renter") return <FmzRenterDashboardModule propertyId={tenantDashboardPropertyId} />;

  return <FmzConnectedEmptyHome />;
}
