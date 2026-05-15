"use client";

import { useEffect, useRef, useState } from "react";
import DashboardCoOwner from "../../DashboardCoOwner";
import { FmzConnectedEmptyHome } from "../../../../../features/connected-home/components/FmzConnectedEmptyHome";
import { getInvestorDetail as getCoOwnerDetail, getPropertyDetail, getRentDetail } from "../../../../../services/web3-api";
import type { InvestorData as CoOwnerData, PropertyData, RentDetailData } from "../../../../../services/web3-api";
import { DashboardErrorState, DashboardLoadingState } from "./DashboardFeedback";
import { getDashboardErrorMessage, isMetadataNotAvailableError } from "./dashboard-module-errors";
import { STANDARD_CO_OWNER_PROFILE_CODE } from "./co-owner-dashboard.constants";

type CoOwnerDashboardState = {
  coOwnerDetail: CoOwnerData | null;
  propertyDetail: PropertyData | null;
  rentDetail: RentDetailData | null;
};

const emptyCoOwnerDashboardState: CoOwnerDashboardState = {
  coOwnerDetail: null,
  propertyDetail: null,
  rentDetail: null,
};

export function CoOwnerDashboardModule({ propertyId, wallet }: { propertyId: number; wallet: string | null }) {
  const requestSequenceRef = useRef(0);
  const [state, setState] = useState<CoOwnerDashboardState>(emptyCoOwnerDashboardState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmptyHome, setShowEmptyHome] = useState(false);

  useEffect(() => {
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;

    async function loadCoOwnerDashboard() {
      if (!wallet) {
        setState(emptyCoOwnerDashboardState);
        setError("Faça login para carregar o dashboard de co-owner.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setShowEmptyHome(false);

      try {
        const [coOwnerDetail, propertyDetail, rentDetail] = await Promise.all([
          getCoOwnerDetail(propertyId, wallet),
          getPropertyDetail(propertyId),
          getRentDetail(propertyId),
        ]);

        if (requestSequence !== requestSequenceRef.current) return;

        if (!coOwnerDetail || !propertyDetail) {
          setShowEmptyHome(true);
          setState(emptyCoOwnerDashboardState);
          return;
        }

        setState({ coOwnerDetail, propertyDetail, rentDetail });
      } catch (error) {
        if (requestSequence !== requestSequenceRef.current) return;

        setState(emptyCoOwnerDashboardState);
        if (isMetadataNotAvailableError(error)) {
          setShowEmptyHome(true);
          return;
        }
        setError(getDashboardErrorMessage(error, "Erro ao carregar detalhes do co-owner."));
      } finally {
        if (requestSequence === requestSequenceRef.current) setIsLoading(false);
      }
    }

    void loadCoOwnerDashboard();
  }, [propertyId, wallet]);

  if (isLoading) return <DashboardLoadingState />;
  if (showEmptyHome) return <FmzConnectedEmptyHome />;
  if (error) return <DashboardErrorState message={error} />;
  if (!state.coOwnerDetail) return <DashboardErrorState message="Erro ao carregar detalhes do co-owner." />;

  return (
    <DashboardCoOwner
      coOwnerDetail={state.coOwnerDetail}
      rentDetail={state.rentDetail}
      propertyDetail={state.propertyDetail}
      profile={STANDARD_CO_OWNER_PROFILE_CODE}
    />
  );
}
