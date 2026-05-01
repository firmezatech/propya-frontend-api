"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from 'lucide-react';
import { X } from 'lucide-react';
import { useTranslations } from "next-intl";

import {
  MaintenanceData,
  InvestorData,
} from "../../../../../services/web3-api";

import { useInvoiceDetails } from "../invoice/UseInvoiceDetail";
import { InfoTooltip } from "../../../components/ui";

type Props = {
  maintenanceList: MaintenanceData[];
  propertyId: number;
  investorData?: InvestorData | null;
  maintenanceTotal?: string;
};

const MaintenanceTableInvestor: React.FC<Props> = ({ maintenanceList: initialMaintenanceList }) => {
  const t = useTranslations("MaintenanceTable");
  const common = useTranslations("Common");

  // Debug: Log dos dados recebidos
  console.log('🔍 MaintenanceTableInvestor - Dados recebidos:', initialMaintenanceList);
  if (initialMaintenanceList && initialMaintenanceList.length > 0) {
    console.log('📊 Exemplo de item de manutenção:', initialMaintenanceList[0]);
    console.log('📋 Campos específicos:');
    console.log('  - percentageInvest:', initialMaintenanceList[0].percentageInvest);
    console.log('  - maintenanceDiscountCo:', initialMaintenanceList[0].maintenanceDiscountCo);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [openDropdownMaint, setOpenDropdownMaint] = useState<number | null>(null);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceData[]>(initialMaintenanceList);
  const [message, setMessage] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null); // This should be properly initialized from your auth context

  const {
    invoiceDetail,
    isLoading,
    errorMessage,
    fetchInvoiceData,
    clearInvoiceData


  } = useInvoiceDetails(null, false);

  const openModal = (image: string) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage('');
  };

  const toggleDropdown = async (invoiceId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (openDropdown === invoiceId) {
      setOpenDropdown(null);
      clearInvoiceData();
    } else {
      setOpenDropdown(invoiceId);
      fetchInvoiceData(invoiceId);
    }
  };

  const toggleDropdownMaint = async (maintenanceId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (openDropdownMaint === maintenanceId) {
      setOpenDropdownMaint(null);
    } else {
      setOpenDropdownMaint(maintenanceId);
    }
  };

  // Clear data when dropdown is closed
  useEffect(() => {
    if (openDropdown === null) {
      clearInvoiceData();
    }
  }, [openDropdown]);

  // Update maintenance list when props change
  useEffect(() => {
    console.log('🔄 Props mudaram, atualizando maintenanceList:', initialMaintenanceList);
    setMaintenanceList(initialMaintenanceList);
  }, [initialMaintenanceList]);

  return (
    <div className="container mx-auto px-4">
    <main className="mt-4 mb-6">
      {maintenanceList && maintenanceList.length > 0 ? (
          <table className="min-w-full w-1/2 divide-y divide-gray-200">
            <thead className="bg-gray-50 px-6">
              <tr className="border-b border-gray-300">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{t("tableHeaders.date.line1")}</div>
                    <div>{t("tableHeaders.date.line2")}</div>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{t("tableHeaders.description.line1")}</div>
                    <div>{t("tableHeaders.description.line2")}</div>
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{t('tableHeaders.totalValue.line1')}</div>
                    <div className="flex items-center justify-end">
                      {t('tableHeaders.totalValue.line2')}&nbsp;
                      <InfoTooltip content={t('tooltips.totalValue')} />
                    </div>
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{t('tableHeaders.yourPropertyShare.line1')}</div>
                    <div className="flex items-center justify-end">
                      {t('tableHeaders.yourPropertyShare.line2')}&nbsp;
                      <InfoTooltip content={t('tooltips.yourPropertyShare')} />
                    </div>
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{t('tableHeaders.proportionalValue.line1')}</div>
                    <div className="flex items-center justify-end">
                      {t('tableHeaders.proportionalValue.line2')}&nbsp;
                      <InfoTooltip content={t('tooltips.proportionalValue')} />
                    </div>
                  </div>
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{t("tableHeaders.status.line1")}</div>
                    <div>{t("tableHeaders.status.line2")}</div>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{t("tableHeaders.records.line1")}</div>
                    <div>{t("tableHeaders.records.line2")}</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenanceList.map((item) => (
                <React.Fragment key={item.maintenanceId}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.dateCreated}</td>
                    <td className="px-2 py-2 whitespace-normal text-sm text-gray-500">{item.descriptionItem}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.priceResolution}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.percentageInvest}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.maintenanceDiscountCo}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                      {item.cancelled ? (
                        <span className="text-red-600 font-bold">{t("cancelled")}</span>
                      ) : (
                        item.invoiceId === 0 ? (
                          <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">{t("waiting")}</span>
                        ) : (
                          <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">{t("processed")}</span>
                        )
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <button
                        className="text-xs button-line-transparent px-2 py-1 flex items-center"
                        onClick={(e) => toggleDropdown(item.maintenanceId, e)}
                      >

                        <ChevronDown
                          size={16}
                          className={`ml-1 transition-transform ${openDropdownMaint === item.maintenanceId ? 'transform rotate-180' : ''}`}
                        />
                      </button>
                    </td>
                  </tr>

                  {/* Registro dropdown - shows maintenance details */}
                  {openDropdown === item.maintenanceId && (
                    <tr>
                      <td colSpan={7} className="px-4 py-2 bg-gray-50">
                        <div className="py-2">
                          <div className="text-sm">
                            <p className="font-medium mb-2">{t("recordDetails")} #{item.maintenanceId}</p>

                            <div className="p-4 border rounded bg-white shadow flex">
                              <div className="flex-1 pr-4">
                                <p className="text-sm mb-1">
                                  <strong>{t("resolution")}:</strong> {item.resolutionItem}
                                </p>
                                <p className="text-sm mb-1">
                                  <strong>{t("paymentDate")}:</strong> {item.nextDatePaymentRent}
                                </p>
                                {/* <p className="text-sm mb-1">
                                  <strong>{t("maintenanceDate")}:</strong> {item.dateCreated}
                                </p> */}
                                {item.cancelled && (
                                  <p className="text-sm text-red-600 font-bold">{t("cancelled")}</p>
                                )}
                              </div>
                              {item.metadataItem && item.metadataItem.length > 0 && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={item.metadataItem}
                                    alt={t("maintenanceImage")}
                                    className="max-w-md max-h-48 object-cover cursor-pointer"
                                    onClick={() => openModal(item.metadataItem)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                </React.Fragment>
              ))}
            </tbody>
          </table>
      ) : (
        <>
        
         {maintenanceList.length}
        <p className="text-sm text-center mb-4">{common('message')}</p>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative">
            <button
              onClick={closeModal}
              className="absolute button-circle-gray top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt={t("imageEnlarged")}
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}
        </main>
        </div>
  );

};

export default MaintenanceTableInvestor;
