import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useProfile } from '../../../context/ProfileContext';

import { PropertyData, InvestorData } from "../../../../services/web3-api";

interface InvestorsInfoPanelProps {
  propertyDetail: PropertyData;
  investorDetail: InvestorData;
}

const InvestorsInfoPanel: React.FC<InvestorsInfoPanelProps> = ({
  investorDetail,
}) => {
  const router = useRouter();

  const t = useTranslations('InvestorsInfoPanel');
  const { setCurrentProfile } = useProfile();
  const profile = investorDetail.profile;

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="p-6 mb-4">

      <div className="space-y-4 mt-4">

        <div className="pt-4 space-y-2">

          {investorDetail.profile === 2 ? (
            <>
              <button
                className="w-full border rounded button-line px-4 py-2 text-blue-600 hover:bg-blue-50"
                onClick={() => handleNavigation(`/connected/investorList`)}
              >
                {t('historyTitle')}
              </button>
            </>
          ) : (
            <>
              <button
                className="w-full border rounded button-line px-4 py-2 text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  setCurrentProfile(profile);
                  router.push("/connected/recordsMenu/");
                }}
              >
                {t('historyTitle')}
              </button>
            </>
          )

          }
        </div>
      </div>
    </div>
  );
};

export default InvestorsInfoPanel;