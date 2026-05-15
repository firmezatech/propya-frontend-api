"use client";

import { useEffect, useRef, useState } from "react";
import DashboardRenter from "../../DashboardRenter";
import { FmzConnectedEmptyHome } from "../../../../../features/connected-home/components/FmzConnectedEmptyHome";
import { hasRenterDashboardData } from "../../../../../features/renter-dashboard/components";
import { getTenantDashboardData } from "../../../../../features/renter-dashboard/services/fmz-tenant-dashboard-api";
import { getCurrentTenantPaymentHistory } from "../../../../../features/tenant-portal/services";
import type { FmzTenantPaymentHistoryItem } from "../../../../../features/tenant-portal/domain";
import type { InvoiceData, PropertyData, RentDetailData } from "../../../../../services/web3-api";
import { DashboardErrorState, DashboardLoadingState } from "./DashboardFeedback";
import { getDashboardErrorMessage, isMetadataNotAvailableError } from "./dashboard-module-errors";

type RenterDashboardState = {
  propertyDetail: PropertyData | null;
  rentDetail: RentDetailData | null;
  invoiceData: InvoiceData | null;
  renterName: string | null;
  referenceMonthLabel: string | null;
  paymentHistory: FmzTenantPaymentHistoryItem[];
};

const emptyRenterDashboardState: RenterDashboardState = {
  propertyDetail: null,
  rentDetail: null,
  invoiceData: null,
  renterName: null,
  referenceMonthLabel: null,
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
        const [tenantDashboardData, paymentHistory] = await Promise.all([
          getTenantDashboardData(propertyId),
          getCurrentTenantPaymentHistory(propertyId),
        ]);

        if (requestSequence !== requestSequenceRef.current) return;

        setState({
          propertyDetail: tenantDashboardData.propertyDetail,
          rentDetail: tenantDashboardData.rentDetail,
          invoiceData: tenantDashboardData.invoiceData,
          renterName: tenantDashboardData.renterName,
          referenceMonthLabel: tenantDashboardData.referenceMonthLabel,
          paymentHistory,
        });
        setShowEmptyHome(!hasRenterDashboardData(tenantDashboardData.propertyDetail, tenantDashboardData.rentDetail));
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

  if (!hasRenterDashboardData(state.propertyDetail, state.rentDetail)) {
    return <FmzConnectedEmptyHome />;
  }

  return (
    <DashboardRenter
      rentDetail={state.rentDetail}
      propertyDetail={state.propertyDetail}
      invoiceData={state.invoiceData}
      renterName={state.renterName}
      referenceMonthLabel={state.referenceMonthLabel}
      paymentHistory={state.paymentHistory}
    />
  );
}
