import React from "react";
import { PropertyData, RentDetailData, InvestorData } from "../../../../services/web3-api";

interface ProfileInfoPanelProps {
  rentDetail: RentDetailData;
  propertyDetail: PropertyData;
  investorDetail: InvestorData;
  wallet: string | null;
  handleNavigation: (path: string) => void;
}

const ProfileInfoPanel: React.FC<ProfileInfoPanelProps> = ({
  rentDetail,
  propertyDetail,
  investorDetail,
  wallet,
  handleNavigation
}) => {
  return (
    <div className="p-6 mb-4">
      {/* <h2 className="text-2xl font-bold text-gray-900 mb-4">Informações do Inquilino</h2> */}

      <div className="space-y-4">
        <div>
          <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
            Minha Chave de Propriedade:
          </div>
          <h2 className="text-[9px] sm:text-[9px] md:text-xs font-bold text-gray-900 mb-2">
            {wallet}
          </h2>
        </div>
        {/* <div>
          <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
            Total de Tokens que me pertencem
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {investorDetail.propertyTokensCurrentFormat}
          </h2>
        </div> */}

        <div className="pt-4">
          <p className="font-bold text-left">
            <a
              className="text-blue-600 hover:text-blue-800"
              href={propertyDetail.blockExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visualizar no BlockExplorer
            </a>
          </p>
        </div>


        {/* <div className="pt-4 space-y-2">
          <button 
            className="w-full border rounded button-line px-4 py-2 text-blue-600 hover:bg-blue-50"
            onClick={() => handleNavigation("/connected/rentPayment")}
          >
            Pagamento de Aluguel
          </button>
          
          <button 
            className="w-full border rounded button-line px-4 py-2 text-blue-600 hover:bg-blue-50"
            onClick={() => handleNavigation("/connected/buyTokens")}
          >
            Compra de Tokens (Inquilino)
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default ProfileInfoPanel;