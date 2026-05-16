"use client";

import { useEffect, useRef, useState } from "react";
import DashboardRenter from "../../DashboardRenter";
import { FmzConnectedEmptyHome } from "../../../../../features/connected-home/components/FmzConnectedEmptyHome";
import { hasRenterDashboardData } from "../../../../../features/renter-dashboard/components";
import { getTenantDashboard, getCurrentTenantPaymentHistory } from "../../../../../features/tenant-portal/services";
import type { FmzTenantDashboard } from "../../../../../features/tenant-portal/domain/fmz-tenant-portal.types";
import type { FmzTenantPaymentHistoryItem } from "../../../../../features/tenant-portal/domain";
import { DashboardErrorState, DashboardLoadingState } from "./DashboardFeedback";
import { getDashboardErrorMessage, isMetadataNotAvailableError } from "./dashboard-module-errors";

type RenterDashboardState = {
  dashboard: FmzTenantDashboard | null;
  paymentHistory: FmzTenantPaymentHistoryItem[];
};

const emptyRenterDashboardState: RenterDashboardState = {
  dashboard: null,
  paymentHistory: [],
};

export function RenterDashboardModule({ propertyId }: { propertyId: string | null }) {
  const requestSequenceRef = useRef(0);
  const [state, setState] = useState<RenterDashboardState>(emptyRenterDashboardState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmptyHome, setShowEmptyHome] = useState(false);

  useEffect(() => {
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;

    async function loadRenterDashboard() {
      setIsLoading(true);
      setError(null);
      setShowEmptyHome(false);

      try {
        const [payload, paymentHistory] = await Promise.all([
          getTenantDashboard(propertyId),
          getCurrentTenantPaymentHistory(propertyId),
        ]);

        if (requestSequence !== requestSequenceRef.current) return;

        const dashboard = payload.hasData === false ? null : payload.dashboard ?? null;

        setState({ dashboard, paymentHistory });
        setShowEmptyHome(!hasRenterDashboardData(dashboard));
      } catch (error) {
        if (requestSequence !== requestSequenceRef.current) return;

        setState(emptyRenterDashboardState);
        if (isMetadataNotAvailableError(error)) {
          setShowEmptyHome(true);
          return;
        }
        setError(getDashboardErrorMessage(error, "Erro ao carregar o dashboard da inquilina."));
      } finally {
        if (requestSequence === requestSequenceRef.current) setIsLoading(false);
      }
    }

    void loadRenterDashboard();
  }, [propertyId]);

  if (isLoading) return <DashboardLoadingState />;
  if (showEmptyHome) return <FmzConnectedEmptyHome />;
  if (error) return <DashboardErrorState message={error} />;

  if (!hasRenterDashboardData(state.dashboard)) {
    return <FmzConnectedEmptyHome />;
  }

  return (
    <DashboardRenter
      dashboard={state.dashboard!}
      paymentHistory={state.paymentHistory}
    />
  );
}
