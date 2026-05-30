"use client";

import { useEffect, useRef, useState } from "react";
import { FmzConnectedEmptyHome } from "../../components/FmzConnectedEmptyHome";
import { FmzDashboardErrorState } from "../../components/FmzDashboardFeedback";
import { FmzRenterDashboardSkeleton } from "../../../../components/layout";
import { getDashboardErrorMessage, isMetadataNotAvailableError } from "../../domain/fmz-dashboard-module-errors";
import { getTenantDashboard, getCurrentTenantPaymentHistory } from "../../services";
import type { FmzTenantDashboard } from "../../domain/fmz-tenant-portal.types";
import type { FmzTenantPaymentHistoryItem } from "../../domain";
import { FmzRenterDashboard, hasRenterDashboardData } from "./index";

type RenterDashboardState = {
  dashboard: FmzTenantDashboard | null;
  paymentHistory: FmzTenantPaymentHistoryItem[];
};

const emptyState: RenterDashboardState = {
  dashboard: null,
  paymentHistory: [],
};

export function FmzRenterDashboardModule({ propertyId }: { propertyId: string | null }) {
  const requestSequenceRef = useRef(0);
  const [state, setState] = useState<RenterDashboardState>(emptyState);
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

        setState(emptyState);
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

  if (isLoading) return <FmzRenterDashboardSkeleton />;
  if (showEmptyHome) return <FmzConnectedEmptyHome />;
  if (error) return <FmzDashboardErrorState message={error} />;

  if (!hasRenterDashboardData(state.dashboard)) {
    return <FmzConnectedEmptyHome />;
  }

  return (
    <FmzRenterDashboard
      dashboard={state.dashboard!}
      paymentHistory={state.paymentHistory}
    />
  );
}
