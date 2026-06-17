"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useProfile } from "../../../app/context/ProfileContext";
import { getCurrentAccessControlPrincipal } from "../../access-control/services";
import { resolveDashboardKindFromAccess, type FmzDashboardKind } from "../../access-control/domain";
import type { FmzAccessControlPrincipal } from "../../access-control/domain";
import { getFirmezaAccessToken } from "../../../services/auth/auth-storage";
import { isFirmezaApiError } from "../../../services/firmeza-api-client";
import { getTenantDashboardPropertyIdFromUrl } from "../domain/fmz-dashboard-client-state";
import { FmzRenterDashboardModule } from "../../tenant-portal/renter-dashboard/components";
import { FmzDashboardErrorState } from "../../tenant-portal/components/FmzDashboardFeedback";
import { FmzRenterDashboardSkeleton } from "../../../components/layout";
import { FmzConnectedEmptyHome } from "../../tenant-portal/components/FmzConnectedEmptyHome";

const PROPERTY_ID = 1;

// ─── Access control hook ───────────────────────────────────────────────────────
// Encapsulates: token check → principal fetch → kind resolution → error state.
// Returns a stable, read-only snapshot; loading starts as true and resolves once.

type DashboardAccessState = {
  dashboardKind: FmzDashboardKind | null;
  isLoading:     boolean;
  error:         string | null;
};

function useDashboardAccess(): DashboardAccessState {
  const translations         = useTranslations("Common");
  const [dashboardKind, setDashboardKind] = useState<FmzDashboardKind | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const principalRef                      = useRef<FmzAccessControlPrincipal | null>(null);

  const loadAccess = useCallback(async () => {
    const accessToken = getFirmezaAccessToken();

    if (!accessToken) {
      setDashboardKind(null);
      setError(translations("pleaseLogin"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const principal = principalRef.current ?? await getCurrentAccessControlPrincipal();
      principalRef.current = principal;
      setDashboardKind(resolveDashboardKindFromAccess(principal));
    } catch (err) {
      const message = isFirmezaApiError(err) && err.response?.status === 401
        ? "Sessão expirada ou não autorizada. Faça login novamente para carregar o dashboard."
        : err instanceof Error ? err.message : "Erro ao carregar permissões do dashboard.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [translations]);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  return { dashboardKind, isLoading, error };
}

// ─── Module component ──────────────────────────────────────────────────────────

export function FmzDashboardModule() {
  const router = useRouter();
  const { setPropertyId: setContextPropertyId } = useProfile();
  const [tenantDashboardPropertyId, setTenantDashboardPropertyId] = useState<string | null>(null);
  const { dashboardKind, isLoading, error } = useDashboardAccess();

  useEffect(() => {
    setContextPropertyId(PROPERTY_ID);
    setTenantDashboardPropertyId(getTenantDashboardPropertyIdFromUrl());
  }, [setContextPropertyId]);

  useEffect(() => {
    if (dashboardKind === "admin") {
      router.push("/connected/admin-dashboard");
    }
  }, [dashboardKind, router]);

  if (isLoading) return <FmzRenterDashboardSkeleton />;
  if (error)     return <FmzDashboardErrorState message={error} />;
  if (dashboardKind === "admin")  return <FmzRenterDashboardSkeleton />;
  if (dashboardKind === "renter") return <FmzRenterDashboardModule propertyId={tenantDashboardPropertyId} />;

  return <FmzConnectedEmptyHome />;
}
