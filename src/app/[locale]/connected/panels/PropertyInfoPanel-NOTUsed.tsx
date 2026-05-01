import React from "react";
import { PropertyData } from "../../../../services/web3-api";

interface PropertyInfoPanelProps {
  propertyDetail: PropertyData;
  investorProfile: number
}

const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({ propertyDetail, investorProfile }) => {
  return (
    <div className="p-6 mb-4">
      {/* <h2 className="text-gray-900"> Cada token representa uma parte do imóvel.</h2>
      {investorProfile === 2 ? (
        <h2 className="text-gray-900 mb-4"> 
        Ao adquirir todos, você conquista a propriedade total do imóvel.</h2>
      ) : ""} */}

      <div className="space-y-4">
        <div>
          <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
            Valor total do Imóvel
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {propertyDetail.propertyValueCurrency}
          </h2>
        </div>

        <div>
          <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
            Total de Tokens do Imóvel
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {propertyDetail.totalTokensNumberFormat}
          </h2>
        </div>

        {investorProfile === 2 ? (
          <>
            <div>
              <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
                Total de Tokens que você já adquiriu
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {propertyDetail.totalTokensRenterNumberFormat}
              </h2>
            </div>
            <div>
              <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
                Total de Tokens que Faltam para Concluir a Compra do Imóvel
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {propertyDetail.availableTokensBuyerNumberFormat}
              </h2>
            </div>
          </>
        ) : <>
          <div>
            <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
              Total de Tokens do Inquilino
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {propertyDetail.totalTokensRenterNumberFormat}
            </h2>
          </div>
          {/* <div>
            <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
              Total de Tokens de Investidores
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {propertyDetail.totalTokensInvestorsNumberFormat}
            </h2>
          </div> */}
          {/* <div>
            <div className="bg-gray-100 text-sm text-gray-500 px-3 py-2 rounded-lg">
              Tokens Disponíveis Para Investidor
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {propertyDetail.availableTokensInvestorsNumberFormat}
            </h2>
          </div> */}

        </>
        }
      </div>
    </div>
  );
};

export default PropertyInfoPanel;