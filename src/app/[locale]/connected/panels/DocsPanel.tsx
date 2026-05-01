import React from "react";
import { useTranslations } from 'next-intl';

import { RentDetailData } from "../../../../services/web3-api";

interface DocsPanelProps {
  rentDetail: RentDetailData;
}

const RenterInfoPanel: React.FC<DocsPanelProps> = ({
  rentDetail }) => {

  const t = useTranslations('DocsPanel');

  return (
    <div className="p-6 mb-4">

      <div className="space-y-4">
        <div>
          <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
          {t('contractDate')}: &nbsp; 
          <span className="text-sm font-bold text-gray-900 mb-2">
          {rentDetail.startDate}
          </span>
          </div>

        </div>


        <div>
          <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
          {t('contractCopyDoc')}
          </div>
          <h2 className="text-sm font-bold text-gray-900 mb-2">
            {/* INSERIR DOCUMENTO AQUI*/}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default RenterInfoPanel;