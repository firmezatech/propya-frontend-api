"use client";

import { useEffect, useRef, useState } from "react";
import DashboardLegacyCoOwner from "../../DashboardLegacyCoOwner";
import { FmzConnectedEmptyHome } from "../../../../../features/connected-home/components/FmzConnectedEmptyHome";
import { getInvestorDetail as getCoOwnerDetail, getPropertyDetail, getRentDetail } from "../../../../../services/web3-api";
import type { InvestorData as CoOwnerData, PropertyData, RentDetailData } from "../../../../../services/web3-api";
import { DashboardErrorState, DashboardLoadingState } from "./DashboardFeedback";
import { getDashboardErrorMessage, isMetadataNotAvailableError } from "./dashboard-module-errors";
import { LEGACY_CO_OWNER_PROFILE_CODE } from "./co-owner-dashboard.constants";

type LegacyCoOwnerDashboardState = {
  coOwnerDetail: CoOwnerData | null;
  propertyDetail: PropertyData | null;
  rentDetail: RentDetailData | null;
};

const emptyLegacyCoOwnerDashboardState: LegacyCoOwnerDashboardState = {
  coOwnerDetail: null,
  propertyDetail: null,
  rentDetail: null,
};

export function LegacyCoOwnerDashboardModule({ propertyId, wallet }: { propertyId: number; wallet: string | null }) {
  const requestSequenceRef = useRef(0);
  const [state, setState] = useState<LegacyCoOwnerDashboardState>(emptyLegacyCoOwnerDashboardState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmptyHome, setShowEmptyHome] = useState(false);

  useEffect(() => {
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;

    async function loadLegacyCoOwnerDashboard() {
      if (!wallet) {
        setState(emptyLegacyCoOwnerDashboardState);
        setError("Faça login para carregar o dashboard de co-owner legado.");
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
          setState(emptyLegacyCoOwnerDashboardState);
          return;
        }

        setState({ coOwnerDetail, propertyDetail, rentDetail });
      } catch (error) {
        if (requestSequence !== requestSequenceRef.current) return;

        setState(emptyLegacyCoOwnerDashboardState);
        if (isMetadataNotAvailableError(error)) {
          setShowEmptyHome(true);
          return;
        }
        setError(getDashboardErrorMessage(error, "Erro ao carregar detalhes do co-owner legado."));
      } finally {
        if (requestSequence === requestSequenceRef.current) setIsLoading(false);
      }
    }

    void loadLegacyCoOwnerDashboard();
  }, [propertyId, wallet]);

  if (isLoading) return <DashboardLoadingState />;
  if (showEmptyHome) return <FmzConnectedEmptyHome />;
  if (error) return <DashboardErrorState message={error} />;
  if (!state.coOwnerDetail) return <DashboardErrorState message="Erro ao carregar detalhes do co-owner legado." />;

  return (
    <DashboardLegacyCoOwner
      coOwnerDetail={state.coOwnerDetail}
      rentDetail={state.rentDetail}
      propertyDetail={state.propertyDetail}
      profile={LEGACY_CO_OWNER_PROFILE_CODE}
    />
  );
}
