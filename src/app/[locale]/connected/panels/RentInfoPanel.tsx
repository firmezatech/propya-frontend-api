import React, { useState, useEffect } from "react";
import { RentDetailData } from "../../../../services/web3-api";

interface RentInfoPanelProps {
  rentDetail: RentDetailData | null;
  investorProfile: number;
  handleNavigation: (path: string) => void;
}

const RentInfoPanel: React.FC<RentInfoPanelProps> = ({ rentDetail, investorProfile, handleNavigation }) => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      setWallet(storedWallet);
    }
  }, []);

  useEffect(() => {
    if (!wallet) {
      setMessage("Por favor, faça o login.");
      return;
    }
  }, [wallet]);

  return (
    <>
      {rentDetail ? (
        <div className="p-1 mb-4">
          <div className="space-y-1">
            <h2 className="text-xs text-gray-900">
              Valor Inicial:
              <span className="text-1xl font-bold text-gray-900"> {rentDetail.initialRentValue}</span>
            </h2>

            {rentDetail.currentRentValue !== rentDetail.initialRentValue && (
              <h2 className="text-xs text-gray-900">
                Valor Reajustado IGPM:
                <span className="text-1xl font-bold text-gray-900"> {rentDetail.currentRentValue}</span>
              </h2>
            )}

            <h2 className="text-xs text-gray-900">
              Valor Inquilino:
              <span className="text-1xl font-bold text-gray-900"> {rentDetail.currentRentAsOwnerValue}</span>
            </h2>

            <h2 className="text-xs text-gray-900">
              Valor Condomínio:
              <span className="text-1xl font-bold text-gray-900"> {rentDetail.condoFee}</span>
            </h2>

            <h2 className="text-xs text-gray-900">
              Compra de Tokens Mensal Estimada:
              <span className="text-1xl font-bold text-gray-900"> {rentDetail.tokensToBuy}</span>
            </h2>

            <hr className="mt-3 mb-3" />

            <h2 className="text-xs text-gray-900">
              Data Próximo Aluguel:
              <span className="text-1xl font-bold text-gray-900"> {rentDetail.nextDatePaymentRent}</span>
            </h2>

            <h2 className="text-xs text-gray-900">
              Data Contrato:
              <span className="text-1xl font-bold text-gray-900"> {rentDetail.startDate}</span>
            </h2>

            <h2 className="text-xs text-gray-900">
              Data Reajuste IGPM:
              <span className="text-1xl font-bold text-gray-900"> {rentDetail.nextDateAdjustment}</span>
            </h2>

            {/* <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <button 
                className="border rounded button-line px-4 py-2 text-blue-600 hover:bg-blue-50"
                onClick={() => handleNavigation("/connected/rentAdjustmentIGPM")}
              >
                Reajuste de Aluguel IGPM
              </button>
              
              <button 
                className="border rounded button-line px-4 py-2 text-blue-600 hover:bg-blue-50"
                onClick={() => handleNavigation("/connected/rentDistribution")}
              >
                Distribuição de Aluguel
              </button>
            </div> */}
          </div>
        </div>
      ) : (
        <div className="flex justify-start w-full">
          <div className="bg-gray-100 p-2 rounded-xl flex justify-between w-full mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {message && <p className="text-gray-500">{message}</p>}
            </h1>
          </div>
        </div>
      )}
    </>
  );
};

export default RentInfoPanel;